import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Radio, RotateCcw } from 'lucide-react';
import {
  createBrushedMetalRoughnessMap,
  createContactShadowTexture,
  createPacedLoop,
  createPcbCircuitTexture,
  createStudioRenderer,
  createTacticalGridTexture,
  disposeSceneHierarchy,
  isWebGLAvailable,
  setupStudioLights,
} from './threeEngine';

interface HardwareTag3DSceneProps {
  heightClass?: string;
  compact?: boolean;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
}

type FinishId = 'obsidian' | 'arctic' | 'crimson' | 'emerald' | 'cobalt';
type CameraPresetId = 'hero' | 'teardown' | 'pcb' | 'relay';

const FINISHES: Array<{ id: FinishId; label: string; hex: number; swatch: string }> = [
  { id: 'obsidian', label: 'Obsidian', hex: 0x161d2b, swatch: '#1e293b' },
  { id: 'arctic', label: 'Arctic', hex: 0xe2e8f0, swatch: '#e2e8f0' },
  { id: 'crimson', label: 'Crimson', hex: 0xb91c1c, swatch: '#dc2626' },
  { id: 'emerald', label: 'Emerald', hex: 0x047857, swatch: '#10b981' },
  { id: 'cobalt', label: 'Cobalt', hex: 0x1d4ed8, swatch: '#2563eb' },
];

const CAMERA_PRESETS: Record<CameraPresetId, { label: string; pos: [number, number, number]; target: [number, number, number] }> = {
  hero: { label: 'Hero 3/4', pos: [4.2, 3.1, 4.8], target: [0.3, 1.0, 0] },
  teardown: { label: 'Exploded', pos: [0.6, 2.5, 6.2], target: [0, 1.35, 0] },
  pcb: { label: 'PCB Core', pos: [2.3, 3.6, 2.2], target: [0, 1.25, 0] },
  relay: { label: 'SOS Relay', pos: [1.6, 3.8, 7.6], target: [1.7, 1.15, 0] },
};

const PART_SPECS: Record<string, { title: string; spec: string }> = {
  upperShell: {
    title: 'IP65 Armored Polymer Shell',
    spec: 'Beveled impact-resistant housing · 38×27×8 mm · 7 g',
  },
  sosActuator: {
    title: 'Tactile SOS Actuator Dome',
    spec: 'Configurable single, double, triple & long-press profiles',
  },
  ledRing: {
    title: 'Bi-Color Telemetry Ring',
    spec: 'Emerald standby / Crimson SOS wave verification',
  },
  chassisFrame: {
    title: 'Brushed Titanium Mid-Frame',
    spec: 'Weatherproof gasket seat & shock-absorbing bezel',
  },
  pcbCore: {
    title: 'nRF52 BLE 5.0 PCB Core',
    spec: 'Meander 2.4 GHz antenna · ZeroLink offline wake trigger',
  },
  cr2032Cell: {
    title: 'CR2032 Lithium Cell',
    spec: '6–12 month continuous standby · Twist-lock swap',
  },
  lowerShell: {
    title: 'Twist-Lock Battery Cap',
    spec: 'IP65 O-ring compression plate & stainless eyelet mount',
  },
  relayReceiver: {
    title: 'SafetyLink Phone & Tower Relay',
    spec: 'Receives BLE GATT interrupt -> Native Android PanicService',
  },
};

function createTeardropShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1.45 * scale);
  s.bezierCurveTo(0.82 * scale, 1.45 * scale, 1.15 * scale, 0.52 * scale, 1.05 * scale, -0.35 * scale);
  s.bezierCurveTo(0.96 * scale, -1.08 * scale, 0.52 * scale, -1.42 * scale, 0, -1.42 * scale);
  s.bezierCurveTo(-0.52 * scale, -1.42 * scale, -0.96 * scale, -1.08 * scale, -1.05 * scale, -0.35 * scale);
  s.bezierCurveTo(-1.15 * scale, 0.52 * scale, -0.82 * scale, 1.45 * scale, 0, 1.45 * scale);
  return s;
}

