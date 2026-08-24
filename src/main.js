import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const app = document.querySelector('#app');
const boot = document.querySelector('#boot');
const enterButton = document.querySelector('#enter');
const resetButton = document.querySelector('#reset');
const rendererMode = document.querySelector('#rendererMode');
const qualityMode = document.querySelector('#qualityMode');
const positionLabel = document.querySelector('#positionLabel');

const ROOM = { width: 6.8, depth: 5.4, height: 3.1 };
const mobile = matchMedia('(max-width: 760px)').matches;
const shadowSize = mobile ? 2048 : 4096;
const maxDpr = mobile ? 1.6 : 2;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x909aa3);
scene.fog = new THREE.Fog(0x909aa3, 12, 28);

const camera = new THREE.PerspectiveCamera(67, innerWidth / innerHeight, 0.04, 60);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = true;
app.appendChild(renderer.domElement);

rendererMode.textContent = 'WebGL2 / PBR';
qualityMode.textContent = `${mobile ? 'High' : 'Ultra'} · ${shadowSize}px shadows`;

RectAreaLightUniformsLib.init();

const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new RoomEnvironment();
scene.environment = pmrem.fromScene(envScene, 0.04).texture;
envScene.dispose?.();
pmrem.dispose();

const anisotropy = renderer.capabilities.getMaxAnisotropy();

function roundedBox(w, h, d, radius, material, x = 0, y = 0, z = 0) {
  const geometry = new RoundedBoxGeometry(w, h, d, 5, Math.min(radius, Math.min(w, h, d) * 0.45));
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function box(w, h, d, material, x = 0, y = 0, z = 0, cast = true, receive = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function cylinder(rt, rb, h, segments, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, segments), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeWoodTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#aa8059';
  g.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 180; i++) {
    const y = Math.random() * c.height;
    const alpha = 0.025 + Math.random() * 0.07;
    g.strokeStyle = `rgba(62,32,18,${alpha})`;
    g.lineWidth = 0.7 + Math.random() * 2.1;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 32) {
      g.lineTo(x, y + Math.sin(x * 0.018 + i) * (2 + Math.random() * 2));
    }
    g.stroke();
  }
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const rx = 16 + Math.random() * 35;
    const ry = 4 + Math.random() * 10;
    g.strokeStyle = 'rgba(55,30,18,.10)';
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(x, y, rx, ry, Math.random(), 0, Math.PI * 2);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3.1, 6.2);
  t.anisotropy = anisotropy;
  return t;
}

function makeNoiseTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const image = g.createImageData(c.width, c.height);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 115 + Math.floor(Math.random() * 42);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  g.putImageData(image, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(9, 9);
  t.anisotropy = anisotropy;
  return t;
}

