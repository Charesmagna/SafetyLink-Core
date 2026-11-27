import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

let rectAreaInitialized = false;

export function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function isWebGLAvailable(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export interface StudioRendererBundle {
  renderer: THREE.WebGLRenderer;
  isSoftwareGl: boolean;
  envRenderTarget: THREE.WebGLRenderTarget;
  maxAnisotropy: number;
}

export function createStudioRenderer(
  container: HTMLElement,
  scene: THREE.Scene,
  options?: { exposure?: number }
): StudioRendererBundle {
  const isSoftwareGl = detectSoftwareGl();
  const width = Math.max(container.clientWidth || 640, 1);
  const height = Math.max(container.clientHeight || 400, 1);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = options?.exposure ?? 1.12;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Zero-dependency procedural studio environment reflections on every device
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
  scene.environment = envRenderTarget.texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy() || 4, 16);

  return { renderer, isSoftwareGl, envRenderTarget, maxAnisotropy };
}

export function setupStudioLights(
  scene: THREE.Scene,
  isSoftwareGl: boolean,
  options?: {
    shadowExtent?: number;
    keyPosition?: [number, number, number];
    keyIntensity?: number;
    hemiIntensity?: number;
    useSoftbox?: boolean;
  }
): { keyLight: THREE.DirectionalLight; hemiLight: THREE.HemisphereLight; rimLight: THREE.DirectionalLight } {
  const d = options?.shadowExtent ?? 8;
  const [kx, ky, kz] = options?.keyPosition ?? [6, 10, 7];

  // Warm key light
  const keyLight = new THREE.DirectionalLight(0xfff1dc, options?.keyIntensity ?? 2.2);
  keyLight.position.set(kx, ky, kz);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = Math.max(d * 5, 40);
  keyLight.shadow.camera.left = -d;
  keyLight.shadow.camera.right = d;
  keyLight.shadow.camera.top = d;
  keyLight.shadow.camera.bottom = -d;
  keyLight.shadow.bias = -0.0005;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  // Cool hemisphere fill
  const hemiLight = new THREE.HemisphereLight(0x7cc4ff, 0x0b1224, options?.hemiIntensity ?? 0.85);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  // Crisp cyan rim backlight for silhouette separation
  const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
  rimLight.position.set(-kx * 0.9, ky * 0.6, -kz);
  scene.add(rimLight);

  // Optional studio softboxes on hardware GPUs
  if (!isSoftwareGl && options?.useSoftbox) {
    if (!rectAreaInitialized) {
      RectAreaLightUniformsLib.init();
      rectAreaInitialized = true;
    }
    const softbox1 = new THREE.RectAreaLight(0xe0f2fe, 2.2, 5, 3);
    softbox1.position.set(-5, 4.5, 4);
    softbox1.lookAt(0, 0.6, 0);
    scene.add(softbox1);

    const softbox2 = new THREE.RectAreaLight(0xfef3c7, 1.6, 4, 2.5);
    softbox2.position.set(5, 3.5, -3.5);
    softbox2.lookAt(0, 0.6, 0);
    scene.add(softbox2);
  }

  return { keyLight, hemiLight, rimLight };
}

export interface FrameLoopController {
  start: (tick: (delta: number, elapsed: number) => void) => void;
  stop: () => void;
}

export function createPacedLoop(renderer: THREE.WebGLRenderer, isSoftwareGl: boolean): FrameLoopController {
  let frameId = 0;
  let running = false;
  let lastTime = performance.now();
  const startTime = lastTime;

  const afterDraw = (cb: () => void) => {
    if (!running) return;
    const gl = renderer.getContext() as WebGL2RenderingContext | null;
    if (gl && typeof gl.fenceSync === 'function') {
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (!running) {
          if (sync) gl.deleteSync(sync);
          return;
        }
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    } else {
      frameId = window.setTimeout(cb, 90);
    }
  };

  return {
    start(tick) {
      running = true;
      lastTime = performance.now();
      const step = () => {
        if (!running) return;
        const now = performance.now();
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        const elapsed = (now - startTime) / 1000;
        lastTime = now;
        tick(delta, elapsed);
        if (!running) return;
        if (isSoftwareGl) {
          afterDraw(step);
        } else {
          frameId = requestAnimationFrame(step);
        }
      };
      if (isSoftwareGl) {
        frameId = window.setTimeout(step, 16);
      } else {
        frameId = requestAnimationFrame(step);
      }
    },
    stop() {
      running = false;
      cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
    },
  };
}

