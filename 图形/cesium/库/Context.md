### 清屏

```js
OIT.prototype.update = function (
  context,
  passState,
  framebuffer,
  useHDR,
  numSamples,
) {
  if (!defined(this._compositeCommand)) {
    uniformMap = {
      u_opaque: function () {
        return that._opaqueTexture;
      },
      u_accumulation: function () {
        return that._accumulationTexture;
      },
      u_revealage: function () {
        return that._revealageTexture;
      },
    };
    this._compositeCommand = context.createViewportQuadCommand(fs, {
      uniformMap: uniformMap,
      owner: this,
    });
  }
};
Context.prototype.createViewportQuadCommand = function (
  fragmentShaderSource,
  overrides,
) {
  overrides = overrides ?? Frozen.EMPTY_OBJECT;

  return new DrawCommand({
    vertexArray: this.getViewportQuadVertexArray(),
    primitiveType: PrimitiveType.TRIANGLES,
    renderState: overrides.renderState,
    shaderProgram: ShaderProgram.fromCache({
      context: this,
      vertexShaderSource: ViewportQuadVS,
      fragmentShaderSource: fragmentShaderSource,
      attributeLocations: viewportQuadAttributeLocations,
    }),
    uniformMap: overrides.uniformMap,
    owner: overrides.owner,
    framebuffer: overrides.framebuffer,
    pass: overrides.pass,
  });
};
```

### 顶点着色器

```
in vec4 position;
in vec2 textureCoordinates;

out vec2 v_textureCoordinates;

void main()
{
    gl_Position = position;
    v_textureCoordinates = textureCoordinates;
}
```

### 片段着色器

```c
uniform sampler2D u_opaque;
uniform sampler2D u_accumulation;
uniform sampler2D u_revealage;

in vec2 v_textureCoordinates;

void main()
{
    vec4 opaque = texture(u_opaque, v_textureCoordinates);
    vec4 accum = texture(u_accumulation, v_textureCoordinates);
    float r = texture(u_revealage, v_textureCoordinates).r;

#ifdef MRT
    vec4 transparent = vec4(accum.rgb / clamp(r, 1e-4, 5e4), accum.a);
#else
    vec4 transparent = vec4(accum.rgb / clamp(accum.a, 1e-4, 5e4), r);
#endif

    out_FragColor = (1.0 - transparent.a) * transparent + transparent.a * opaque;

    if (opaque != czm_backgroundColor)
    {
        out_FragColor.a = 1.0;
    }
}
```