function makeArtTexture() {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#e6ded2';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#252a2d';
  g.beginPath();
  g.ellipse(245, 360, 210, 295, -0.38, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#a96f4f';
  g.beginPath();
  g.arc(520, 650, 160, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#b9a88d';
  g.fillRect(95, 720, 385, 115);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  return t;
}

function makeShadowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 8, 128, 128, 124);
  grad.addColorStop(0, 'rgba(0,0,0,.46)');
  grad.addColorStop(0.52, 'rgba(0,0,0,.22)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

const woodTexture = makeWoodTexture();
const noiseTexture = makeNoiseTexture();
const shadowTexture = makeShadowTexture();

const mat = {
  plaster: new THREE.MeshStandardMaterial({ color: 0xe9e5de, roughness: 0.91, metalness: 0 }),
  plasterWarm: new THREE.MeshStandardMaterial({ color: 0xded5c8, roughness: 0.88 }),
  ceiling: new THREE.MeshStandardMaterial({ color: 0xf4f1eb, roughness: 0.95 }),
  floor: new THREE.MeshStandardMaterial({ map: woodTexture, color: 0xffffff, roughness: 0.55, metalness: 0 }),
  oak: new THREE.MeshStandardMaterial({ color: 0xa77953, roughness: 0.58 }),
  walnut: new THREE.MeshStandardMaterial({ color: 0x5c4031, roughness: 0.48 }),
  stone: new THREE.MeshStandardMaterial({ color: 0xb8b1a7, roughness: 0.43 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x292b2e, roughness: 0.22, metalness: 0.86 }),
  brass: new THREE.MeshStandardMaterial({ color: 0x9e7950, roughness: 0.26, metalness: 0.82 }),
  linen: new THREE.MeshPhysicalMaterial({ color: 0xd8d1c6, roughness: 0.96, sheen: 0.48, sheenColor: 0xf1e7db, sheenRoughness: 0.82, bumpMap: noiseTexture, bumpScale: 0.006 }),
  fabric: new THREE.MeshPhysicalMaterial({ color: 0x8b8379, roughness: 0.94, sheen: 0.62, sheenColor: 0xd8d0c5, sheenRoughness: 0.76, bumpMap: noiseTexture, bumpScale: 0.009 }),
  velvet: new THREE.MeshPhysicalMaterial({ color: 0x4f5550, roughness: 0.88, sheen: 0.9, sheenColor: 0x9fa79e, sheenRoughness: 0.7 }),
  duvet: new THREE.MeshPhysicalMaterial({ color: 0xe9e5de, roughness: 0.93, sheen: 0.5, sheenColor: 0xffffff, sheenRoughness: 0.85, bumpMap: noiseTexture, bumpScale: 0.005 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xd7edf5, transmission: 0.92, transparent: true, opacity: 0.34, roughness: 0.03, metalness: 0, ior: 1.45, thickness: 0.018, side: THREE.DoubleSide }),
  screen: new THREE.MeshPhysicalMaterial({ color: 0x121518, roughness: 0.11, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
  black: new THREE.MeshStandardMaterial({ color: 0x1b1d1f, roughness: 0.58 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x405344, roughness: 0.82 }),
  pot: new THREE.MeshStandardMaterial({ color: 0x85786d, roughness: 0.68 }),
  emissive: new THREE.MeshStandardMaterial({ color: 0xffe0ad, emissive: 0xffb75f, emissiveIntensity: 3.1, roughness: 0.4 })
};

const roomRoot = new THREE.Group();
scene.add(roomRoot);

function addContactShadow(x, z, w, d, opacity = 0.22) {
  const material = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, opacity, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.012, z);
  roomRoot.add(mesh);
}

function buildArchitecture() {
  roomRoot.add(box(ROOM.width, 0.12, ROOM.depth, mat.floor, 0, -0.06, 0, false, true));
  roomRoot.add(box(ROOM.width, ROOM.height, 0.12, mat.plaster, 0, ROOM.height / 2, -ROOM.depth / 2));
  roomRoot.add(box(0.12, ROOM.height, ROOM.depth, mat.plasterWarm, -ROOM.width / 2, ROOM.height / 2, 0));

  // Window wall is split so sunlight genuinely enters through the opening.
  roomRoot.add(box(0.12, ROOM.height, 1.18, mat.plaster, ROOM.width / 2, ROOM.height / 2, -2.11));
  roomRoot.add(box(0.12, ROOM.height, 1.18, mat.plaster, ROOM.width / 2, ROOM.height / 2, 2.11));
  roomRoot.add(box(0.12, 0.46, 3.04, mat.plaster, ROOM.width / 2, 0.23, 0));
  roomRoot.add(box(0.12, 0.46, 3.04, mat.plaster, ROOM.width / 2, 2.87, 0));

  roomRoot.add(box(2.42, ROOM.height, 0.12, mat.plaster, -2.19, ROOM.height / 2, ROOM.depth / 2));
  roomRoot.add(box(2.42, ROOM.height, 0.12, mat.plaster, 2.19, ROOM.height / 2, ROOM.depth / 2));
  roomRoot.add(box(1.96, 0.52, 0.12, mat.plaster, 0, 2.84, ROOM.depth / 2));

  // Ceiling with perimeter drop and recessed center.
  roomRoot.add(box(ROOM.width, 0.10, ROOM.depth, mat.ceiling, 0, ROOM.height + 0.05, 0, false, true));
  roomRoot.add(box(ROOM.width - 0.38, 0.18, 0.22, mat.ceiling, 0, 2.95, -2.47));
  roomRoot.add(box(ROOM.width - 0.38, 0.18, 0.22, mat.ceiling, 0, 2.95, 2.47));
  roomRoot.add(box(0.22, 0.18, ROOM.depth - 0.44, mat.ceiling, -3.17, 2.95, 0));
  roomRoot.add(box(0.22, 0.18, ROOM.depth - 0.44, mat.ceiling, 3.17, 2.95, 0));

  // Baseboards and crown lines.
  const trim = new THREE.MeshStandardMaterial({ color: 0xf1eee8, roughness: 0.78 });
  roomRoot.add(box(ROOM.width - 0.12, 0.105, 0.045, trim, 0, 0.052, -2.63));
  roomRoot.add(box(0.045, 0.105, ROOM.depth - 0.12, trim, -3.33, 0.052, 0));
  roomRoot.add(box(ROOM.width - 0.12, 0.075, 0.05, trim, 0, 3.02, -2.63));

  // Door frame at front-center.
  roomRoot.add(box(0.11, 2.42, 0.18, mat.walnut, -1.02, 1.21, 2.58));
  roomRoot.add(box(0.11, 2.42, 0.18, mat.walnut, 1.02, 1.21, 2.58));
  roomRoot.add(box(2.15, 0.11, 0.18, mat.walnut, 0, 2.39, 2.58));
}

function buildFeatureWall() {
  // Upholstered central panels.
  for (let i = -2; i <= 2; i++) {
    const panel = roundedBox(0.78, 1.82, 0.105, 0.045, i === 0 ? mat.fabric : mat.linen, i * 0.79, 1.67, -2.54);
    panel.castShadow = true;
    roomRoot.add(panel);
  }

  // Walnut vertical slats on both sides.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      roomRoot.add(roundedBox(0.055, 2.35, 0.08, 0.018, mat.walnut, side * (2.20 + i * 0.105), 1.48, -2.52));
    }
  }
}

function pillow(x, y, z, sx, sy, sz, material = mat.duvet, rotation = 0) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.5, 36, 22), material);
  p.scale.set(sx, sy, sz);
  p.position.set(x, y, z);
  p.rotation.y = rotation;
  p.castShadow = true;
  p.receiveShadow = true;
  roomRoot.add(p);
  return p;
}

