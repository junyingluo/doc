### pickPosition

- 功能：求像素点对应物体表面点的世界坐标

* 根据像素点（windowPosition）求对应的 depth

```js
function pickPosition(controller, mousePosition, result) {
  let depthIntersection = scene.pickPositionWorldCoordinates(
    mousePosition,
    scratchDepthIntersection,
  );
  return Cartesian3.clone(depthIntersection, result);
}
Picking.prototype.pickPositionWorldCoordinates = function (
  scene,
  windowPosition,
  result,
) {
  const cacheKey = windowPosition.toString();

  if (this._pickPositionCacheDirty) {
    this._pickPositionCache = {};
    this._pickPositionCacheDirty = false;
  } else if (this._pickPositionCache.hasOwnProperty(cacheKey)) {
    return Cartesian3.clone(this._pickPositionCache[cacheKey], result);
  }

  const { context, frameState, camera, defaultView } = scene;
  const { uniformState } = context;

  scene.view = defaultView;

  const drawingBufferPosition = SceneTransforms.transformWindowToDrawingBuffer(
    scene,
    windowPosition,
    scratchPosition,
  );
  ......
  drawingBufferPosition.y = scene.drawingBufferHeight - drawingBufferPosition.y;

  let frustum = camera.frustum.clone(scratchPerspectiveFrustum);

  const { frustumCommandsList } = defaultView;
  const numFrustums = frustumCommandsList.length;
  for (let i = 0; i < numFrustums; ++i) {
    const pickDepth = this.getPickDepth(scene, i);
    const depth = pickDepth.getDepth(
      context,
      drawingBufferPosition.x,
      drawingBufferPosition.y,
    );
    if (!defined(depth)) {
      continue;
    }
    if (depth > 0.0 && depth < 1.0) {
      const renderedFrustum = frustumCommandsList[i];
      let height2D;
      frustum.near =
        renderedFrustum.near * (i !== 0 ? scene.opaqueFrustumNearOffset : 1.0);
      frustum.far = renderedFrustum.far;
      uniformState.updateFrustum(frustum);

      result = SceneTransforms.drawingBufferToWorldCoordinates(
        scene,
        drawingBufferPosition,
        depth,
        result,
      );

      this._pickPositionCache[cacheKey] = Cartesian3.clone(result);
      return result;
    }
  }

  this._pickPositionCache[cacheKey] = undefined;
  return undefined;
};
```

### drawingBufferToWorldCoordinates

- 将 drawingBufferPosition 和 depth 生成 ndc 坐标
- 根据 ndc 坐标 和 inverseViewProjection，反推世界坐标（worldCoords）

```js
SceneTransforms.drawingBufferToWorldCoordinates = function (
  scene,
  drawingBufferPosition,
  depth,
  result,
) {
  const context = scene.context;
  const uniformState = context.uniformState;

  const currentFrustum = uniformState.currentFrustum;
  const near = currentFrustum.x;
  const far = currentFrustum.y;

  ......

  const viewport = scene.view.passState.viewport;
  const ndc = Cartesian4.clone(Cartesian4.UNIT_W, scratchNDC);
  ndc.x = ((drawingBufferPosition.x - viewport.x) / viewport.width) * 2.0 - 1.0;
  ndc.y =
    ((drawingBufferPosition.y - viewport.y) / viewport.height) * 2.0 - 1.0;
  ndc.z = depth * 2.0 - 1.0;
  ndc.w = 1.0;

  let worldCoords;
  let frustum = scene.camera.frustum;
  if (!defined(frustum.fovy)) {
    ......
  } else {
    worldCoords = Matrix4.multiplyByVector(
      uniformState.inverseViewProjection,
      ndc,
      scratchWorldCoords,
    );

    // Reverse perspective divide
    const w = 1.0 / worldCoords.w;
    Cartesian3.multiplyByScalar(worldCoords, w, worldCoords);
  }
  return Cartesian3.fromCartesian4(worldCoords, result);
};
```
