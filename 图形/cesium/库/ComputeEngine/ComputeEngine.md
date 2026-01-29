```js
ComputeEngine.prototype.execute = function (computeCommand) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("computeCommand", computeCommand);
  //>>includeEnd('debug');

  // This may modify the command's resources, so do error checking afterwards
  if (defined(computeCommand.preExecute)) {
    computeCommand.preExecute(computeCommand);
  }

  //>>includeStart('debug', pragmas.debug);
  if (
    !defined(computeCommand.fragmentShaderSource) &&
    !defined(computeCommand.shaderProgram)
  ) {
    throw new DeveloperError(
      "computeCommand.fragmentShaderSource or computeCommand.shaderProgram is required.",
    );
  }

  Check.defined("computeCommand.outputTexture", computeCommand.outputTexture);
  //>>includeEnd('debug');

  const outputTexture = computeCommand.outputTexture;
  const width = outputTexture.width;
  const height = outputTexture.height;

  const context = this._context;
  const vertexArray = defined(computeCommand.vertexArray)
    ? computeCommand.vertexArray
    : context.getViewportQuadVertexArray();
  const shaderProgram = defined(computeCommand.shaderProgram)
    ? computeCommand.shaderProgram
    : createViewportQuadShader(context, computeCommand.fragmentShaderSource);
  const framebuffer = createFramebuffer(context, outputTexture);
  const renderState = createRenderState(width, height);
  const uniformMap = computeCommand.uniformMap;

  const clearCommand = clearCommandScratch;
  clearCommand.framebuffer = framebuffer;
  clearCommand.renderState = renderState;
  clearCommand.execute(context);

  const drawCommand = drawCommandScratch;
  drawCommand.vertexArray = vertexArray;
  drawCommand.renderState = renderState;
  drawCommand.shaderProgram = shaderProgram;
  drawCommand.uniformMap = uniformMap;
  drawCommand.framebuffer = framebuffer;
  drawCommand.execute(context);

  framebuffer.destroy();

  if (!computeCommand.persists) {
    shaderProgram.destroy();
    if (defined(computeCommand.vertexArray)) {
      vertexArray.destroy();
    }
  }

  if (defined(computeCommand.postExecute)) {
    computeCommand.postExecute(outputTexture);
  }
};
```
