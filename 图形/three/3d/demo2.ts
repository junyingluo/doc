import * as THREE from "three";

let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;

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

function render() {
  data.forEach(({ size, center }) => {
    scene.add(createBox(size, center));
  });

  if (!camera) {
    const box = new THREE.Box3();

    data.forEach(({ center, size }) => {
      const half = new THREE.Vector3(size.x / 2, size.y / 2, size.z / 2);
      const c = new THREE.Vector3(center.x, center.y, center.z);

      box.expandByPoint(c.clone().add(half));
      box.expandByPoint(c.clone().sub(half));
    });

    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    const fov = 45;
    const aspect = renderer.domElement.width / renderer.domElement.height;
    const distance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));

    camera = new THREE.PerspectiveCamera(fov, aspect, distance * 0.1, distance * 10);

    camera.position.set(center.x, center.y, center.z + distance * 1.2);
    camera.lookAt(center);
  }

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

  render();
}