export function createContactShadowTexture(size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.04, size / 2, size / 2, size * 0.48);
  grad.addColorStop(0, 'rgba(2, 6, 23, 0.72)');
  grad.addColorStop(0.55, 'rgba(2, 6, 23, 0.28)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function createBrushedMetalRoughnessMap(maxAnisotropy: number, size = 256): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#404040';
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    const shade = 48 + Math.floor(Math.sin(y * 1.7) * 14 + ((y * 37) % 28));
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, size, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createPcbCircuitTexture(maxAnisotropy: number, size = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep emerald solder mask
  ctx.fillStyle = '#064e3b';
  ctx.fillRect(0, 0, size, size);

  // Subtle fiberglass weave grid
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.14)';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Gold copper routing traces
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  const paths = [
    [[80, 90], [180, 90], [210, 120], [210, 210]],
    [[430, 110], [340, 110], [310, 140], [310, 220]],
    [[110, 410], [200, 410], [230, 380], [230, 310]],
    [[400, 400], [320, 400], [290, 370], [290, 300]],
    [[120, 256], [190, 256]],
    [[322, 256], [395, 256]],
  ];
  for (const p of paths) {
    ctx.beginPath();
    p.forEach(([x, y], idx) => (idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();
  }

  // Gold solder vias
  ctx.fillStyle = '#f5d061';
  for (const p of paths) {
    const [sx, sy] = p[0];
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#022c22';
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5d061';
  }

  // Central nRF52 IC footprint
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(195, 195, 122, 122);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(195, 195, 122, 122);

  // Silkscreen markings
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SL-BLE5', 256, 252);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#34d399';
  ctx.fillText('ZEROLINK REV4', 256, 276);

  // Meander PCB BLE antenna trace at top
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(190, 62);
  for (let i = 0; i < 6; i++) {
    const x = 190 + i * 24;
    ctx.lineTo(x, 34);
    ctx.lineTo(x + 12, 34);
    ctx.lineTo(x + 12, 62);
    ctx.lineTo(x + 24, 62);
  }
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createTacticalGridTexture(
  maxAnisotropy: number,
  accentHex = '#10b981',
  size = 1024
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#070e1c';
  ctx.fillRect(0, 0, size, size);

  // Fine grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Major grid
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= size; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Concentric tactical radar rings
  const cx = size / 2;
  const cy = size / 2;
  ctx.strokeStyle = accentHex;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 2;
  [110, 220, 330, 440].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // Axis crosshairs
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, 24);
  ctx.lineTo(cx, size - 24);
  ctx.moveTo(24, cy);
  ctx.lineTo(size - 24, cy);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createGlobeLandTexture(maxAnisotropy: number, width = 1024, height = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Deep tactical ocean base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#071124');
  oceanGrad.addColorStop(0.5, '#0b1930');
  oceanGrad.addColorStop(1, '#060d1c');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle lat/lon graticule
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += width / 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += height / 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Stylized landmass polygons (lat/lng mapped to equirectangular canvas)
  const toXY = (lon: number, lat: number): [number, number] => [
    ((lon + 180) / 360) * width,
    ((90 - lat) / 180) * height,
  ];

  const continents: Array<Array<[number, number]>> = [
    // Africa (detailed Southern Africa emphasis)
    [
      [-17, 15], [-10, 32], [10, 37], [32, 31], [43, 12], [51, 11],
      [41, -2], [40, -15], [35, -26], [28, -33], [18, -34], [14, -22],
      [12, -6], [8, 4], [-5, 5], [-16, 11],
    ],
    // Europe
    [
      [-9, 37], [-9, 43], [-1, 48], [6, 54], [12, 58], [26, 65],
      [40, 64], [45, 52], [35, 45], [24, 38], [15, 38], [3, 42],
    ],
    // Asia
    [
      [40, 64], [75, 70], [130, 68], [160, 60], [140, 42], [122, 30],
      [108, 12], [98, 16], [80, 8], [68, 24], [52, 26], [36, 36],
    ],
    // North America
    [
      [-165, 65], [-135, 68], [-90, 62], [-65, 48], [-75, 34], [-82, 25],
      [-97, 20], [-105, 22], [-118, 34], [-125, 49], [-145, 60],
    ],
    // South America
    [
      [-79, 9], [-62, 10], [-35, -6], [-40, -22], [-58, -38], [-68, -54],
      [-74, -44], [-71, -18], [-80, -4],
    ],
    // Australia
    [
      [114, -22], [130, -12], [143, -12], [153, -28], [148, -38],
      [130, -33], [115, -34],
    ],
  ];

  continents.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lon, lat], i) => {
      const [x, y] = toXY(lon, lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = '#142b47';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Highlight South Africa operational corridor
  const [saX, saY] = toXY(25, -28);
  const saGlow = ctx.createRadialGradient(saX, saY, 2, saX, saY, 44);
  saGlow.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
  saGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = saGlow;
  ctx.beginPath();
  ctx.arc(saX, saY, 44, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function disposeSceneHierarchy(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  envRenderTarget?: THREE.WebGLRenderTarget
): void {
  const disposableTextures = new Set<THREE.Texture>();
  const disposableGeos = new Set<THREE.BufferGeometry>();
  const disposableMats = new Set<THREE.Material>();

  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) disposableGeos.add(mesh.geometry);
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        disposableMats.add(m);
        const anyMat = m as any;
        ['map', 'roughnessMap', 'metalnessMap', 'normalMap', 'bumpMap', 'emissiveMap', 'alphaMap', 'aoMap'].forEach(
          (k) => {
            if (anyMat[k] && typeof anyMat[k].dispose === 'function') {
              disposableTextures.add(anyMat[k]);
            }
          }
        );
      });
    }
  });

  disposableTextures.forEach((t) => t.dispose());
  disposableGeos.forEach((g) => g.dispose());
  disposableMats.forEach((m) => m.dispose());
  envRenderTarget?.dispose();
  renderer.dispose();
}
