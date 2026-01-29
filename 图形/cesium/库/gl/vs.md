```c
#version 300 es

// 核心常量与结构体定义
const float czm_infinity = 5906376272000.0;

struct czm_ray {
    vec3 origin;
    vec3 direction;
};

struct czm_raySegment {
    float start;
    float stop;
};

const czm_raySegment czm_emptyRaySegment = czm_raySegment(-czm_infinity, -czm_infinity);

// 全局 uniform（大气散射+坐标变换核心）
uniform vec3 czm_atmosphereRayleighCoefficient;
uniform vec3 czm_atmosphereMieCoefficient;
uniform float czm_atmosphereMieScaleHeight;
uniform float czm_atmosphereRayleighScaleHeight;
uniform vec3 czm_viewerPositionWC;
uniform vec3 czm_sunDirectionWC;
uniform vec3 czm_lightDirectionWC;
uniform float czm_atmosphereDynamicLighting;
uniform mat4 czm_model;
uniform mat4 czm_modelView;
uniform mat4 czm_projection;

// 输出给片元着色器的 varying 变量
out vec3 v_atmosphereRayleighColor;
out vec3 v_atmosphereMieColor;
out float v_atmosphereOpacity;
out vec3 v_positionWC;
out vec3 v_positionEC;
out vec3 v_positionMC;
out vec2 v_texCoord_0;

// 近似 tanh 函数（大气散射优化）
float czm_approximateTanh(float x) {
    float x2 = x * x;
    return max(-1.0, min(1.0, x * (27.0 + x2) / (27.0 + 9.0 * x2)));
}

// 射线与球体相交检测（大气范围计算）
czm_raySegment czm_raySphereIntersectionInterval(czm_ray ray, vec3 center, float radius) {
    vec3 oc = ray.origin - center;
    float a = dot(ray.direction, ray.direction);
    float b = 2.0 * dot(ray.direction, oc);
    float c = dot(oc, oc) - radius * radius;
    float det = b * b - 4.0 * a * c;

    if (det < 0.0) return czm_emptyRaySegment;
    float sqrtDet = sqrt(det);
    return czm_raySegment((-b - sqrtDet) / (2.0 * a), (-b + sqrtDet) / (2.0 * a));
}

// 核心：计算大气散射（瑞利+米氏）
void czm_computeScattering(
    czm_ray primaryRay,
    float primaryRayLength,
    vec3 lightDirection,
    float atmosphereInnerRadius,
    out vec3 rayleighColor,
    out vec3 mieColor,
    out float opacity
) {
    const float ATMOSPHERE_THICKNESS = 111e3;
    const int PRIMARY_STEPS_MAX = 16;
    const int LIGHT_STEPS_MAX = 4;

    rayleighColor = vec3(0.0);
    mieColor = vec3(0.0);
    opacity = 0.0;

    float atmosphereOuterRadius = atmosphereInnerRadius + ATMOSPHERE_THICKNESS;
    czm_raySegment primaryRayAtmosphereIntersect = czm_raySphereIntersectionInterval(primaryRay, vec3(0.0), atmosphereOuterRadius);
    if (primaryRayAtmosphereIntersect == czm_emptyRaySegment) return;

    // 优化采样步数（根据大气位置动态调整）
    primaryRayAtmosphereIntersect.start = max(primaryRayAtmosphereIntersect.start, 0.0);
    primaryRayAtmosphereIntersect.stop = min(primaryRayAtmosphereIntersect.stop, primaryRayLength);
    float x_o_a = primaryRayAtmosphereIntersect.start - ATMOSPHERE_THICKNESS;
    float w_inside_atmosphere = 1.0 - 0.5 * (1.0 + czm_approximateTanh(x_o_a));
    int PRIMARY_STEPS = PRIMARY_STEPS_MAX - int(w_inside_atmosphere * 12.0);
    int LIGHT_STEPS = LIGHT_STEPS_MAX - int(w_inside_atmosphere * 2.0);

    // 初始化采样参数
    float rayPositionLength = primaryRayAtmosphereIntersect.start;
    float totalRayLength = primaryRayAtmosphereIntersect.stop - rayPositionLength;
    float rayStepLengthIncrease = w_inside_atmosphere * ((1.0 - 0.5 * (1.0 + czm_approximateTanh(1e-7 * primaryRayAtmosphereIntersect.stop / primaryRayLength))) * totalRayLength / (float(PRIMARY_STEPS * (PRIMARY_STEPS + 1)) / 2.0));
    float rayStepLength = max(1.0 - w_inside_atmosphere, 0.5 * (1.0 + czm_approximateTanh(1e-7 * primaryRayAtmosphereIntersect.stop / primaryRayLength))) * totalRayLength / max(7.0 * w_inside_atmosphere, float(PRIMARY_STEPS));

    vec3 rayleighAccumulation = vec3(0.0);
    vec3 mieAccumulation = vec3(0.0);
    vec2 opticalDepth = vec2(0.0);
    vec2 heightScale = vec2(czm_atmosphereRayleighScaleHeight, czm_atmosphereMieScaleHeight);

    // 主射线采样（计算散射积累）
    for (int i = 0; i < PRIMARY_STEPS_MAX; ++i) {
        if (i >= PRIMARY_STEPS) break;
        vec3 samplePosition = primaryRay.origin + primaryRay.direction * (rayPositionLength + rayStepLength);
        float sampleHeight = length(samplePosition) - atmosphereInnerRadius;
        vec2 sampleDensity = exp(-sampleHeight / heightScale) * rayStepLength;
        opticalDepth += sampleDensity;

        // 光线方向采样（计算光程光学深度）
        czm_ray lightRay = czm_ray(samplePosition, lightDirection);
        czm_raySegment lightRayAtmosphereIntersect = czm_raySphereIntersectionInterval(lightRay, vec3(0.0), atmosphereOuterRadius);
        float lightStepLength = lightRayAtmosphereIntersect.stop / float(LIGHT_STEPS);
        float lightPositionLength = 0.0;
        vec2 lightOpticalDepth = vec2(0.0);

        for (int j = 0; j < LIGHT_STEPS_MAX; ++j) {
            if (j >= LIGHT_STEPS) break;
            vec3 lightPosition = samplePosition + lightDirection * (lightPositionLength + lightStepLength * 0.5);
            float lightHeight = length(lightPosition) - atmosphereInnerRadius;
            lightOpticalDepth += exp(-lightHeight / heightScale) * lightStepLength;
            lightPositionLength += lightStepLength;
        }

        // 衰减计算 + 散射积累
        vec3 attenuation = exp(-(czm_atmosphereMieCoefficient * (opticalDepth.y + lightOpticalDepth.y) + czm_atmosphereRayleighCoefficient * (opticalDepth.x + lightOpticalDepth.x)));
        rayleighAccumulation += sampleDensity.x * attenuation;
        mieAccumulation += sampleDensity.y * attenuation;

        rayPositionLength += (rayStepLength += rayStepLengthIncrease);
    }

    rayleighColor = czm_atmosphereRayleighCoefficient * rayleighAccumulation;
    mieColor = czm_atmosphereMieCoefficient * mieAccumulation;
    opacity = length(exp(-(czm_atmosphereMieCoefficient * opticalDepth.y + czm_atmosphereRayleighCoefficient * opticalDepth.x)));
}

// 动态光源方向（太阳/场景光）
vec3 czm_getDynamicAtmosphereLightDirection(vec3 positionWC) {
    const float NONE = 0.0;
    const float SCENE_LIGHT = 1.0;
    const float SUNLIGHT = 2.0;
    return normalize(
        positionWC * float(czm_atmosphereDynamicLighting == NONE) +
        czm_lightDirectionWC * float(czm_atmosphereDynamicLighting == SCENE_LIGHT) +
        czm_sunDirectionWC * float(czm_atmosphereDynamicLighting == SUNLIGHT)
    );
}

// 地面大气散射计算（封装主逻辑）
void czm_computeGroundAtmosphereScattering(vec3 positionWC, vec3 lightDirection) {
    vec3 cameraToPositionWCDirection = normalize(positionWC - czm_viewerPositionWC);
    czm_ray primaryRay = czm_ray(czm_viewerPositionWC, cameraToPositionWCDirection);
    czm_computeScattering(
        primaryRay,
        length(positionWC - czm_viewerPositionWC),
        lightDirection,
        length(positionWC),
        v_atmosphereRayleighColor,
        v_atmosphereMieColor,
        v_atmosphereOpacity
    );
}

// 顶点属性输入
in vec3 a_positionMC;
in vec2 a_texCoord_0;

void main() {
    // 1. 初始化顶点属性
    v_positionMC = a_positionMC;
    v_texCoord_0 = a_texCoord_0;

    // 2. 坐标变换：模型坐标 (MC) → 眼坐标 (EC) → 裁剪坐标 (Clip)
    v_positionEC = (czm_modelView * vec4(a_positionMC, 1.0)).xyz;
    vec4 positionClip = czm_projection * vec4(v_positionEC, 1.0);

    // 3. 计算世界坐标 (WC)（大气散射必需）
    v_positionWC = (czm_model * vec4(a_positionMC, 1.0)).xyz;

    // 4. 计算大气散射
    vec3 lightDirection = czm_getDynamicAtmosphereLightDirection(v_positionWC);
    czm_computeGroundAtmosphereScattering(v_positionWC, lightDirection);

    // 5. 输出最终裁剪坐标
    gl_Position = positionClip;
}
```
