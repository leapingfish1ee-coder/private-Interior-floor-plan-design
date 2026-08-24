import './style.css';
import * as THREE from 'three/webgpu';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { floors, WALL_HEIGHT, WALL_THICKNESS } from './plan.js';

const app = document.querySelector('#app');
const boot = document.querySelector('#boot');
const enterButton = document.querySelector('#enter');
const roomLabel = document.querySelector('#roomLabel');
const floorMode = document.querySelector('#floorMode');
const rendererMode = document.querySelector('#rendererMode');
const resetButton = document.querySelector('#reset');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9aa6b2);
scene.fog = new THREE.FogExp2(0xb4bdc5, 0.018);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 80);
camera.rotation.order = 'YXZ';

const worldRoot = new THREE.Group();
scene.add(worldRoot);

const hemi = new THREE.HemisphereLight(0xeaf1f7, 0x665a4d, 1.45);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff7e8, 4.0);
sun.position.set(-5, 11, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -14;
sun.shadow.camera.right = 14;
sun.shadow.camera.top = 14;
sun.shadow.camera.bottom = -14;
sun.shadow.bias = -0.0002;
scene.add(sun);

const skyFill = new THREE.DirectionalLight(0xbfd7ff, 1.1);
skyFill.position.set(9, 5, -5);
scene.add(skyFill);

const materials = {
  wall: new THREE.MeshStandardMaterial({ color: 0xeeeae2, roughness: 0.9, metalness: 0 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf5f3ef, roughness: 0.94 }),
  oak: new THREE.MeshStandardMaterial({ color: 0xb79b78, roughness: 0.76 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xb8bbb8, roughness: 0.7 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x292d32, roughness: 0.58 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf4f4f1, roughness: 0.5 }),
  fabric: new THREE.MeshStandardMaterial({ color: 0xa9aaa3, roughness: 0.96 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x8e684d, roughness: 0.72 }),
  accent: new THREE.MeshStandardMaterial({ color: 0x9c745a, roughness: 0.78 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xbfd9e5,
    roughness: 0.08,
    transmission: 0.58,
    transparent: true,
    opacity: 0.38,
    thickness: 0.02,
    ior: 1.45,
    side: THREE.DoubleSide
  }),
  water: new THREE.MeshPhysicalMaterial({
    color: 0x8db7c5,
    roughness: 0.15,
    transmission: 0.2,
    transparent: true,
    opacity: 0.72
  })
};

function meshBox(w, h, d, material, x, y, z, radius = 0) {
  const geometry = radius > 0
    ? new RoundedBoxGeometry(w, h, d, 4, radius)
    : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function wallMesh(segment) {
  const dx = segment.x2 - segment.x1;
  const dz = segment.z2 - segment.z1;
  const length = Math.hypot(dx, dz);
  const mesh = meshBox(length, WALL_HEIGHT, WALL_THICKNESS, materials.wall, 0, WALL_HEIGHT / 2, 0);
  mesh.position.x = (segment.x1 + segment.x2) / 2;
  mesh.position.z = (segment.z1 + segment.z2) / 2;
  mesh.rotation.y = -Math.atan2(dz, dx);
  return mesh;
}

function addWindow(group, data) {
  const thickness = 0.025;
  const geometry = data.axis === 'x'
    ? new THREE.BoxGeometry(data.w, data.h, thickness)
    : new THREE.BoxGeometry(thickness, data.h, data.w);
  const pane = new THREE.Mesh(geometry, materials.glass);
  pane.position.set(data.x, data.sill + data.h / 2, data.z);
  pane.castShadow = false;
  group.add(pane);
}

function addFloor(group, rect) {
  const material = materials[rect.material] ?? materials.oak;
  const slab = meshBox(rect.w, 0.08, rect.d, material, rect.x, -0.04, rect.z);
  slab.receiveShadow = true;
  group.add(slab);

  const ceiling = meshBox(rect.w, 0.055, rect.d, materials.ceiling, rect.x, WALL_HEIGHT + 0.0275, rect.z);
  ceiling.castShadow = false;
  group.add(ceiling);
}

function addTable(group, x, z, w, d) {
  group.add(meshBox(w, 0.07, d, materials.wood, x, 0.75, z, 0.035));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    group.add(meshBox(0.07, 0.72, 0.07, materials.dark, x + sx * w * 0.42, 0.36, z + sz * d * 0.42, 0.02));
  }
}

function addChair(group, x, z, rot = 0) {
  const chair = new THREE.Group();
  chair.position.set(x, 0, z);
  chair.rotation.y = rot;
  chair.add(meshBox(0.42, 0.08, 0.42, materials.fabric, 0, 0.46, 0, 0.035));
  chair.add(meshBox(0.42, 0.5, 0.08, materials.fabric, 0, 0.72, -0.18, 0.03));
  group.add(chair);
}

function addSofa(group, x, z, w = 2.0, rot = 0) {
  const sofa = new THREE.Group();
  sofa.position.set(x, 0, z);
  sofa.rotation.y = rot;
  sofa.add(meshBox(w, 0.34, 0.86, materials.fabric, 0, 0.28, 0, 0.08));
  sofa.add(meshBox(w, 0.58, 0.16, materials.fabric, 0, 0.58, -0.34, 0.07));
  group.add(sofa);
}

function addBed(group, x, z, w = 1.6, d = 2.05, rot = 0) {
  const bed = new THREE.Group();
  bed.position.set(x, 0, z);
  bed.rotation.y = rot;
  bed.add(meshBox(w, 0.25, d, materials.white, 0, 0.32, 0, 0.05));
  bed.add(meshBox(w, 0.6, 0.11, materials.wood, 0, 0.39, -d * 0.47, 0.035));
  bed.add(meshBox(w * 0.7, 0.12, 0.34, materials.fabric, 0, 0.55, -d * 0.31, 0.05));
  group.add(bed);
}

function addCabinet(group, x, z, w, d, h = 2.05, material = materials.wood) {
  group.add(meshBox(w, h, d, material, x, h / 2, z, 0.025));
}

function addFixtures(group, floor) {
  if (floor === 1) {
    addCabinet(group, 0.72, 1.08, 0.5, 1.55, 2.12, materials.accent);
    addCabinet(group, 2.05, 1.55, 2.62, 0.72, 0.92, materials.white);
    addTable(group, 2.12, 3.46, 1.34, 0.82);
    addChair(group, 1.34, 3.46, Math.PI / 2);
    addChair(group, 2.90, 3.46, -Math.PI / 2);
    addChair(group, 2.12, 2.86, 0);
    addChair(group, 2.12, 4.04, Math.PI);
    addSofa(group, 5.68, 3.12, 2.12, 0);
    group.add(meshBox(1.35, 0.34, 0.48, materials.wood, 5.68, 0.22, 2.20, 0.04));
    addCabinet(group, 6.92, 4.36, 1.20, 0.27, 0.74, materials.dark);
    addCabinet(group, 8.28, 3.56, 0.42, 1.50, 2.08, materials.white);
    addCabinet(group, 9.94, 6.06, 1.18, 0.40, 2.08, materials.wood);
    group.add(meshBox(1.42, 0.54, 0.86, materials.white, 10.54, 0.29, 1.52, 0.12));
    group.add(meshBox(1.08, 0.22, 0.56, materials.water, 10.54, 0.58, 1.52, 0.10));
    group.add(meshBox(0.82, 0.86, 0.46, materials.white, 8.95, 0.43, 2.94, 0.05));
  } else {
    addBed(group, 1.66, 3.54, 1.35, 1.95, 0);
    addCabinet(group, 0.46, 3.50, 0.34, 1.70, 2.04, materials.wood);
    addTable(group, 0.86, 0.72, 1.08, 0.50);
    addChair(group, 0.86, 1.22, Math.PI);
    addCabinet(group, 8.36, 1.12, 1.52, 0.48, 2.15, materials.wood);
    addCabinet(group, 10.34, 1.12, 1.52, 0.48, 2.15, materials.wood);
    addBed(group, 9.24, 3.90, 1.76, 2.05, 0);
    addCabinet(group, 7.82, 4.02, 0.38, 1.20, 2.05, materials.wood);
  }
}

function addStairs(group) {
  for (let i = 0; i < 13; i++) {
    group.add(meshBox(0.20, 0.10, 0.78, materials.wood, 4.78 + i * 0.18, 0.05 + i * 0.105, 0.52, 0.01));
  }
}

function addRoomLights(group, floor) {
  const points = floor === 1
    ? [[2.0,2.6],[5.7,2.8],[8.5,1.55],[10.55,1.7],[10.25,3.45],[9.15,5.72]]
    : [[1.65,3.35],[1.55,0.75],[5.75,2.5],[8.3,1.2],[10.2,1.3],[9.2,3.85]];

  for (const [x, z] of points) {
    const light = new THREE.PointLight(0xffe4bf, 18, 4.6, 2);
    light.position.set(x, 2.22, z);
    light.castShadow = false;
    group.add(light);

    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.05, 20), materials.white);
    lamp.position.set(x, 2.48, z);
    group.add(lamp);
  }
}