function buildBed() {
  const z = -1.28;
  roomRoot.add(roundedBox(2.28, 0.28, 2.12, 0.10, mat.fabric, 0, 0.28, z));
  roomRoot.add(roundedBox(2.20, 0.28, 2.04, 0.12, mat.duvet, 0, 0.54, z - 0.03));
  roomRoot.add(roundedBox(2.12, 0.23, 1.88, 0.11, mat.duvet, 0, 0.72, z + 0.02));

  // Duvet overlap and folded runner.
  const duvetTop = roundedBox(2.05, 0.16, 1.35, 0.10, mat.duvet, 0, 0.82, z + 0.30);
  duvetTop.rotation.x = -0.02;
  roomRoot.add(duvetTop);
  roomRoot.add(roundedBox(1.98, 0.075, 0.46, 0.035, mat.velvet, 0, 0.91, z + 0.62));

  pillow(-0.57, 0.92, z - 0.58, 0.73, 0.26, 0.42, mat.duvet, -0.08);
  pillow(0.57, 0.92, z - 0.58, 0.73, 0.26, 0.42, mat.duvet, 0.08);
  pillow(-0.43, 0.98, z - 0.42, 0.55, 0.22, 0.36, mat.linen, 0.08);
  pillow(0.43, 0.98, z - 0.42, 0.55, 0.22, 0.36, mat.linen, -0.08);
  pillow(0, 1.00, z - 0.25, 0.48, 0.21, 0.31, mat.velvet, 0);
  addContactShadow(0, z, 2.9, 2.7, 0.25);
}

function buildNightstand(x) {
  roomRoot.add(roundedBox(0.68, 0.54, 0.48, 0.055, mat.walnut, x, 0.31, -2.02));
  roomRoot.add(box(0.52, 0.012, 0.02, mat.brass, x, 0.36, -1.772));
  roomRoot.add(box(0.52, 0.012, 0.02, mat.brass, x, 0.20, -1.772));

  const stem = cylinder(0.018, 0.018, 0.47, 20, mat.brass, x, 0.79, -2.02);
  roomRoot.add(stem);
  const base = cylinder(0.15, 0.17, 0.035, 28, mat.brass, x, 0.57, -2.02);
  roomRoot.add(base);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.27, 0.32, 40, 1, true), mat.linen);
  shade.position.set(x, 1.03, -2.02);
  shade.castShadow = true;
  roomRoot.add(shade);
  roomRoot.add(new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 14), mat.emissive));
  roomRoot.children[roomRoot.children.length - 1].position.set(x, 0.98, -2.02);
  const glow = new THREE.PointLight(0xffc985, 7.5, 2.6, 2);
  glow.position.set(x, 1.00, -1.98);
  roomRoot.add(glow);
  addContactShadow(x, -2.02, 0.95, 0.78, 0.15);
}

