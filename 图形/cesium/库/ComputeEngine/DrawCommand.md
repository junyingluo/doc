```js
function DrawCommand(options) {
  options = options ?? Frozen.EMPTY_OBJECT;

  this._boundingVolume = options.boundingVolume;
  this._orientedBoundingBox = options.orientedBoundingBox;
  this._modelMatrix = options.modelMatrix;
  this._primitiveType = options.primitiveType ?? PrimitiveType.TRIANGLES;
  this._vertexArray = options.vertexArray;
  this._count = options.count;
  this._offset = options.offset ?? 0;
  this._instanceCount = options.instanceCount ?? 0;
  this._shaderProgram = options.shaderProgram;
  this._uniformMap = options.uniformMap;
  this._renderState = options.renderState;
  this._framebuffer = options.framebuffer;
  this._pass = options.pass;
  this._owner = options.owner;
  this._debugOverlappingFrustums = 0;
  this._pickId = options.pickId;
  this._pickMetadataAllowed = options.pickMetadataAllowed === true;
  this._pickedMetadataInfo = undefined;

  // Set initial flags.
  this._flags = 0;
  this.cull = options.cull ?? true;
  this.occlude = options.occlude ?? true;
  this.executeInClosestFrustum = options.executeInClosestFrustum ?? false;
  this.debugShowBoundingVolume = options.debugShowBoundingVolume ?? false;
  this.castShadows = options.castShadows ?? false;
  this.receiveShadows = options.receiveShadows ?? false;
  this.pickOnly = options.pickOnly ?? false;
  this.depthForTranslucentClassification =
    options.depthForTranslucentClassification ?? false;

  this.dirty = true;
  this.lastDirtyTime = 0;

  /**
   * @private
   */
  this.derivedCommands = {};
}
```

```js
DrawCommand.prototype.execute = function (context, passState) {
  context.draw(this, passState);
};
```

```js
Context.prototype.draw = function (
  drawCommand,
  passState,
  shaderProgram,
  uniformMap,
) {
  passState = passState ?? this._defaultPassState;
  // The command's framebuffer takes precedence over the pass' framebuffer, e.g., for off-screen rendering.
  const framebuffer = drawCommand._framebuffer ?? passState.framebuffer;
  const renderState = drawCommand._renderState ?? this._defaultRenderState;
  shaderProgram = shaderProgram ?? drawCommand._shaderProgram;
  uniformMap = uniformMap ?? drawCommand._uniformMap;

  beginDraw(this, framebuffer, passState, shaderProgram, renderState);
  continueDraw(this, drawCommand, shaderProgram, uniformMap);
};
```

```js
function beginDraw(
  context,
  framebuffer,
  passState,
  shaderProgram,
  renderState,
) {
  bindFramebuffer(context, framebuffer);
  applyRenderState(context, renderState, passState, false);
  shaderProgram._bind();

  context._maxFrameTextureUnitIndex = Math.max(
    context._maxFrameTextureUnitIndex,
    shaderProgram.maximumTextureUnitIndex,
  );
}
```

```js
function continueDraw(context, drawCommand, shaderProgram, uniformMap) {
  const primitiveType = drawCommand._primitiveType;
  const va = drawCommand._vertexArray;
  let offset = drawCommand._offset;
  let count = drawCommand._count;
  const instanceCount = drawCommand.instanceCount;

  context._us.model = drawCommand._modelMatrix ?? Matrix4.IDENTITY;
  shaderProgram._setUniforms(
    uniformMap,
    context._us,
    context.validateShaderProgram,
  );

  va._bind();
  const indexBuffer = va.indexBuffer;

  offset = offset * indexBuffer.bytesPerIndex; // offset in vertices to offset in bytes
  count = indexBuffer.numberOfIndices;
  context._gl.drawElements(
    primitiveType,
    count,
    indexBuffer.indexDatatype,
    offset,
  );

  va._unBind();
}
```

```js
ShaderProgram.prototype._setUniforms = function (
  uniformMap,
  uniformState,
  validate,
) {
  let len;
  let i;

  if (defined(uniformMap)) {
    const manualUniforms = this._manualUniforms;
    len = manualUniforms.length;
    for (i = 0; i < len; ++i) {
      const mu = manualUniforms[i];

      //>>includeStart('debug', pragmas.debug);
      if (!defined(uniformMap[mu.name])) {
        throw new DeveloperError(`Unknown uniform: ${mu.name}`);
      }
      //>>includeEnd('debug');

      mu.value = uniformMap[mu.name]();
    }
  }

  const automaticUniforms = this._automaticUniforms;
  len = automaticUniforms.length;
  for (i = 0; i < len; ++i) {
    const au = automaticUniforms[i];
    au.uniform.value = au.automaticUniform.getValue(uniformState);
  }

  ///////////////////////////////////////////////////////////////////

  // It appears that assigning the uniform values above and then setting them here
  // (which makes the GL calls) is faster than removing this loop and making
  // the GL calls above.  I suspect this is because each GL call pollutes the
  // L2 cache making our JavaScript and the browser/driver ping-pong cache lines.
  const uniforms = this._uniforms;
  len = uniforms.length;
  for (i = 0; i < len; ++i) {
    uniforms[i].set();
  }
};
```