function buildFloor(floor) {
  worldRoot.clear();
  const group = new THREE.Group();
  const data = floors[floor];
  data.floorRects.forEach(rect => addFloor(group, rect));
  data.walls.forEach(seg => group.add(wallMesh(seg)));
  data.windows.forEach(win => addWindow(group, win));
  addFixtures(group, floor);
  addStairs(group);
  addRoomLights(group, floor);
  worldRoot.add(group);
}

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x758071, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.085;
ground.receiveShadow = true;
scene.add(ground);

let renderer = null;
let renderLoopInstalled = false;
let started = false;
let starting = false;
let currentFloor = 1;
let yaw = floors[1].start.yaw;
let pitch = 0;
const eyeHeight = 1.62;
const playerRadius = 0.23;
const keys = new Set();
const player = { x: floors[1].start.x, z: floors[1].start.z };

let RAPIER = null;
let physicsWorld = null;
let playerBody = null;
let playerCollider = null;
let characterController = null;
let physicsReady = false;

function setCameraFromPlayer() {
  const p = physicsReady && playerBody ? playerBody.translation() : player;
  camera.position.set(p.x, eyeHeight, p.z);
  camera.rotation.set(pitch, yaw, 0);
}
setCameraFromPlayer();
buildFloor(1);

async function createRenderer() {
  if (renderer) return renderer;

  rendererMode.textContent = '初始化…';
  try {
    const gpuRenderer = new THREE.WebGPURenderer({ antialias: true });
    gpuRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    gpuRenderer.setSize(innerWidth, innerHeight);
    gpuRenderer.shadowMap.enabled = true;
    gpuRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    gpuRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    gpuRenderer.toneMappingExposure = 1.08;
    await gpuRenderer.init();
    renderer = gpuRenderer;
    rendererMode.textContent = navigator.gpu ? 'WebGPU' : 'WebGL2 fallback';
  } catch (webgpuError) {
    console.warn('WebGPURenderer initialization failed, using stable WebGLRenderer.', webgpuError);
    const GL = await import('three');
    const glRenderer = new GL.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    glRenderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    glRenderer.setSize(innerWidth, innerHeight);
    glRenderer.shadowMap.enabled = true;
    glRenderer.shadowMap.type = GL.PCFSoftShadowMap;
    glRenderer.toneMapping = GL.ACESFilmicToneMapping;
    glRenderer.toneMappingExposure = 1.08;
    renderer = glRenderer;
    rendererMode.textContent = 'WebGL2 stable';
  }

  app.replaceChildren(renderer.domElement);
  installPointerControls();
  installRenderLoop();
  return renderer;
}