export const HardwareTag3DScene: React.FC<HardwareTag3DSceneProps> = ({
  heightClass = 'h-[460px]',
  compact = false,
  onFullscreenToggle,
  isFullscreen = false,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [explode, setExplode] = useState(0);
  const [finish, setFinish] = useState<FinishId>('obsidian');
  const [sosActive, setSosActive] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [selectedPart, setSelectedPart] = useState<{ title: string; spec: string }>({
    title: 'SafetyLink iTAG BLE 5.0',
    spec: 'Click any component or drag Exploded slider to inspect internals',
  });
  const [activePreset, setActivePreset] = useState<CameraPresetId>('hero');
  const [webglSupported] = useState(() => isWebGLAvailable());

  // Mutable refs for animation loop without tearing down WebGL on React updates
  const explodeTargetRef = useRef(0);
  const sosActiveRef = useRef(false);
  const finishHexRef = useRef(FINISHES[0].hex);
  const cameraGoalRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    explodeTargetRef.current = explode;
  }, [explode]);

  useEffect(() => {
    sosActiveRef.current = sosActive;
  }, [sosActive]);

  useEffect(() => {
    const found = FINISHES.find((f) => f.id === finish);
    if (found) finishHexRef.current = found.hex;
  }, [finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') setDockCollapsed((c) => !c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const applyCameraPreset = (presetId: CameraPresetId) => {
    const preset = CAMERA_PRESETS[presetId];
    setActivePreset(presetId);
    cameraGoalRef.current = {
      pos: new THREE.Vector3(...preset.pos),
      target: new THREE.Vector3(...preset.target),
    };
    if (presetId === 'teardown' && explode < 0.55) {
      setExplode(0.85);
    } else if (presetId === 'hero' && explode > 0.2) {
      setExplode(0);
    }
    if (presetId === 'relay') {
      setSosActive(true);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglSupported) return;

    const scene = new THREE.Scene();
    const bgColor = new THREE.Color(0x060c18);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(0x060c18, 0.045);

    const width = Math.max(container.clientWidth || 640, 1);
    const height = Math.max(container.clientHeight || 420, 1);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(4.2, 3.1, 4.8);

    const { renderer, isSoftwareGl, envRenderTarget, maxAnisotropy } = createStudioRenderer(container, scene, {
      exposure: 1.15,
    });
    setupStudioLights(scene, isSoftwareGl, {
      shadowExtent: 7,
      keyPosition: [6, 9, 6],
      keyIntensity: 2.3,
      hemiIntensity: 0.9,
      useSoftbox: true,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.3, 1.0, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.4;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.addEventListener('start', () => {
      cameraGoalRef.current = null;
    });

    // Procedural textures
    const brushedRoughness = createBrushedMetalRoughnessMap(maxAnisotropy);
    const pcbTex = createPcbCircuitTexture(maxAnisotropy);
    const gridTex = createTacticalGridTexture(maxAnisotropy, '#10b981');
    const contactShadowTex = createContactShadowTexture();

    // Ground tactical display pad (flush at y=0, no walls floating in void)
    const floorGeo = new THREE.CircleGeometry(24, 64);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.88,
      metalness: 0.12,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Contact shadow directly under the iTag
    const shadowPlaneGeo = new THREE.PlaneGeometry(3.4, 3.8);
    shadowPlaneGeo.rotateX(-Math.PI / 2);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    const tagContactShadow = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    tagContactShadow.position.set(0, 0.015, 0);
    scene.add(tagContactShadow);

    // Pedestal ring (grounded at y=0.02 to prevent coplanar z-fighting)
    const pedestalRingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.78,
      roughness: 0.28,
      roughnessMap: brushedRoughness,
    });
    const pedestalRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.035, 16, 64), pedestalRingMat);
    pedestalRing.rotation.x = Math.PI / 2;
    pedestalRing.position.set(0, 0.035, 0);
    scene.add(pedestalRing);

    // Shared materials for iTag assembly
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: finishHexRef.current,
      roughness: 0.3,
      metalness: 0.14,
      clearcoat: 0.65,
      clearcoatRoughness: 0.2,
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.22,
      roughnessMap: brushedRoughness,
    });
    const elastomerMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.76,
      metalness: 0.04,
    });
    const chromeBatteryMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.96,
      roughness: 0.14,
      roughnessMap: brushedRoughness,
    });
    const pcbMat = new THREE.MeshStandardMaterial({
      map: pcbTex,
      roughness: 0.48,
      metalness: 0.25,
    });
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: new THREE.Color(0x10b981),
      emissiveIntensity: 1.8,
      roughness: 0.22,
      metalness: 0.1,
    });

    // Helper to mark interactive raycast parts on layer 1
    const clickableMeshes: THREE.Object3D[] = [];
    const registerClickable = (obj: THREE.Object3D, partKey: string) => {
      obj.userData.partKey = partKey;
      obj.layers.enable(1);
      obj.traverse((c) => {
        c.userData.partKey = partKey;
        c.layers.enable(1);
      });
      clickableMeshes.push(obj);
    };

    // =========================================================================
    // COMPOSITE 10-PART PROCEDURAL SAFETYLINK BLE iTAG ASSEMBLY
    // =========================================================================
    const tagRoot = new THREE.Group();
    tagRoot.position.set(0, 0.52, 0);
    scene.add(tagRoot);

    const tearOuter = createTeardropShape(1.0);
    const tearInner = createTeardropShape(0.84);

    // 1. Lower protective armor cap (bottom layer)
    const lowerGroup = new THREE.Group();
    const lowerGeo = new THREE.ExtrudeGeometry(tearOuter, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 4,
    });
    lowerGeo.rotateX(Math.PI / 2);
    const lowerMesh = new THREE.Mesh(lowerGeo, shellMat);
    lowerMesh.castShadow = true;
    lowerMesh.receiveShadow = true;
    lowerGroup.add(lowerMesh);

    // Twist-lock battery cover notch on underside
    const twistPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.04, 32), titaniumMat);
    twistPlate.position.set(0, -0.18, 0.12);
    lowerGroup.add(twistPlate);
    registerClickable(lowerGroup, 'lowerShell');
    tagRoot.add(lowerGroup);

    // 2. CR2032 Coin Cell Battery (layer 2)
    const batteryGroup = new THREE.Group();
    const cellMain = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.12, 40), chromeBatteryMat);
    cellMain.castShadow = true;
    cellMain.position.set(0, 0, 0.15);
    const cellRim = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.025, 12, 36), elastomerMat);
    cellRim.rotation.x = Math.PI / 2;
    cellRim.position.set(0, -0.05, 0.15);
    batteryGroup.add(cellMain, cellRim);
    registerClickable(batteryGroup, 'cr2032Cell');
    tagRoot.add(batteryGroup);

    // 3. Internal FR-4 PCB Core with SMD components & buzzer (layer 3)
    const pcbGroup = new THREE.Group();
    const pcbGeo = new THREE.ExtrudeGeometry(tearInner, {
      depth: 0.06,
      bevelEnabled: false,
    });
    pcbGeo.rotateX(Math.PI / 2);
    const pcbBoard = new THREE.Mesh(pcbGeo, pcbMat);
    pcbBoard.castShadow = true;
    pcbGroup.add(pcbBoard);

    // nRF52 IC chip on PCB
    const icChip = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), elastomerMat);
    icChip.position.set(0, 0.04, 0.08);
    pcbGroup.add(icChip);

    // Piezo alert buzzer disc
    const buzzer = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.08, 24), titaniumMat);
    buzzer.position.set(0, 0.05, -0.62);
    pcbGroup.add(buzzer);

    // 2.4 GHz ceramic antenna block
    const bleChipAnt = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.05, 0.12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 })
    );
    bleChipAnt.position.set(0, 0.04, -1.0);
    pcbGroup.add(bleChipAnt);
    registerClickable(pcbGroup, 'pcbCore');
    tagRoot.add(pcbGroup);

    // 4. Brushed Titanium Mid-Chassis Bezel Ring + Keyring Eyelet (layer 4)
    const chassisGroup = new THREE.Group();
    const chassisRingGeo = new THREE.ExtrudeGeometry(tearOuter, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 3,
    });
    chassisRingGeo.rotateX(Math.PI / 2);
    const chassisMesh = new THREE.Mesh(chassisRingGeo, titaniumMat);
    chassisMesh.castShadow = true;
    chassisGroup.add(chassisMesh);

    // Stainless keyring bail & split ring at top of teardrop
    const keyringEyelet = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.045, 16, 32), chromeBatteryMat);
    keyringEyelet.rotation.x = Math.PI / 2;
    keyringEyelet.position.set(0, -0.04, -1.52);
    const splitRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.038, 16, 40), chromeBatteryMat);
    splitRing.rotation.x = Math.PI / 2 - 0.18;
    splitRing.position.set(0, -0.06, -2.02);
    chassisGroup.add(keyringEyelet, splitRing);
    registerClickable(chassisGroup, 'chassisFrame');
    tagRoot.add(chassisGroup);

    // 5. Upper Beveled Armor Housing (layer 5)
    const upperGroup = new THREE.Group();
    const upperGeo = new THREE.ExtrudeGeometry(tearOuter, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 4,
    });
    upperGeo.rotateX(Math.PI / 2);
    const upperMesh = new THREE.Mesh(upperGeo, shellMat);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    upperGroup.add(upperMesh);
    registerClickable(upperGroup, 'upperShell');
    tagRoot.add(upperGroup);

    // 6. Emissive Perimeter Status LED Ring (layer 6)
    const ledGroup = new THREE.Group();
    const ledTorus = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.042, 16, 48), ledMat);
    ledTorus.rotation.x = Math.PI / 2;
    ledTorus.position.set(0, 0, 0.14);
    ledGroup.add(ledTorus);
    registerClickable(ledGroup, 'ledRing');
    tagRoot.add(ledGroup);

    // 7. Recessed Tactile SOS Actuator Dome via LatheGeometry (top layer 7)
    const buttonGroup = new THREE.Group();
    const domeProfile = [
      new THREE.Vector2(0.0, 0.11),
      new THREE.Vector2(0.18, 0.105),
      new THREE.Vector2(0.38, 0.085),
      new THREE.Vector2(0.48, 0.05),
      new THREE.Vector2(0.5, 0.0),
    ];
    const domeGeo = new THREE.LatheGeometry(domeProfile, 36);
    const domeMesh = new THREE.Mesh(domeGeo, elastomerMat);
    domeMesh.castShadow = true;
    domeMesh.position.set(0, 0, 0.14);
    const centerInlay = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.25, 32),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        emissive: new THREE.Color(0x38bdf8),
        emissiveIntensity: 0.5,
        side: THREE.DoubleSide,
      })
    );
    centerInlay.rotation.x = -Math.PI / 2;
    centerInlay.position.set(0, 0.115, 0.14);
    buttonGroup.add(domeMesh, centerInlay);
    registerClickable(buttonGroup, 'sosActuator');
    tagRoot.add(buttonGroup);

    // Subtle vertical teardown guide rods (visible when exploded)
    const guideMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.0 });
    const guidePts = [
      new THREE.Vector3(-0.75, -0.3, 0.1),
      new THREE.Vector3(-0.75, 2.3, 0.1),
      new THREE.Vector3(0.75, -0.3, 0.1),
      new THREE.Vector3(0.75, 2.3, 0.1),
    ];
    const guideGeo = new THREE.BufferGeometry().setFromPoints(guidePts);
    const guideLines = new THREE.LineSegments(guideGeo, guideMat);
    tagRoot.add(guideLines);

    // =========================================================================
    // COMPANION RELAY SMARTPHONE + TOWER NODE (COMPOSITE 6-PART MODEL)
    // =========================================================================
    const relayRoot = new THREE.Group();
    relayRoot.position.set(3.55, 0.02, -0.35);
    scene.add(relayRoot);

    const relayShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.2).rotateX(-Math.PI / 2),
      shadowPlaneMat
    );
    relayShadow.position.y = 0.005;
    relayRoot.add(relayShadow);

    // Dock base
    const dockBase = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.82, 0.16, 32), titaniumMat);
    dockBase.position.y = 0.08;
    dockBase.castShadow = true;
    relayRoot.add(dockBase);

    // Smartphone body standing upright in dock
    const phoneGroup = new THREE.Group();
    phoneGroup.position.set(0, 1.05, 0);
    phoneGroup.rotation.y = -0.35;
    const phoneFrame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.72, 0.11), titaniumMat);
    phoneFrame.castShadow = true;
    const phoneScreenMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b,
      emissive: new THREE.Color(0x10b981),
      emissiveIntensity: 0.55,
      roughness: 0.15,
      metalness: 0.1,
    });
    const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 1.56), phoneScreenMat);
    phoneScreen.position.z = 0.058;
    const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.72, 12), chromeBatteryMat);
    mastPole.position.set(0.32, 1.15, -0.02);
    const mastBeacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), ledMat);
    mastBeacon.position.set(0.32, 1.54, -0.02);
    phoneGroup.add(phoneFrame, phoneScreen, mastPole, mastBeacon);
    relayRoot.add(phoneGroup);
    registerClickable(relayRoot, 'relayReceiver');

    // =========================================================================
    // BLE SIGNAL WAVE RINGS + CURVED PACKET ARC (VISUAL SOS DEMO)
    // =========================================================================
    const arcCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.05, 0.14),
      new THREE.Vector3(1.65, 2.35, -0.05),
      new THREE.Vector3(3.55, 1.55, -0.35),
    ]);
    const arcGeo = new THREE.TubeGeometry(arcCurve, 40, 0.024, 8, false);
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
    });
    const arcMesh = new THREE.Mesh(arcGeo, arcMat);
    scene.add(arcMesh);

    const packetMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: new THREE.Color(0xef4444),
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const packetOrbs: THREE.Mesh[] = [];
    const orbGeo = new THREE.SphereGeometry(0.09, 14, 14);
    for (let i = 0; i < 3; i++) {
      const orb = new THREE.Mesh(orbGeo, packetMat);
      scene.add(orb);
      packetOrbs.push(orb);
    }

    const waveRings: THREE.Mesh[] = [];
    const waveRingGeo = new THREE.TorusGeometry(0.65, 0.022, 12, 48);
    waveRingGeo.rotateX(Math.PI / 2);
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(waveRingGeo, mat);
      ring.position.set(0, 0.72, 0.14);
      scene.add(ring);
      waveRings.push(ring);
    }

    // Raycasting on layer 1
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, true);
      if (hits.length > 0) {
        const key = hits[0].object.userData.partKey as string | undefined;
        if (key && PART_SPECS[key]) {
          setSelectedPart(PART_SPECS[key]);
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // ResizeObserver for responsive container sizing
    const resizeObserver = new ResizeObserver(() => {
      const w = Math.max(container.clientWidth || 1, 1);
      const h = Math.max(container.clientHeight || 1, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Pre-allocated scratch helpers (zero GC inside animation loop)
    const _targetColor = new THREE.Color();
    const _ledColor = new THREE.Color();
    const _arcPos = new THREE.Vector3();
    let currentExplode = 0;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const loop = createPacedLoop(renderer, isSoftwareGl);
    loop.start((delta, elapsed) => {
      // Smoothly damp exploded layers
      currentExplode = THREE.MathUtils.damp(currentExplode, explodeTargetRef.current, 6, delta);

      lowerGroup.position.y = -0.18 - currentExplode * 0.22;
      batteryGroup.position.y = -0.04 + currentExplode * 0.14;
      pcbGroup.position.y = 0.05 + currentExplode * 0.56;
      chassisGroup.position.y = 0.08 + currentExplode * 0.92;
      upperGroup.position.y = 0.22 + currentExplode * 1.32;
      ledGroup.position.y = 0.27 + currentExplode * 1.62;
      buttonGroup.position.y = 0.27 + currentExplode * 1.88;
      guideMat.opacity = currentExplode * 0.42;

      // Subtle floating hover on hero unit when assembled
      tagRoot.position.y = 0.52 + Math.sin(elapsed * 1.4) * 0.05 * (1 - currentExplode * 0.6);

      // Smooth shell color transition
      _targetColor.setHex(finishHexRef.current);
      shellMat.color.lerp(_targetColor, 1 - Math.exp(-8 * delta));

      // SOS simulation visuals vs armed standby
      const isSos = sosActiveRef.current;
      _ledColor.setHex(isSos ? 0xef4444 : 0x10b981);
      ledMat.color.lerp(_ledColor, 1 - Math.exp(-8 * delta));
      ledMat.emissive.lerp(_ledColor, 1 - Math.exp(-8 * delta));
      ledMat.emissiveIntensity = isSos ? 2.4 + Math.sin(elapsed * 10) * 1.1 : 1.4;
      phoneScreenMat.emissive.copy(_ledColor);
      phoneScreenMat.emissiveIntensity = isSos ? 1.1 : 0.45;
      arcMat.color.copy(_ledColor);
      arcMat.opacity = isSos ? 0.72 : 0.22;

      // Animate packets along BLE -> Relay curve
      const speed = isSos ? 0.65 : 0.22;
      packetOrbs.forEach((orb, idx) => {
        const t = (elapsed * speed + idx / packetOrbs.length) % 1;
        arcCurve.getPointAt(t, _arcPos);
        orb.position.copy(_arcPos);
        orb.visible = isSos || idx === 0;
        packetMat.emissive.copy(_ledColor);
      });

      // Expanding 3D SOS wave rings from actuator
      waveRings.forEach((ring, idx) => {
        const mat = ring.material as THREE.MeshBasicMaterial;
        if (!isSos) {
          mat.opacity = 0;
          return;
        }
        const phase = (elapsed * 0.9 + idx / waveRings.length) % 1;
        const scale = 1 + phase * 4.2;
        ring.scale.set(scale, 1, scale);
        ring.position.y = 0.72 + currentExplode * 1.5;
        mat.opacity = (1 - phase) * 0.68;
      });

      // Smoothly damp camera preset transitions
      const goal = cameraGoalRef.current;
      if (goal) {
        const alpha = 1 - Math.exp(-5.5 * delta);
        camera.position.lerp(goal.pos, alpha);
        controls.target.lerp(goal.target, alpha);
        if (camera.position.distanceTo(goal.pos) < 0.04 && controls.target.distanceTo(goal.target) < 0.04) {
          cameraGoalRef.current = null;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      loop.stop();
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      disposeSceneHierarchy(scene, renderer, envRenderTarget);
    };
  }, [webglSupported]);

  if (!webglSupported) {
    return (
      <div className={`w-full ${heightClass} rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-6 text-center`}>
        <p className="text-xs font-mono text-slate-400">
          3D Hardware Inspector requires WebGL. Switch to Photo Gallery to view hardware specs.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-[#060c18] border border-slate-800 select-none`}
      data-testid="three-hardware-itag-scene"
    >
      {/* Isolated WebGL canvas mount — never shares children with React overlays */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Minimal Top-Left Inspector Badge (solid rgba, zero backdrop-filter) */}
      <div
        className="absolute top-3 left-3 z-10 max-w-xs rounded-xl px-3.5 py-2.5 border border-slate-700/80 pointer-events-none"
        style={{ backgroundColor: 'rgba(6, 12, 24, 0.9)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: sosActive ? '#ef4444' : '#10b981' }}
          />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
            {sosActive ? 'SOS SIGNAL DEMO ACTIVE' : 'INTERACTIVE 3D HARDWARE'}
          </span>
        </div>
        <div className="text-xs font-bold text-white mt-1">{selectedPart.title}</div>
        <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{selectedPart.spec}</div>
      </div>

      {/* Top-Right Compact Fullscreen / Reset Action */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setExplode(0);
            setSosActive(false);
            applyCameraPreset('hero');
          }}
          title="Reset 3D View"
          className="p-2 rounded-lg border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
          style={{ backgroundColor: 'rgba(6, 12, 24, 0.9)' }}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        {onFullscreenToggle && (
          <button
            type="button"
            onClick={onFullscreenToggle}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D Inspector'}
            className="p-2 rounded-lg border border-slate-700/80 text-slate-300 hover:text-white transition-colors"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.9)' }}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-[780px] flex flex-col items-center pointer-events-none">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-lg rounded-b-md border border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5"
          style={{ backgroundColor: 'rgba(6, 12, 24, 0.92)' }}
        >
          {dockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{dockCollapsed ? 'Show 3D Controls (H)' : 'Hide Controls (H)'}</span>
        </button>

        {!dockCollapsed && (
          <div
            className="pointer-events-auto w-full rounded-xl border border-slate-700/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3"
            style={{ backgroundColor: 'rgba(6, 12, 24, 0.93)' }}
          >
            {/* Exploded View Slider */}
            <div className="flex items-center gap-2 min-w-[140px]">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Explode</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={explode}
                onChange={(e) => setExplode(parseFloat(e.target.value))}
                className="w-24 accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] font-mono text-emerald-400 w-7 text-right">
                {Math.round(explode * 100)}%
              </span>
            </div>

            {/* Shell Finishes */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 mr-1">Shell</span>
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFinish(f.id)}
                  title={f.label}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    finish === f.id ? 'border-emerald-400 scale-110' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: f.swatch }}
                />
              ))}
            </div>

            {/* Camera Presets */}
            {!compact && (
              <div className="flex items-center gap-1">
                {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => applyCameraPreset(presetKey)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                      activePreset === presetKey
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {CAMERA_PRESETS[presetKey].label}
                  </button>
                ))}
              </div>
            )}

            {/* Demo SOS Signal Wave Trigger (Strictly visual simulation) */}
            <button
              type="button"
              onClick={() => setSosActive((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                sosActive
                  ? 'bg-red-600 text-white hover:bg-red-500'
                  : 'bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/30'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{sosActive ? 'Stop Demo Wave' : 'Simulate SOS Wave'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HardwareTag3DScene;
