### 格式规范

```
{
  "asset": {
  },
  "geometricError": 4647.3687803438297124,
  "root": {
  }
}
```

### asset

- version 版本号
- gltfUpAxis：glTF 模型的 Up 轴

```
{
  "asset": {
    "version": "1.0",
    "gltfUpAxis": "Y"
  },
}
```

### root

- refine 当几何误差超过geometricError，则需要加载子瓦片
  - REPLACE：子瓦片替换父瓦片
  - ADD：子瓦片叠加父瓦片
- geometricError：当前瓦片的允许的最大几何误差
- boundingVolume
  - sphere 是包含tile的一个球体，格式是[x,y,z,r]，其中x,y,z是是球体的中心点，r为球体半径

```json
{
  "boundingVolume": {
    "sphere": [
      -2273681.5556669398210943, 4239516.2364768898114562,
      4174699.2869886201806366, 2323.6843901719198584
    ]
  },
  "refine": "REPLACE",
  "geometricError": 4647.3687803438297124,
  "children": [
    {
    "boundingVolume": {
      "sphere": [
        -2273572.4161012298427522,
        4239503.0689686601981521,
        4174793.6053042900748551,
        190.0535988252860022
      ]
    },
    "geometricError": 380.1071976505720045,
    "children": [
      {
        "boundingVolume": {
          "sphere": [
            -2273572.4161012298427522,
            4239503.0689686601981521,
            4174793.6053042900748551,
            190.0535988252860022
          ]
        },
        "geometricError": 8,
        "content": {
          "uri": "Data\/Tile_28\/Tile_28.json"
        }
      }
    ]
  ]
}
```

```js
// 假设：tileSphere = [x,y,z,r]，rootOrigin = new THREE.Vector3(rx,ry,rz)
// camera 是 THREE.PerspectiveCamera，renderer 已存在

// 构造本地化的球心
const centerWorld = new THREE.Vector3(
  tileSphere[0],
  tileSphere[1],
  tileSphere[2],
);
const centerLocal = centerWorld.clone().sub(rootOrigin);
const radius = tileSphere[3] || 0.1;

// 视锥剔除
const frustum = new THREE.Frustum();
const projScreenMatrix = new THREE.Matrix4();
projScreenMatrix.multiplyMatrices(
  camera.projectionMatrix,
  camera.matrixWorldInverse,
);
frustum.setFromProjectionMatrix(projScreenMatrix);
const sphere = new THREE.Sphere(centerLocal, radius);
const visible = frustum.intersectsSphere(sphere);
if (!visible) {
  // tile 不可见：可跳过加载或卸载已加载资源
}

// SSE（screen-space error）判断示例
function screenSpaceError(geometricError, camera, distance, viewportHeight) {
  const fov = (camera.fov * Math.PI) / 180;
  return (geometricError * viewportHeight) / (2 * distance * Math.tan(fov / 2));
}

// 常用的距离取法（到球心或到球表面）
const camToCenter = camera.position.distanceTo(centerLocal);
// 使用到球表面的距离可以更保守：
const distToSurface = Math.max(0.0001, camToCenter - radius);
const sse = screenSpaceError(
  tile.geometricError || 0,
  camera,
  distToSurface,
  renderer.domElement.clientHeight,
);

// 若 sse 大于阈值则细分（加载 children），否则使用当前 tile 内容
const SSE_THRESHOLD = 2.0;
if (sse > SSE_THRESHOLD && tile.children && tile.children.length > 0) {
  // refine -> 遍历 children
} else {
  // 加载 tile.content（如果存在）
}
```
