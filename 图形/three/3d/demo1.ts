import * as THREE from "three";
/* =========================
 * 非对称透视相机
 * ========================= */
class AsymmetricPerspectiveCamera extends THREE.Camera {
  left!: number;
  right!: number;
  bottom!: number;
  top!: number;
  near!: number;
  far!: number;

  constructor() {
    super();
    this.projectionMatrix = new THREE.Matrix4();
  }

  updateProjectionMatrix() {
    this.projectionMatrix.makePerspective(this.left, this.right, this.top, this.bottom, this.near, this.far);
  }
}

// /* =========================
//  * 示例数据
//  * ========================= */
const data = [
  {
    center: { x: -883.58, y: -627.63, z: -39.62 },
    size: { x: 21.94, y: 8.15, z: 2.57 },
  },
  {
    center: { x: -910.43, y: -583.21, z: -47.64 },
    size: { x: 6.6, y: 0.73, z: 0.26 },
  },
];

/* =========================
 * 线框 box
 * ========================= */
function createBox(
  size: { x: number; y: number; z: number },
  pos: { x: number; y: number; z: number },
  color = 0x00ff00
) {
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  const edges = new THREE.EdgesGeometry(geo);
  const mat = new THREE.LineBasicMaterial({ color });
  const box = new THREE.LineSegments(edges, mat);
  box.position.set(pos.x, pos.y, pos.z);
  return box;
}

function collectVertices(obstacles: any[]): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];

  obstacles.forEach(({ center, size }) => {
    const hx = size.x / 2;
    const hy = size.y / 2;
    const hz = size.z / 2;
    pts.push(new THREE.Vector3(center.x + hx, center.y + hy, center.z + hz));
    pts.push(new THREE.Vector3(center.x - hx, center.y - hy, center.z - hz));
  });

  return pts;
}

/* =========================
 * 全局变量
 * ========================= */
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let camera: AsymmetricPerspectiveCamera;

/* =========================
 * 核心：反解非对称透视
 * ========================= */
function setupAsymmetricCamera(obstacles: any[]) {
  const points = collectVertices(obstacles);

  // 世界 AABB
  const box = new THREE.Box3().setFromPoints(points);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  camera = new AsymmetricPerspectiveCamera();

  // 相机放在正前方
  const distance = size.length();
  camera.position.set(center.x, center.y, center.z + distance);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);

  // 世界 → 相机空间
  const view = camera.matrixWorldInverse.clone();
  const camPts = points.map((p) => p.clone().applyMatrix4(view));

  // near / far
  let near = Infinity;
  let far = 0;

  camPts.forEach((p) => {
    if (p.z < 0) {
      near = Math.min(near, -p.z);
      far = Math.max(far, -p.z);
    }
  });

  // left / right / top / bottom
  let left = Infinity;
  let right = -Infinity;
  let bottom = Infinity;
  let top = -Infinity;

  camPts.forEach((p) => {
    if (p.z < 0) {
      const x = (p.x * near) / -p.z;
      const y = (p.y * near) / -p.z;

      left = Math.min(left, x);
      right = Math.max(right, x);
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
  });

  // 应用
  camera.left = left;
  camera.right = right;
  camera.bottom = bottom;
  camera.top = top;
  camera.near = near;
  camera.far = far;

  camera.updateProjectionMatrix();
}

/* =========================
 * 渲染
 * ========================= */
function render() {
  renderer.render(scene, camera);
}

/* =========================
 * 初始化入口
 * ========================= */
export function initGL(canvas: HTMLCanvasElement) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf8f8f8);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  });

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // 添加 box
  data.forEach((o) => {
    scene.add(createBox(o.size, o.center));
  });

  // 相机
  setupAsymmetricCamera(data);

  render();
}