function createStaticBox(x, y, z, hx, hy, hz, rotationY = 0) {
  const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z);
  const body = physicsWorld.createRigidBody(bodyDesc);
  if (rotationY) {
    body.setRotation({ x: 0, y: Math.sin(rotationY / 2), z: 0, w: Math.cos(rotationY / 2) }, true);
  }
  physicsWorld.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz), body);
}

function rebuildPhysics(floor) {
  if (!RAPIER) return;
  physicsWorld = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

  for (const rect of floors[floor].floorRects) {
    createStaticBox(rect.x, -0.08, rect.z, rect.w / 2, 0.08, rect.d / 2);
  }

  for (const seg of floors[floor].walls) {
    const dx = seg.x2 - seg.x1;
    const dz = seg.z2 - seg.z1;
    const len = Math.hypot(dx, dz);
    const angle = -Math.atan2(dz, dx);
    createStaticBox(
      (seg.x1 + seg.x2) / 2,
      WALL_HEIGHT / 2,
      (seg.z1 + seg.z2) / 2,
      len / 2,
      WALL_HEIGHT / 2,
      WALL_THICKNESS / 2,
      angle
    );
  }

  const start = floors[floor].start;
  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(start.x, 0.85, start.z);
  playerBody = physicsWorld.createRigidBody(bodyDesc);
  playerCollider = physicsWorld.createCollider(RAPIER.ColliderDesc.capsule(0.52, 0.22), playerBody);
  characterController = physicsWorld.createCharacterController(0.015);
  characterController.enableAutostep(0.28, 0.18, true);
  characterController.enableSnapToGround(0.15);
  physicsReady = true;
}

