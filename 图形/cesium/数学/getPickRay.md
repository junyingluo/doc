### getPickRay

- 功能：世界坐标系下，求一条从相机位置通过像素点（windowPosition）的射线

* 相机的世界坐标为 camera.positionWC

* 像素点（windowPosition）的世界坐标
  - 将 canvas 坐标系（原点位于左上角，x 轴向右，y 轴向下）下的点（windowPosition）转化为 opengl 坐标系下的 x 和 y
    - $x = (2.0 / width) \cdot windowPosition.x - 1.0$
    - $y = (2.0 / height) \cdot (height - windowPosition.y) - 1.0$
  * camera.frustum 为世界坐标系下视锥体

    <img src="assets/getPickRay/gl_projectionmatrix14.png" width="30%" height="30%" />

  * 根据 camera.frustum，求出平面点的世界坐标
    - $top=near \cdot \tan{\dfrac{\theta}{2}}$
    - $right=top \cdot aspectRatio$
    - $aspectRatio=w / h$
    * $x=x \cdot right$
    * $y=y \cdot top$

```js
Camera.prototype.getPickRay = function (windowPosition, result) {
  return getPickRayPerspective(this, windowPosition, result);
};
function getPickRayPerspective(camera, windowPowindowPositionsition, result) {
  const canvas = camera._scene.canvas;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  const tanPhi = Math.tan(camera.frustum.fovy * 0.5);
  const tanTheta = camera.frustum.aspectRatio * tanPhi;
  const near = camera.frustum.near;

  const x = (2.0 / width) * windowPosition.x - 1.0;
  const y = (2.0 / height) * (height - windowPosition.y) - 1.0;

  const position = camera.positionWC;
  Cartesian3.clone(position, result.origin);

  const nearCenter = Cartesian3.multiplyByScalar(
    camera.directionWC,
    near,
    pickPerspCenter,
  );
  Cartesian3.add(position, nearCenter, nearCenter);
  const xDir = Cartesian3.multiplyByScalar(
    camera.rightWC,
    x * near * tanTheta,
    pickPerspXDir,
  );
  const yDir = Cartesian3.multiplyByScalar(
    camera.upWC,
    y * near * tanPhi,
    pickPerspYDir,
  );
  const direction = Cartesian3.add(nearCenter, xDir, result.direction);
  Cartesian3.add(direction, yDir, direction);
  Cartesian3.subtract(direction, position, direction);
  Cartesian3.normalize(direction, direction);

  return result;
}
```
