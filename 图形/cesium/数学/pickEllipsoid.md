### pickEllipsoid

- 功能：求像素点对应椭球表面点的世界坐标

* 世界坐标系下，求一条从相机位置通过像素点（windowPosition）的射线 ray
* 求 ray 与椭球相交的点
  - 如果 start 大于 0, 则 start 为第一个交点，该点即为所求的世界坐标
  - 如果 start 小于 0, 则 stop 为第一个交点，该点即为所求的世界坐标

```js
Camera.prototype.pickEllipsoid = function (windowPosition, ellipsoid, result) {
  ellipsoid = ellipsoid ?? Ellipsoid.default;

  return pickEllipsoid3D(this, windowPosition, ellipsoid, result);
};
function pickEllipsoid3D(camera, windowPosition, ellipsoid, result) {
  ellipsoid = ellipsoid ?? Ellipsoid.default;
  const ray = camera.getPickRay(windowPosition, pickEllipsoid3DRay);
  const intersection = IntersectionTests.rayEllipsoid(ray, ellipsoid);
  if (!intersection) {
    return undefined;
  }

  const t = intersection.start > 0.0 ? intersection.start : intersection.stop;
  return Ray.getPoint(ray, t, result);
}
```

### IntersectionTests.rayEllipsoid

- 如果有两个交点，说明在射线起点在椭球外，返回 start 和 stop，并且 start 小于 stop
- 如果有一个交点，说明在射线起点在椭球内，则 start 为 0，而 stop 为其唯一一个交点