function buildWindow() {
  const frame = new THREE.MeshStandardMaterial({ color: 0x373a3c, roughness: 0.25, metalness: 0.68 });
  const x = 3.335;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.92, 2.12), mat.glass);
  glass.rotation.y = -Math.PI / 2;
  glass.position.set(x - 0.015, 1.55, 0);
  roomRoot.add(glass);

  roomRoot.add(box(0.08, 0.08, 3.02, frame, x - 0.02, 0.50, 0));
  roomRoot.add(box(0.08, 0.08, 3.02, frame, x - 0.02, 2.60, 0));
  roomRoot.add(box(0.08, 2.18, 0.08, frame, x - 0.02, 1.55, -1.50));
  roomRoot.add(box(0.08, 2.18, 0.08, frame, x - 0.02, 1.55, 1.50));
  roomRoot.add(box(0.08, 2.12, 0.055, frame, x - 0.025, 1.55, 0));

  // Exterior sky card prevents the window from reading as an empty hole.
  const skyMat = new THREE.MeshBasicMaterial({ color: 0xbcced8, toneMapped: false });
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 2.18), skyMat);
  sky.rotation.y = -Math.PI / 2;
  sky.position.set(3.45, 1.55, 0);
  roomRoot.add(sky);

  // Wavy curtains.
  for (const z of [-1.82, 1.82]) {
    const geo = new THREE.PlaneGeometry(1.08, 2.56, 40, 8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const ly = pos.getY(i);
      pos.setZ(i, Math.sin((lx + 0.55) * 23) * 0.055 + Math.sin(ly * 3) * 0.008);
    }
    geo.computeVertexNormals();
    const curtain = new THREE.Mesh(geo, mat.linen);
    curtain.rotation.y = -Math.PI / 2;
    curtain.position.set(3.22, 1.52, z);
    curtain.castShadow = true;
    curtain.receiveShadow = true;
    roomRoot.add(curtain);
  }

  roomRoot.add(box(0.055, 0.055, 4.2, mat.brass, 3.16, 2.88, 0));
}

function buildLounge() {
  const group = new THREE.Group();
  group.position.set(-2.28, 0, 1.10);
  group.rotation.y = 0.48;
  group.add(roundedBox(0.94, 0.28, 0.92, 0.14, mat.velvet, 0, 0.40, 0));
  const back = roundedBox(0.92, 0.76, 0.20, 0.09, mat.velvet, 0, 0.82, -0.34);
  back.rotation.x = -0.18;
  group.add(back);
  group.add(roundedBox(0.18, 0.46, 0.84, 0.08, mat.velvet, -0.43, 0.58, 0));
  group.add(roundedBox(0.18, 0.46, 0.84, 0.08, mat.velvet, 0.43, 0.58, 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    group.add(cylinder(0.022, 0.03, 0.35, 14, mat.metal, sx * 0.34, 0.18, sz * 0.30));
  }
  roomRoot.add(group);
  addContactShadow(-2.28, 1.10, 1.55, 1.55, 0.19);

  roomRoot.add(cylinder(0.34, 0.40, 0.43, 48, mat.stone, -1.10, 0.215, 1.28));
  roomRoot.add(cylinder(0.42, 0.42, 0.055, 48, mat.brass, -1.10, 0.46, 1.28));
  addContactShadow(-1.10, 1.28, 0.95, 0.95, 0.12);
}

function buildConsoleAndArt() {
  const console = roundedBox(1.65, 0.54, 0.42, 0.055, mat.walnut, -2.42, 0.32, -0.65);
  console.rotation.y = Math.PI / 2;
  roomRoot.add(console);
  roomRoot.add(box(0.035, 1.30, 1.72, mat.metal, -3.24, 1.52, -0.62));
  const screen = box(0.04, 1.14, 1.54, mat.screen, -3.20, 1.52, -0.62);
  roomRoot.add(screen);

  const artTexture = makeArtTexture();
  const artMat = new THREE.MeshStandardMaterial({ map: artTexture, roughness: 0.76 });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.14), artMat);
  art.rotation.y = Math.PI / 2;
  art.position.set(-3.31, 1.76, 1.15);
  roomRoot.add(art);
  roomRoot.add(box(0.06, 1.26, 0.98, mat.black, -3.32, 1.76, 1.15));
  const artFront = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.14), artMat);
  artFront.rotation.y = Math.PI / 2;
  artFront.position.set(-3.285, 1.76, 1.15);
  roomRoot.add(artFront);
}