async function initializePhysics() {
  try {
    const mod = await import('@dimforge/rapier3d');
    RAPIER = mod.default;
    await RAPIER.init();
    rebuildPhysics(currentFloor);
  } catch (error) {
    physicsReady = false;
    RAPIER = null;
    console.warn('Rapier unavailable; continuing with built-in collision fallback.', error);
  }
}

function pointSegmentDistance(px, pz, x1, z1, x2, z2) {
  const vx = x2 - x1;
  const vz = z2 - z1;
  const wx = px - x1;
  const wz = pz - z1;
  const len2 = vx * vx + vz * vz || 1;
  const t = Math.max(0, Math.min(1, (wx * vx + wz * vz) / len2));
  const cx = x1 + t * vx;
  const cz = z1 + t * vz;
  return Math.hypot(px - cx, pz - cz);
}

function insideFootprint(x, z) {
  const margin = playerRadius * 0.75;
  return floors[currentFloor].floorRects.some(rect =>
    x >= rect.x - rect.w / 2 + margin &&
    x <= rect.x + rect.w / 2 - margin &&
    z >= rect.z - rect.d / 2 + margin &&
    z <= rect.z + rect.d / 2 - margin
  );
}

function fallbackCanOccupy(x, z) {
  if (!insideFootprint(x, z)) return false;
  const minDistance = playerRadius + WALL_THICKNESS * 0.5;
  return floors[currentFloor].walls.every(seg =>
    pointSegmentDistance(x, z, seg.x1, seg.z1, seg.x2, seg.z2) > minDistance
  );
}

function roomAt(x, z) {
  for (const room of floors[currentFloor].rooms) {
    if (x >= room.minX && x <= room.maxX && z >= room.minZ && z <= room.maxZ) return room.name;
  }
  return `${currentFloor}F 连接空间`;
}

function resetPlayer() {
  const start = floors[currentFloor].start;
  yaw = start.yaw;
  pitch = 0;
  player.x = start.x;
  player.z = start.z;

  if (physicsReady && playerBody) {
    playerBody.setNextKinematicTranslation({ x: start.x, y: 0.85, z: start.z });
    physicsWorld.step();
  }
  setCameraFromPlayer();
}

function setFloor(floor) {
  currentFloor = floor;
  buildFloor(floor);
  floorMode.textContent = `${floor}F`;
  document.querySelectorAll('.floor').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.floor) === floor);
  });

  if (RAPIER) rebuildPhysics(floor);
  else physicsReady = false;
  resetPlayer();
}

function onLook(dx, dy, scale = 1) {
  yaw -= dx * 0.0021 * scale;
  pitch -= dy * 0.0018 * scale;
  pitch = THREE.MathUtils.clamp(pitch, -1.35, 1.35);
  setCameraFromPlayer();
}

let dragging = false;
let lastPointerX = 0;
let lastPointerY = 0;

function installPointerControls() {
  const canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', event => {
    if (!started) return;
    dragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
    if (event.pointerType === 'mouse' && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  });

  canvas.addEventListener('pointermove', event => {
    if (!started) return;
    if (document.pointerLockElement === canvas) {
      onLook(event.movementX, event.movementY);
      return;
    }
    if (!dragging) return;
    const dx = event.clientX - lastPointerX;
    const dy = event.clientY - lastPointerY;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    onLook(dx, dy, 1.5);
  });

  canvas.addEventListener('pointerup', () => { dragging = false; });
}

addEventListener('keydown', event => {
  keys.add(event.code);
  if (event.code === 'Digit1') setFloor(1);
  if (event.code === 'Digit2') setFloor(2);
  if (event.code === 'KeyR') resetPlayer();
});
addEventListener('keyup', event => keys.delete(event.code));

let joyForward = 0;
let joyStrafe = 0;
const joystick = document.querySelector('#joystick');
const stick = document.querySelector('#stick');
let joyId = null;

function updateJoystick(touch) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = touch.clientX - cx;
  let dy = touch.clientY - cy;
  const max = rect.width * 0.32;
  const magnitude = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, max / magnitude);
  dx *= k;
  dy *= k;
  joyStrafe = dx / max;
  joyForward = -dy / max;
  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

joystick.addEventListener('touchstart', event => {
  event.preventDefault();
  const touch = event.changedTouches[0];
  joyId = touch.identifier;
  updateJoystick(touch);
}, { passive: false });

