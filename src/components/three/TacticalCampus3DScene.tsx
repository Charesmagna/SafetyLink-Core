import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Building2, ChevronDown, ChevronUp, Layers, Radio, ShieldAlert } from 'lucide-react';
import { useAppStore } from '../../utils/store';
import {
  createBrushedMetalRoughnessMap,
  createContactShadowTexture,
  createPacedLoop,
  createStudioRenderer,
  createTacticalGridTexture,
  disposeSceneHierarchy,
  isWebGLAvailable,
  setupStudioLights,
} from './threeEngine';

interface TacticalCampus3DSceneProps {
  heightClass?: string;
  orgName?: string;
}

type FloorFilter = 'all' | 'explode' | 'f1' | 'f2' | 'f3' | 'roof';
type CampusCameraPreset = 'iso' | 'alert' | 'gatehouse' | 'top';

interface CampusTelemetryItem {
  id: string;
  title: string;
  zone: string;
  floorIndex: number;
  status: 'DISTRESS' | 'PATROL' | 'RELAY' | 'MUSTER';
  detail: string;
  pos: [number, number, number];
}

const CAMERA_PRESETS: Record<CampusCameraPreset, { label: string; pos: [number, number, number]; target: [number, number, number] }> = {
  iso: { label: 'Isometric', pos: [14, 12.5, 14.5], target: [0, 2.2, 0] },
  alert: { label: 'Active Alert', pos: [5.5, 6.8, 6.2], target: [0.9, 3.6, 0.5] },
  gatehouse: { label: 'Gatehouse', pos: [-9.2, 4.6, 11.2], target: [-4.6, 1.1, 5.2] },
  top: { label: 'Top-Down', pos: [0.1, 22, 2.5], target: [0, 1.0, 0] },
};

function createPatrolVehicle(brushedMap: THREE.Texture): THREE.Group {
  const suv = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.55 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4, metalness: 0.2 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.85 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9, metalness: 0.05 });
  const metalMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.25,
    metalness: 0.9,
    roughnessMap: brushedMap,
  });

  // Lower chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.32, 1.88), bodyMat);
  chassis.position.y = 0.34;
  chassis.castShadow = true;
  suv.add(chassis);

  // Hi-vis patrol side band
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.09, 1.65), stripeMat);
  band.position.y = 0.36;
  suv.add(band);

  // Upper cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.32, 1.05), glassMat);
  cabin.position.set(0, 0.62, -0.08);
  cabin.castShadow = true;
  suv.add(cabin);

  // Tactical roof lightbar (dual color static emissive)
  const barBase = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.16), metalMat);
  barBase.position.set(0, 0.8, -0.05);
  const barRed = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.06, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: new THREE.Color(0xef4444), emissiveIntensity: 1.8 })
  );
  barRed.position.set(-0.14, 0.83, -0.05);
  const barBlue = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.06, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x38bdf8), emissiveIntensity: 1.8 })
  );
  barBlue.position.set(0.14, 0.83, -0.05);
  suv.add(barBase, barRed, barBlue);

  // 4 wheels grounded at y=0.18
  const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.14, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelOffsets: Array<[number, number, number]> = [
    [-0.46, 0.18, 0.56],
    [0.46, 0.18, 0.56],
    [-0.46, 0.18, -0.56],
    [0.46, 0.18, -0.56],
  ];
  wheelOffsets.forEach(([x, y, z]) => {
    const w = new THREE.Mesh(wheelGeo, tireMat);
    w.position.set(x, y, z);
    suv.add(w);
  });

  // Headlights
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: new THREE.Color(0xfef08a),
    emissiveIntensity: 1.4,
  });
  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.05), headMat);
  hlL.position.set(-0.28, 0.38, 0.95);
  const hlR = hlL.clone();
  hlR.position.x = 0.28;
  suv.add(hlL, hlR);

  return suv;
}