function buildPlant() {
  roomRoot.add(cylinder(0.30, 0.24, 0.55, 40, mat.pot, 2.58, 0.275, 1.82));
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x46503f, roughness: 0.9 });
  for (let i = 0; i < 8; i++) {
    const angle = i * 0.78;
    const h = 0.62 + (i % 3) * 0.18;
    const stem = cylinder(0.012, 0.018, h, 10, stemMat, 2.58, 0.56 + h / 2, 1.82);
    stem.rotation.z = Math.sin(angle) * 0.22;
    stem.rotation.x = Math.cos(angle) * 0.18;
    roomRoot.add(stem);

    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 12), mat.leaf);
    leaf.scale.set(1.75, 0.18, 0.70);
    leaf.position.set(2.58 + Math.cos(angle) * 0.28, 0.82 + h * 0.66, 1.82 + Math.sin(angle) * 0.28);
    leaf.rotation.y = -angle;
    leaf.rotation.z = 0.16 * Math.sin(angle * 1.7);
    leaf.castShadow = true;
    roomRoot.add(leaf);
  }
  addContactShadow(2.58, 1.82, 0.95, 0.95, 0.14);
}

function buildRug() {
  const rugMat = new THREE.MeshPhysicalMaterial({ color: 0xb7aea1, roughness: 1, sheen: 0.52, sheenColor: 0xe3ddd4, bumpMap: noiseTexture, bumpScale: 0.014 });
  const rug = roundedBox(3.75, 0.028, 3.00, 0.014, rugMat, 0, 0.025, -0.20);
  rug.castShadow = false;
  roomRoot.add(rug);
}

function buildLighting() {
  const sun = new THREE.DirectionalLight(0xfff0d5, 3.7);
  sun.position.set(7.2, 7.6, 4.2);
  sun.target.position.set(-0.8, 0.75, -0.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  sun.shadow.camera.left = -5.4;
  sun.shadow.camera.right = 5.4;
  sun.shadow.camera.top = 5.4;
  sun.shadow.camera.bottom = -5.4;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 22;
  sun.shadow.bias = -0.00018;
  sun.shadow.normalBias = 0.028;
  sun.shadow.radius = 3.2;
  scene.add(sun, sun.target);

  const windowFill = new THREE.RectAreaLight(0xd6e9ff, 28, 2.7, 2.15);
  windowFill.position.set(3.10, 1.55, 0);
  windowFill.lookAt(0, 1.25, -0.2);
  scene.add(windowFill);

  const warmCove = new THREE.RectAreaLight(0xffd7a2, 18, 5.2, 0.22);
  warmCove.position.set(0, 2.83, -2.38);
  warmCove.lookAt(0, 2.55, 0);
  scene.add(warmCove);

  const downlights = [
    [-1.85, 1.45, true],
    [1.85, 1.45, true],
    [-1.85, -0.15, false],
    [1.85, -0.15, false]
  ];
  for (const [x, z, casts] of downlights) {
    roomRoot.add(cylinder(0.045, 0.065, 0.035, 24, mat.black, x, 3.00, z));
    const spot = new THREE.SpotLight(0xffdfb5, 78, 7.0, Math.PI / 5.2, 0.72, 1.55);
    spot.position.set(x, 2.93, z);
    spot.target.position.set(x * 0.68, 0.05, z - 0.20);
    spot.castShadow = casts;
    if (casts) {
      spot.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
      spot.shadow.bias = -0.00025;
      spot.shadow.normalBias = 0.02;
      spot.shadow.camera.near = 0.35;
      spot.shadow.camera.far = 8;
    }
    scene.add(spot, spot.target);
  }
}

buildArchitecture();
buildFeatureWall();
buildRug();
buildBed();
buildNightstand(-1.56);
buildNightstand(1.56);
buildWindow();
buildLounge();
buildConsoleAndArt();
buildPlant();
buildLighting();

// Simple, stable first-person collision for a single room.
const obstacles = [
  { minX: -1.34, maxX: 1.34, minZ: -2.40, maxZ: -0.05 },
  { minX: -1.98, maxX: -1.18, minZ: -2.38, maxZ: -1.62 },
  { minX: 1.18, maxX: 1.98, minZ: -2.38, maxZ: -1.62 },
  { minX: -3.06, maxX: -1.48, minZ: 0.34, maxZ: 1.92 },
  { minX: 2.12, maxX: 3.05, minZ: 1.34, maxZ: 2.30 }
];

let started = false;
let yaw = 0;
let pitch = 0;
const eyeHeight = 1.62;
const player = new THREE.Vector3(0, eyeHeight, 2.04);
const keys = new Set();
let dragging = false;
let lastX = 0;
let lastY = 0;

function resetPlayer() {
  player.set(0, eyeHeight, 2.04);
  yaw = 0;
  pitch = 0;
  syncCamera();
}

function syncCamera() {
  camera.position.copy(player);
  camera.rotation.set(pitch, yaw, 0);
  positionLabel.textContent = `${player.x.toFixed(1)} m · ${player.z.toFixed(1)} m`;
}

function collides(x, z) {
  const r = 0.22;
  const bx = ROOM.width / 2 - 0.22;
  const bz = ROOM.depth / 2 - 0.22;
  if (x < -bx || x > bx || z < -bz || z > bz) return true;
  for (const o of obstacles) {
    const qx = Math.max(o.minX, Math.min(x, o.maxX));
    const qz = Math.max(o.minZ, Math.min(z, o.maxZ));
    const dx = x - qx;
    const dz = z - qz;
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}

function onLook(dx, dy, scale = 1) {
  yaw -= dx * 0.0021 * scale;
  pitch -= dy * 0.00175 * scale;
  pitch = THREE.MathUtils.clamp(pitch, -1.30, 1.30);
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (!started) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  renderer.domElement.setPointerCapture?.(e.pointerId);
  if (e.pointerType === 'mouse' && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.().catch?.(() => {});
  }
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!started) return;
  if (document.pointerLockElement === renderer.domElement) {
    onLook(e.movementX, e.movementY);
    return;
  }
  if (!dragging) return;
  onLook(e.clientX - lastX, e.clientY - lastY, 1.35);
  lastX = e.clientX;
  lastY = e.clientY;
});