joystick.addEventListener('touchmove', event => {
  event.preventDefault();
  for (const touch of event.changedTouches) {
    if (touch.identifier === joyId) updateJoystick(touch);
  }
}, { passive: false });

joystick.addEventListener('touchend', event => {
  for (const touch of event.changedTouches) {
    if (touch.identifier === joyId) {
      joyId = null;
      joyForward = 0;
      joyStrafe = 0;
      stick.style.transform = 'translate(0, 0)';
    }
  }
}, { passive: false });

const lookZone = document.querySelector('#lookZone');
let lookId = null;
let lookX = 0;
let lookY = 0;

lookZone.addEventListener('touchstart', event => {
  event.preventDefault();
  const touch = event.changedTouches[0];
  lookId = touch.identifier;
  lookX = touch.clientX;
  lookY = touch.clientY;
}, { passive: false });

lookZone.addEventListener('touchmove', event => {
  event.preventDefault();
  for (const touch of event.changedTouches) {
    if (touch.identifier === lookId) {
      onLook(touch.clientX - lookX, touch.clientY - lookY, 2.4);
      lookX = touch.clientX;
      lookY = touch.clientY;
    }
  }
}, { passive: false });

lookZone.addEventListener('touchend', event => {
  for (const touch of event.changedTouches) {
    if (touch.identifier === lookId) lookId = null;
  }
}, { passive: false });

const clock = new THREE.Clock();

function updatePlayer(dt) {
  if (!started) return;

  let forward = joyForward;
  let strafe = joyStrafe;
  if (keys.has('KeyW')) forward += 1;
  if (keys.has('KeyS')) forward -= 1;
  if (keys.has('KeyD')) strafe += 1;
  if (keys.has('KeyA')) strafe -= 1;

  const magnitude = Math.hypot(forward, strafe);
  if (magnitude > 1) {
    forward /= magnitude;
    strafe /= magnitude;
  }

  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 4.2 : 2.35;
  const rightX = Math.cos(yaw);
  const rightZ = -Math.sin(yaw);
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const dx = (forwardX * forward + rightX * strafe) * speed * dt;
  const dz = (forwardZ * forward + rightZ * strafe) * speed * dt;

  if (physicsReady && characterController && playerCollider && playerBody) {
    characterController.computeColliderMovement(playerCollider, { x: dx, y: 0, z: dz });
    const corrected = characterController.computedMovement();
    const p = playerBody.translation();
    playerBody.setNextKinematicTranslation({ x: p.x + corrected.x, y: p.y + corrected.y, z: p.z + corrected.z });
    physicsWorld.step();
  } else {
    const nextX = player.x + dx;
    const nextZ = player.z + dz;
    if (fallbackCanOccupy(nextX, player.z)) player.x = nextX;
    if (fallbackCanOccupy(player.x, nextZ)) player.z = nextZ;
  }

  setCameraFromPlayer();
  const p = physicsReady && playerBody ? playerBody.translation() : player;
  roomLabel.textContent = roomAt(p.x, p.z);
}

function installRenderLoop() {
  if (renderLoopInstalled) return;
  renderLoopInstalled = true;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.033);
    updatePlayer(dt);
    renderer.render(scene, camera);
  });
}

enterButton.addEventListener('click', async () => {
  if (started || starting) return;
  starting = true;
  enterButton.disabled = true;
  const originalText = enterButton.textContent;
  enterButton.textContent = '正在初始化 3D 引擎…';

  try {
    await createRenderer();
    enterButton.textContent = '正在初始化碰撞系统…';
    await initializePhysics();
    resetPlayer();
    started = true;
    boot.style.display = 'none';
  } catch (error) {
    console.error('3D runtime initialization failed.', error);
    rendererMode.textContent = '初始化失败';
    enterButton.disabled = false;
    enterButton.textContent = '重试进入';
    const paragraph = boot.querySelector('p');
    if (paragraph) paragraph.textContent = `3D 引擎初始化失败：${error?.message ?? '未知错误'}；可点击“重试进入”。`;
  } finally {
    starting = false;
    if (!started && enterButton.textContent === originalText) enterButton.disabled = false;
  }
});

resetButton.addEventListener('click', resetPlayer);
document.querySelectorAll('.floor').forEach(button => {
  button.addEventListener('click', () => setFloor(Number(button.dataset.floor)));
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  if (renderer) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
  }
});