export const TacticalCampus3DScene: React.FC<TacticalCampus3DSceneProps> = ({
  heightClass = 'h-[540px]',
  orgName,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const panicEvents = useAppStore((s) => s.panicEvents);
  const meshNodes = useAppStore((s) => s.meshNodes);

  const [floorFilter, setFloorFilter] = useState<FloorFilter>('all');
  const [showMeshLinks, setShowMeshLinks] = useState(true);
  const [showPatrols, setShowPatrols] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activePreset, setActivePreset] = useState<CampusCameraPreset>('iso');
  const [webglSupported] = useState(() => isWebGLAvailable());

  // Derive live incident beacons from store (with informative fallback if none active)
  const activeAlerts = useMemo(() => {
    const unresolved = (panicEvents || []).filter((p: any) => p && p.status !== 'RESOLVED');
    if (unresolved.length > 0) {
      return unresolved.slice(0, 4).map((p: any, idx: number) => ({
        id: p.id || `INC-${idx + 1}`,
        title: p.profileName || p.userName || `Live SOS #${idx + 1}`,
        zone: `Floor ${(idx % 3) + 1} · Wing ${idx % 2 === 0 ? 'A' : 'B'}`,
        floorIndex: (idx % 3) + 1,
        status: 'DISTRESS' as const,
        detail: `${p.triggerSource || 'PANIC'} · ${p.lat ? `${Number(p.lat).toFixed(4)}, ${Number(p.lng).toFixed(4)}` : 'Indoor BLE Lock'}`,
        pos: [idx % 2 === 0 ? 1.15 : -1.25, 0.2 + ((idx % 3) + 1) * 1.45, idx < 2 ? 0.65 : -0.85] as [
          number,
          number,
          number,
        ],
      }));
    }
    return [
      {
        id: 'BEACON-F2-B',
        title: 'Floor 2 Wing B — Active Drill Beacon',
        zone: 'Main Tower · Floor 2',
        floorIndex: 2,
        status: 'DISTRESS' as const,
        detail: 'BLE iTag Indoor Triangulation · RSSI -54 dBm · 2 Patrol Units En Route',
        pos: [1.15, 3.15, 0.55] as [number, number, number],
      },
    ];
  }, [panicEvents]);

  const [selectedItem, setSelectedItem] = useState<CampusTelemetryItem>(() => ({
    id: 'CAMPUS-HQ',
    title: orgName ? `${orgName} — 3D Tactical Twin` : 'SafetyLink 3D Tactical Campus Twin',
    zone: `${meshNodes.length || 6} BLE Relays · ${activeAlerts.length} Active Beacon(s)`,
    floorIndex: 0,
    status: 'RELAY',
    detail: 'Click any floor, beacon, or patrol SUV to glide camera & inspect vertical telemetry',
    pos: [0, 2, 0],
  }));

  const floorFilterRef = useRef<FloorFilter>(floorFilter);
  const showMeshLinksRef = useRef(showMeshLinks);
  const showPatrolsRef = useRef(showPatrols);
  const cameraGoalRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    floorFilterRef.current = floorFilter;
  }, [floorFilter]);

  useEffect(() => {
    showMeshLinksRef.current = showMeshLinks;
  }, [showMeshLinks]);

  useEffect(() => {
    showPatrolsRef.current = showPatrols;
  }, [showPatrols]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') setDockCollapsed((c) => !c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const focusPreset = (presetId: CampusCameraPreset) => {
    setActivePreset(presetId);
    if (presetId === 'alert' && activeAlerts[0]) {
      const [ax, ay, az] = activeAlerts[0].pos;
      cameraGoalRef.current = {
        pos: new THREE.Vector3(ax + 5.2, ay + 3.4, az + 5.6),
        target: new THREE.Vector3(ax, ay, az),
      };
      setSelectedItem(activeAlerts[0]);
      setFloorFilter('explode');
      return;
    }
    const p = CAMERA_PRESETS[presetId];
    cameraGoalRef.current = {
      pos: new THREE.Vector3(...p.pos),
      target: new THREE.Vector3(...p.target),
    };
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglSupported) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b16);
    scene.fog = new THREE.FogExp2(0x050b16, 0.022);

    const width = Math.max(container.clientWidth || 720, 1);
    const height = Math.max(container.clientHeight || 500, 1);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.2, 160);
    camera.position.set(14, 12.5, 14.5);

    const { renderer, isSoftwareGl, envRenderTarget, maxAnisotropy } = createStudioRenderer(container, scene, {
      exposure: 1.12,
    });
    setupStudioLights(scene, isSoftwareGl, {
      shadowExtent: 16,
      keyPosition: [14, 22, 12],
      keyIntensity: 2.2,
      hemiIntensity: 0.9,
      useSoftbox: false,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2.2, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 5.5;
    controls.maxDistance = 36;
    controls.maxPolarAngle = Math.PI * 0.475;
    controls.addEventListener('start', () => {
      cameraGoalRef.current = null;
    });

    const brushedMap = createBrushedMetalRoughnessMap(maxAnisotropy);
    const gridTex = createTacticalGridTexture(maxAnisotropy, '#38bdf8');
    const contactShadowTex = createContactShadowTexture();

    // Extended outdoor terrain with horizon fog fade-off (no walls floating in void)
    const groundGeo = new THREE.CircleGeometry(65, 72);
    groundGeo.rotateX(-Math.PI / 2);
    const groundMat = new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.92,
      metalness: 0.08,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.receiveShadow = true;
    scene.add(ground);

    // Asphalt patrol ring road offset y=0.025 to prevent z-fighting
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x162032, roughness: 0.88, metalness: 0.05 });
    const roadRing = new THREE.Mesh(new THREE.RingGeometry(6.6, 8.3, 64), roadMat);
    roadRing.rotation.x = -Math.PI / 2;
    roadRing.position.y = 0.025;
    roadRing.receiveShadow = true;
    scene.add(roadRing);

    // Contact shadow under main building
    const bldgShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 7.6).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: contactShadowTex, transparent: true, depthWrite: false, opacity: 0.6 })
    );
    bldgShadow.position.set(0, 0.02, 0);
    scene.add(bldgShadow);

    // Shared architectural PBR materials
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x293548, roughness: 0.82, metalness: 0.1 });
    const trimMetalMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.3,
      metalness: 0.82,
      roughnessMap: brushedMap,
    });
    const glassWallMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      roughness: 0.14,
      metalness: 0.15,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.65, metalness: 0.25 });

    const clickableMeshes: THREE.Object3D[] = [];
    const registerClickable = (obj: THREE.Object3D, item: CampusTelemetryItem) => {
      obj.traverse((c) => {
        c.userData.telemetry = item;
        c.layers.enable(1);
      });
      clickableMeshes.push(obj);
    };

    // =========================================================================
    // MULTI-FLOOR MAIN COMMAND & CAMPUS BUILDING (4 STACKED COMPOSITE FLOORS)
    // =========================================================================
    const floorGroups: Array<{ group: THREE.Group; baseY: number; floorIdx: number }> = [];
    const floorNames = ['Ground Lobby & Security Desk', 'Floor 1 — Operations Wing', 'Floor 2 — Academic / Office Wing', 'Floor 3 — Executive & Comms'];

    for (let f = 0; f < 4; f++) {
      const floorGroup = new THREE.Group();
      const baseY = f * 1.45;
      floorGroup.position.y = baseY;

      // Floor concrete slab
      const slab = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.18, 4.4), concreteMat);
      slab.position.y = 0.09;
      slab.castShadow = true;
      slab.receiveShadow = true;
      floorGroup.add(slab);

      // Perimeter anodized fascia frame
      const fascia = new THREE.Mesh(new THREE.BoxGeometry(6.52, 0.12, 4.52), trimMetalMat);
      fascia.position.y = 0.06;
      floorGroup.add(fascia);

      // Curtain glass enclosure
      const glassBox = new THREE.Mesh(new THREE.BoxGeometry(6.1, 1.18, 4.1), glassWallMat);
      glassBox.position.y = 0.77;
      glassBox.renderOrder = 2;
      floorGroup.add(glassBox);

      // Structural perimeter columns (8 per floor)
      const colGeo = new THREE.BoxGeometry(0.18, 1.24, 0.18);
      const colCoords: Array<[number, number]> = [
        [-2.95, -1.95], [0, -1.95], [2.95, -1.95],
        [-2.95, 1.95], [0, 1.95], [2.95, 1.95],
        [-2.95, 0], [2.95, 0],
      ];
      colCoords.forEach(([cx, cz]) => {
        const col = new THREE.Mesh(colGeo, trimMetalMat);
        col.position.set(cx, 0.78, cz);
        col.castShadow = true;
        floorGroup.add(col);
      });

      // Central elevator / stairwell core
      const core = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.22, 1.2), coreMat);
      core.position.set(-0.1, 0.78, -0.2);
      floorGroup.add(core);

      // Floor BLE Relay Node mounted on east wall
      const relayNode = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.16, 0),
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          emissive: new THREE.Color(0x10b981),
          emissiveIntensity: 1.4,
        })
      );
      relayNode.position.set(2.75, 0.9, 1.55);
      floorGroup.add(relayNode);

      registerClickable(floorGroup, {
        id: `FLOOR-${f}`,
        title: floorNames[f],
        zone: `Elevation +${(f * 3.8).toFixed(1)}m · BLE Zone ${f + 1}`,
        floorIndex: f,
        status: 'RELAY',
        detail: '2 BLE fixed beacons online · Evacuation stairwell clear · Access control armed',
        pos: [0, baseY + 0.8, 0],
      });

      scene.add(floorGroup);
      floorGroups.push({ group: floorGroup, baseY, floorIdx: f });
    }

    // Rooftop Comms Penthouse + Telemetry Mast + Solar Panels
    const roofGroup = new THREE.Group();
    const roofBaseY = 4 * 1.45;
    roofGroup.position.y = roofBaseY;

    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.2, 4.5), concreteMat);
    roofSlab.position.y = 0.1;
    roofSlab.castShadow = true;
    roofGroup.add(roofSlab);

    const penthouse = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 1.8), coreMat);
    penthouse.position.set(-1.1, 0.62, -0.4);
    penthouse.castShadow = true;
    roofGroup.add(penthouse);

    // Rooftop Comms Mast
    const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 2.4, 12), trimMetalMat);
    mastPole.position.set(-1.1, 2.15, -0.4);
    const mastDish = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.25, 18, 1, true), trimMetalMat);
    mastDish.rotation.z = Math.PI / 3;
    mastDish.position.set(-0.75, 2.6, -0.4);
    const mastTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x38bdf8), emissiveIntensity: 2.0 })
    );
    mastTip.position.set(-1.1, 3.38, -0.4);
    roofGroup.add(mastPole, mastDish, mastTip);

    // Solar panels angled on roof
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x0f2c59, roughness: 0.2, metalness: 0.78 });
    for (let i = 0; i < 3; i++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 1.45), solarMat);
      panel.position.set(1.1 + i * 0.0, 0.42, -1.1 + i * 1.1);
      panel.rotation.z = -0.22;
      roofGroup.add(panel);
    }

    registerClickable(roofGroup, {
      id: 'ROOF-COMMS',
      title: 'Rooftop ZeroLink Relay & Solar Array',
      zone: 'Main Tower Roof · Primary Uplink',
      floorIndex: 4,
      status: 'RELAY',
      detail: 'Dual LTE/BLE LoRa gateway · Battery backup 98% · 4G/USSD fallback active',
      pos: [-1.1, roofBaseY + 2.2, -0.4],
    });
    scene.add(roofGroup);

    // =========================================================================
    // GUARD GATEHOUSE + BOOM BARRIER + MUSTER SAFE ZONE
    // =========================================================================
    const gateGroup = new THREE.Group();
    gateGroup.position.set(-4.6, 0, 5.2);
    const gateBody = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 1.7), coreMat);
    gateBody.position.y = 0.675;
    gateBody.castShadow = true;
    const gateCanopy = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.14, 2.3), trimMetalMat);
    gateCanopy.position.y = 1.42;
    gateCanopy.castShadow = true;
    const gateWindow = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.48, 1.2), glassWallMat);
    gateWindow.position.y = 0.92;
    const boomPost = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.85, 0.24), trimMetalMat);
    boomPost.position.set(1.4, 0.425, 0.35);
    const boomArm = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.07, 0.07),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4, metalness: 0.2 })
    );
    boomArm.position.set(2.55, 0.72, 0.35);
    gateGroup.add(gateBody, gateCanopy, gateWindow, boomPost, boomArm);
    registerClickable(gateGroup, {
      id: 'GATE-NORTH',
      title: 'Security Gatehouse & Boom Control',
      zone: 'Perimeter Entrance · Armed Guard Post',
      floorIndex: 0,
      status: 'PATROL',
      detail: 'Hikvision LPR camera online · Guard tablet synced · Boom interlock active',
      pos: [-4.6, 1.0, 5.2],
    });
    scene.add(gateGroup);

    // Muster Safe Zone Pad (East lawn)
    const musterGroup = new THREE.Group();
    musterGroup.position.set(5.6, 0.03, 4.4);
    const musterPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.65, 0.06, 32),
      new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.65, metalness: 0.15 })
    );
    const musterRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.05, 12, 48).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: new THREE.Color(0x10b981), emissiveIntensity: 1.2 })
    );
    musterRing.position.y = 0.04;
    const musterPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 10), trimMetalMat);
    musterPost.position.set(0, 0.7, 0);
    const musterSign = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.42, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.35 })
    );
    musterSign.position.set(0, 1.35, 0);
    musterGroup.add(musterPad, musterRing, musterPost, musterSign);
    registerClickable(musterGroup, {
      id: 'MUSTER-EAST',
      title: 'Emergency Muster Assembly Point',
      zone: 'East Courtyard · Verified Safe Zone',
      floorIndex: 0,
      status: 'MUSTER',
      detail: 'BLE auto-headcount beacon armed · Capacity 180 personnel',
      pos: [5.6, 0.8, 4.4],
    });
    scene.add(musterGroup);

    // =========================================================================
    // INSTANCED PERIMETER BOLLARDS & MULTI-PART CAMPUS TREES (>20 INSTANCES)
    // =========================================================================
    const bollardCount = 36;
    const bollardGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.75, 10);
    bollardGeo.translate(0, 0.375, 0);
    const bollardMesh = new THREE.InstancedMesh(bollardGeo, trimMetalMat, bollardCount);
    const _dummy = new THREE.Object3D();
    for (let i = 0; i < bollardCount; i++) {
      const angle = (i / bollardCount) * Math.PI * 2;
      _dummy.position.set(Math.cos(angle) * 9.8, 0, Math.sin(angle) * 9.8);
      _dummy.rotation.set(0, -angle, 0);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      bollardMesh.setMatrixAt(i, _dummy.matrix);
    }
    bollardMesh.instanceMatrix.needsUpdate = true;
    bollardMesh.computeBoundingSphere();
    scene.add(bollardMesh);

    // Composite multi-part campus trees around outer perimeter (grounded flush)
    const treeCount = 24;
    const trunkGeo = new THREE.CylinderGeometry(0.11, 0.17, 1.15, 8);
    trunkGeo.translate(0, 0.575, 0);
    const crownLowGeo = new THREE.ConeGeometry(0.95, 1.45, 7);
    crownLowGeo.translate(0, 1.65, 0);
    const crownTopGeo = new THREE.ConeGeometry(0.68, 1.2, 7);
    crownTopGeo.translate(0, 2.55, 0);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2f2f, roughness: 0.92, metalness: 0.02 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x0f4c3a, roughness: 0.84, metalness: 0.04 });

    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    const crownsLow = new THREE.InstancedMesh(crownLowGeo, foliageMat, treeCount);
    const crownsTop = new THREE.InstancedMesh(crownTopGeo, foliageMat, treeCount);
    const _tint = new THREE.Color();

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + 0.14;
      const radius = 11.4 + ((i * 37) % 10) * 0.45;
      const scale = 0.85 + ((i * 23) % 10) * 0.032;
      _dummy.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      _dummy.rotation.set(0, i * 1.1, 0);
      _dummy.scale.setScalar(scale);
      _dummy.updateMatrix();
      trunks.setMatrixAt(i, _dummy.matrix);
      crownsLow.setMatrixAt(i, _dummy.matrix);
      crownsTop.setMatrixAt(i, _dummy.matrix);
      _tint.setHSL(0.43 + ((i % 5) - 2) * 0.015, 0.55, 0.2 + (i % 3) * 0.03);
      crownsLow.setColorAt(i, _tint);
      crownsTop.setColorAt(i, _tint);
    }
    trunks.instanceMatrix.needsUpdate = true;
    crownsLow.instanceMatrix.needsUpdate = true;
    crownsTop.instanceMatrix.needsUpdate = true;
    if (crownsLow.instanceColor) crownsLow.instanceColor.needsUpdate = true;
    if (crownsTop.instanceColor) crownsTop.instanceColor.needsUpdate = true;
    trunks.computeBoundingSphere();
    crownsLow.computeBoundingSphere();
    crownsTop.computeBoundingSphere();
    scene.add(trunks, crownsLow, crownsTop);

    // =========================================================================
    // ACTIVE INCIDENT BEACONS (4-PART HOLOGRAPHIC DISTRESS SPIRES)
    // =========================================================================
    const beaconEntries: Array<{
      group: THREE.Group;
      ring: THREE.Mesh;
      crystal: THREE.Mesh;
      floorIdx: number;
      localY: number;
    }> = [];

    activeAlerts.forEach((alert) => {
      const bGroup = new THREE.Group();
      const redMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: new THREE.Color(0xef4444),
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), redMat);
      crystal.position.y = 0.55;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), redMat);
      stem.position.y = 0.25;
      const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.48, 0.035, 10, 32).rotateX(Math.PI / 2),
        redMat
      );
      const pulseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.025, 10, 32).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xf87171, transparent: true, opacity: 0.7, depthWrite: false })
      );
      pulseRing.position.y = 0.06;
      bGroup.add(crystal, stem, baseRing, pulseRing);
      bGroup.position.set(alert.pos[0], alert.pos[1], alert.pos[2]);

      registerClickable(bGroup, alert);
      scene.add(bGroup);
      beaconEntries.push({
        group: bGroup,
        ring: pulseRing,
        crystal,
        floorIdx: Math.min(Math.max(alert.floorIndex, 0), 3),
        localY: 0.25,
      });
    });

    // =========================================================================
    // BLE MESH RELAY ARCS (TUBEGEOMETRY CONNECTING ROOF TO ZONES)
    // =========================================================================
    const meshLinksGroup = new THREE.Group();
    const linkTargets: Array<[number, number, number]> = [
      [-4.6, 1.5, 5.2],
      [5.6, 1.4, 4.4],
      [2.75, 2.35, 1.55],
      [2.75, 3.8, 1.55],
    ];
    const linkOrigin = new THREE.Vector3(-1.1, roofBaseY + 3.2, -0.4);
    const linkMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 });

    linkTargets.forEach(([tx, ty, tz]) => {
      const end = new THREE.Vector3(tx, ty, tz);
      const mid = linkOrigin.clone().lerp(end, 0.5);
      mid.y += 1.8;
      const curve = new THREE.CatmullRomCurve3([linkOrigin, mid, end]);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.028, 6, false), linkMat);
      meshLinksGroup.add(tube);
    });
    scene.add(meshLinksGroup);

    // =========================================================================
    // PATROL UNITS (2 COMPOSITE 6-PART ARMED RESPONSE SUVS ON PERIMETER ROAD)
    // =========================================================================
    const patrolGroup = new THREE.Group();
    const patrol1 = createPatrolVehicle(brushedMap);
    const patrol2 = createPatrolVehicle(brushedMap);
    registerClickable(patrol1, {
      id: 'PATROL-ALPHA',
      title: 'Armed Response Unit — Alpha 01',
      zone: 'Perimeter Ring Road · Active Patrol',
      floorIndex: 0,
      status: 'PATROL',
      detail: 'ETA to Main Entrance: 18s · GPS Lock 2.4m · Radio Channel 1',
      pos: [7.4, 0.6, 0],
    });
    registerClickable(patrol2, {
      id: 'PATROL-BRAVO',
      title: 'Tactical Unit — Bravo 02',
      zone: 'Perimeter Ring Road · Escort Watch',
      floorIndex: 0,
      status: 'PATROL',
      detail: 'BLE Mobile Repeater Active · Dashcam Linked · Ready for Dispatch',
      pos: [-7.4, 0.6, 0],
    });
    patrolGroup.add(patrol1, patrol2);
    scene.add(patrolGroup);

    // Raycasting on layer 1
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointer = new THREE.Vector2();
    let downPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      downPos = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, true);
      if (hits.length > 0) {
        const telemetry = hits[0].object.userData.telemetry as CampusTelemetryItem | undefined;
        if (telemetry) {
          setSelectedItem(telemetry);
          const worldPos = new THREE.Vector3();
          hits[0].object.getWorldPosition(worldPos);
          cameraGoalRef.current = {
            pos: new THREE.Vector3(worldPos.x + 6.5, Math.max(worldPos.y + 4.8, 4.5), worldPos.z + 6.8),
            target: worldPos.clone(),
          };
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const resizeObserver = new ResizeObserver(() => {
      const w = Math.max(container.clientWidth || 1, 1);
      const h = Math.max(container.clientHeight || 1, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const loop = createPacedLoop(renderer, isSoftwareGl);
    loop.start((delta, elapsed) => {
      const mode = floorFilterRef.current;
      const explodeGap = mode === 'explode' ? 1.15 : 0;

      floorGroups.forEach(({ group, baseY, floorIdx }) => {
        const targetY = baseY + floorIdx * explodeGap;
        group.position.y = THREE.MathUtils.damp(group.position.y, targetY, 6, delta);
        const visible =
          mode === 'all' ||
          mode === 'explode' ||
          mode === 'roof' ||
          (mode === 'f1' && floorIdx <= 1) ||
          (mode === 'f2' && floorIdx <= 2) ||
          (mode === 'f3' && floorIdx <= 3);
        group.visible = visible;
      });

      const roofTargetY = roofBaseY + 4 * explodeGap;
      roofGroup.position.y = THREE.MathUtils.damp(roofGroup.position.y, roofTargetY, 6, delta);
      roofGroup.visible = mode === 'all' || mode === 'explode' || mode === 'roof';

      // Keep incident beacons locked onto their floor elevation as floors separate
      beaconEntries.forEach((b, idx) => {
        const hostFloor = floorGroups[b.floorIdx];
        if (hostFloor) {
          b.group.position.y = hostFloor.group.position.y + b.localY;
          b.group.visible = hostFloor.group.visible;
        }
        b.crystal.rotation.y = elapsed * 1.8 + idx;
        const phase = (elapsed * 0.85 + idx * 0.35) % 1;
        const ringScale = 1 + phase * 2.4;
        b.ring.scale.set(ringScale, 1, ringScale);
        (b.ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.72;
      });

      // Toggle overlays
      meshLinksGroup.visible = showMeshLinksRef.current;
      patrolGroup.visible = showPatrolsRef.current;

      // Smoothly move patrol SUVs around perimeter ring road (radius 7.45)
      if (patrolGroup.visible) {
        const r = 7.45;
        const a1 = elapsed * 0.24;
        patrol1.position.set(Math.cos(a1) * r, 0.03, Math.sin(a1) * r);
        patrol1.rotation.y = -a1;

        const a2 = elapsed * 0.24 + Math.PI;
        patrol2.position.set(Math.cos(a2) * r, 0.03, Math.sin(a2) * r);
        patrol2.rotation.y = -a2;
      }

      // Smooth camera preset gliding
      const goal = cameraGoalRef.current;
      if (goal) {
        const alpha = 1 - Math.exp(-5.5 * delta);
        camera.position.lerp(goal.pos, alpha);
        controls.target.lerp(goal.target, alpha);
        if (camera.position.distanceTo(goal.pos) < 0.06 && controls.target.distanceTo(goal.target) < 0.06) {
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
  }, [activeAlerts, webglSupported]);

  if (!webglSupported) {
    return (
      <div className={`w-full ${heightClass} rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-6 text-center`}>
        <p className="text-xs font-mono text-slate-400">
          3D Campus Twin unavailable on this device. Use the 2D Google Maps War Room view.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-[#050b16] border border-slate-800 select-none`}
      data-testid="three-tactical-campus-scene"
    >
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top-Left Telemetry Readout Badge (solid rgba, static indicator) */}
      <div
        className="absolute top-3 left-3 z-10 max-w-sm rounded-xl px-3.5 py-2.5 border border-slate-700/80 pointer-events-none"
        style={{ backgroundColor: 'rgba(5, 11, 22, 0.92)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                selectedItem.status === 'DISTRESS'
                  ? '#ef4444'
                  : selectedItem.status === 'PATROL'
                  ? '#38bdf8'
                  : '#10b981',
            }}
          />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-300">
            {selectedItem.status} · {selectedItem.zone}
          </span>
        </div>
        <div className="text-xs font-bold text-white mt-1">{selectedItem.title}</div>
        <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{selectedItem.detail}</div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-[880px] flex flex-col items-center pointer-events-none">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-lg rounded-b-md border border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5"
          style={{ backgroundColor: 'rgba(5, 11, 22, 0.93)' }}
        >
          {dockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{dockCollapsed ? 'Show Tactical 3D Controls (H)' : 'Hide Controls (H)'}</span>
        </button>

        {!dockCollapsed && (
          <div
            className="pointer-events-auto w-full rounded-xl border border-slate-700/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5"
            style={{ backgroundColor: 'rgba(5, 11, 22, 0.94)' }}
          >
            {/* Floor Isolation Controls */}
            <div className="flex items-center gap-1 flex-wrap">
              <Layers className="w-3.5 h-3.5 text-emerald-400 mr-1" />
              {(
                [
                  ['all', 'All'],
                  ['explode', 'Explode'],
                  ['f1', 'F1'],
                  ['f2', 'F2'],
                  ['f3', 'F3'],
                  ['roof', 'Roof'],
                ] as Array<[FloorFilter, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFloorFilter(key)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                    floorFilter === key
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Camera Views */}
            <div className="flex items-center gap-1 flex-wrap">
              <Building2 className="w-3.5 h-3.5 text-sky-400 mr-1" />
              {(Object.keys(CAMERA_PRESETS) as CampusCameraPreset[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => focusPreset(k)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                    activePreset === k
                      ? k === 'alert'
                        ? 'bg-red-600 text-white'
                        : 'bg-sky-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {CAMERA_PRESETS[k].label}
                </button>
              ))}
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowMeshLinks((v) => !v)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showMeshLinks
                    ? 'bg-emerald-900/70 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>BLE Mesh</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPatrols((v) => !v)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showPatrols
                    ? 'bg-sky-900/70 border border-sky-500/50 text-sky-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Patrols</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticalCampus3DScene;