renderer.domElement.addEventListener('pointerup', () => { dragging = false; });
renderer.domElement.addEventListener('pointercancel', () => { dragging = false; });

addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyR') resetPlayer();
});
addEventListener('keyup', (e) => keys.delete(e.code));

let joyForward = 0;
let joyStrafe = 0;
const joystick = document.querySelector('#joystick');
const stick = document.querySelector('#stick');
let joyId = null;

function updateJoystick(touch) {
  const r = joystick.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  let dx = touch.clientX - cx;
  let dy = touch.clientY - cy;
  const max = r.width * 0.31;
  const mag = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, max / mag);
  dx *= k;
  dy *= k;
  joyStrafe = dx / max;
  joyForward = -dy / max;
  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

joystick.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  joyId = t.identifier;
  updateJoystick(t);
}, { passive: false });
joystick.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === joyId) updateJoystick(t);
}, { passive: false });
joystick.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) if (t.identifier === joyId) {
    joyId = null;
    joyForward = 0;
    joyStrafe = 0;
    stick.style.transform = 'translate(0, 0)';
  }
}, { passive: false });

const lookZone = document.querySelector('#lookZone');
let lookId = null;
let lookX = 0;
let lookY = 0;
lookZone.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  lookId = t.identifier;
  lookX = t.clientX;
  lookY = t.clientY;
}, { passive: false });
lookZone.addEventListener('touchmove', (e) => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === lookId) {
    onLook(t.clientX - lookX, t.clientY - lookY, 2.0);
    lookX = t.clientX;
    lookY = t.clientY;
  }
}, { passive: false });
lookZone.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null;
}, { passive: false });

enterButton.addEventListener('click', () => {
  started = true;
  boot.classList.add('hidden');
  renderer.domElement.focus?.();
});
resetButton.addEventListener('click', resetPlayer);

const clock = new THREE.Clock();
function updatePlayer(dt) {
  if (!started) return;
  let forward = joyForward;
  let strafe = joyStrafe;
  if (keys.has('KeyW')) forward += 1;
  if (keys.has('KeyS')) forward -= 1;
  if (keys.has('KeyD')) strafe += 1;
  if (keys.has('KeyA')) strafe -= 1;
  const mag = Math.hypot(forward, strafe);
  if (mag > 1) { forward /= mag; strafe /= mag; }
  if (mag < 0.001) return;

  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3.65 : 2.05;
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const dx = (fx * forward + rx * strafe) * speed * dt;
  const dz = (fz * forward + rz * strafe) * speed * dt;

  if (!collides(player.x + dx, player.z)) player.x += dx;
  if (!collides(player.x, player.z + dz)) player.z += dz;
  syncCamera();
}

syncCamera();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.033);
  updatePlayer(dt);
  renderer.render(scene, camera);
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
  renderer.setSize(innerWidth, innerHeight);
});

window.__showroomReady = true;
