import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Bot, Building2, ChevronDown, ChevronUp, Cpu, Layers, Navigation, Radio, ShieldAlert } from 'lucide-react';
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
type CampusCameraPreset = 'iso' | 'alert' | 'drone' | 'robot' | 'gatehouse' | 'top';

interface CampusTelemetryItem {
  id: string;
  title: string;
  zone: string;
  floorIndex: number;
  status: 'DISTRESS' | 'PATROL' | 'RELAY' | 'MUSTER' | 'DRONE' | 'ROBOT' | 'IOT';
  detail: string;
  pos: [number, number, number];
}

const CAMERA_PRESETS: Record<CampusCameraPreset, { label: string; pos: [number, number, number]; target: [number, number, number] }> = {
  iso: { label: 'Isometric', pos: [14.5, 12.8, 15.0], target: [0, 2.4, 0] },
  alert: { label: 'Active Alert', pos: [5.5, 6.8, 6.2], target: [0.9, 3.6, 0.5] },
  drone: { label: 'Drones', pos: [8.4, 11.4, 7.6], target: [1.2, 7.0, 0.6] },
  robot: { label: 'LimX Robots', pos: [8.8, 3.4, 6.6], target: [4.8, 0.6, 2.0] },
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

/**
 * True-to-scale Autonomous Tactical Response Quadcopter (XJ3 / Drone-in-a-Box scale ~0.68 unit span)
 */
function createAutonomousDrone(brushedMap: THREE.Texture, accentHex: number): THREE.Group {
  const drone = new THREE.Group();
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.36,
    metalness: 0.65,
    roughnessMap: brushedMap,
  });
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.28,
    metalness: 0.5,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 1.9,
    roughness: 0.25,
  });
  const rotorDiscMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4, metalness: 0.7 });

  // Central carbon fuselage + top GNSS dome
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.34), shellMat);
  body.castShadow = true;
  const batteryPack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.24), carbonMat);
  batteryPack.position.y = 0.06;
  const gpsDome = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.035, 14), accentMat);
  gpsDome.position.set(0, 0.105, -0.02);
  drone.add(body, batteryPack, gpsDome);

  // Underslung 2-axis 4K thermal/optical camera gimbal
  const gimbalYoke = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.08), carbonMat);
  gimbalYoke.position.set(0, -0.075, 0.08);
  const cameraPod = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 12), carbonMat);
  cameraPod.position.set(0, -0.105, 0.105);
  const thermalLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.03, 12).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 2.2,
    })
  );
  thermalLens.position.set(0, -0.105, 0.145);
  drone.add(gimbalYoke, cameraPod, thermalLens);

  // Twin carbon landing skids
  [-0.12, 0.12].forEach((sx) => {
    const strutF = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), carbonMat);
    strutF.position.set(sx, -0.1, 0.08);
    const strutR = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), carbonMat);
    strutR.position.set(sx, -0.1, -0.08);
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 8).rotateX(Math.PI / 2), carbonMat);
    skid.position.set(sx, -0.18, 0);
    drone.add(strutF, strutR, skid);
  });

  // 4 diagonal arms, motor pods, spinning blades & navigation strobes
  const rotors: THREE.Group[] = [];
  const armAngles = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75];
  armAngles.forEach((angle, idx) => {
    const armLen = 0.31;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, armLen, 8), carbonMat);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = -angle;
    arm.position.set(Math.cos(angle) * (armLen * 0.5), 0.02, Math.sin(angle) * (armLen * 0.5));
    drone.add(arm);

    const mx = Math.cos(angle) * armLen;
    const mz = Math.sin(angle) * armLen;
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.055, 12), carbonMat);
    motor.position.set(mx, 0.04, mz);
    drone.add(motor);

    // Navigation strobe under each motor (green starboard, red port)
    const navColor = idx === 0 || idx === 3 ? 0x10b981 : 0xef4444;
    const strobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 8, 8),
      new THREE.MeshBasicMaterial({ color: navColor })
    );
    strobe.position.set(mx, 0.005, mz);
    drone.add(strobe);

    // Rotor assembly (disc + twin blades)
    const rotorPivot = new THREE.Group();
    rotorPivot.position.set(mx, 0.075, mz);
    const disc = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.165, 20).rotateX(-Math.PI / 2), rotorDiscMat);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.006, 0.028), bladeMat);
    rotorPivot.add(disc, blade);
    drone.add(rotorPivot);
    rotors.push(rotorPivot);
  });

  // Downward translucent thermal/optical scan cone
  const scanCone = new THREE.Mesh(
    new THREE.ConeGeometry(1.15, 2.9, 20, 1, true),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.11,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scanCone.position.set(0, -1.56, 0.06);
  drone.add(scanCone);

  drone.userData.rotors = rotors;
  drone.userData.scanCone = scanCone;
  return drone;
}

/**
 * True-to-scale LimX Dynamics Modular TRON2 Patrol Robot (~0.74 units tall ≈ 1.85m next to campus floors & SUVs)
 */
function createLimxPatrolRobot(brushedMap: THREE.Texture, accentHex: number): THREE.Group {
  const robot = new THREE.Group();
  const armorWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.34,
    metalness: 0.35,
  });
  const chassisDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.72,
    roughnessMap: brushedMap,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 1.9,
    roughness: 0.25,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.88, metalness: 0.08 });

  // Articulated torso assembly (elevated above hip axle)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 0.46;

  const coreTorso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.22), chassisDarkMat);
  coreTorso.castShadow = true;
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.17, 0.24), armorWhiteMat);
  chestPlate.position.y = 0.03;
  chestPlate.castShadow = true;
  const visorBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.025), accentMat);
  visorBar.position.set(0, 0.05, 0.125);
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.1), chassisDarkMat);
  backpack.position.set(0, 0.02, -0.14);

  // Top 360° spinning LiDAR & optical dome turret
  const lidarGroup = new THREE.Group();
  lidarGroup.position.set(0, 0.18, 0.01);
  const lidarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.08, 0.05, 14), chassisDarkMat);
  const lidarLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.042, 14),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: new THREE.Color(0x0ea5e9),
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.7,
    })
  );
  lidarLens.position.y = 0.045;
  const lidarCap = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.02, 14), armorWhiteMat);
  lidarCap.position.y = 0.075;
  const lidarSweep = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.03, 0.08), accentMat);
  lidarSweep.position.set(0, 0.045, 0.035);
  lidarGroup.add(lidarBase, lidarLens, lidarCap, lidarSweep);

  // Rear BLE mesh antenna whip
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.22, 6), chassisDarkMat);
  ant.position.set(-0.08, 0.2, -0.13);
  const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), accentMat);
  antTip.position.set(-0.08, 0.315, -0.13);

  torsoGroup.add(coreTorso, chestPlate, visorBar, backpack, lidarGroup, ant, antTip);
  robot.add(torsoGroup);

  // Dual articulated bipedal-wheeled legs (LimX TRON2 hybrid gait)
  const buildLeg = (side: -1 | 1): THREE.Group => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.155, 0.38, 0);

    const hipJoint = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.07, 12).rotateZ(Math.PI / 2), chassisDarkMat);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.19, 0.08), armorWhiteMat);
    thigh.position.set(0, -0.09, 0.02);
    thigh.rotation.x = 0.22;
    thigh.castShadow = true;

    const knee = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.075, 10).rotateZ(Math.PI / 2), chassisDarkMat);
    knee.position.set(0, -0.18, 0.045);

    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.07), chassisDarkMat);
    shin.position.set(0, -0.26, 0.01);
    shin.rotation.x = -0.24;
    shin.castShadow = true;

    // Hybrid powered wheel-foot grounded cleanly at y = 0 (offset -0.38 from hip)
    const wheelFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.055, 16).rotateZ(Math.PI / 2), tireMat);
    wheelFoot.position.set(0, -0.298, -0.01);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.062, 12).rotateZ(Math.PI / 2), accentMat);
    hub.position.set(0, -0.298, -0.01);

    hip.add(hipJoint, thigh, knee, shin, wheelFoot, hub);
    return hip;
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);
  robot.add(leftLeg, rightLeg);

  // Ground-projected mobile BLE Mesh Repeater halo
  const meshHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.32, 0.42, 24).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  meshHalo.position.y = 0.03;
  robot.add(meshHalo);

  robot.userData.leftLeg = leftLeg;
  robot.userData.rightLeg = rightLeg;
  robot.userData.lidar = lidarGroup;
  robot.userData.torso = torsoGroup;
  robot.userData.meshHalo = meshHalo;
  return robot;
}

/**
 * Automatic Dynamic IoT Smart Sensor Pole (NB-IoT / Hikvision Optical-Acoustic Perimeter Unit)
 */
function createDynamicIotPole(brushedMap: THREE.Texture): THREE.Group {
  const pole = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 });
  const mastMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.3,
    metalness: 0.85,
    roughnessMap: brushedMap,
  });
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.42, metalness: 0.55 });
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.22, metalness: 0.6 });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: new THREE.Color(0x06b6d4),
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });

  // Ground plinth
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 12), baseMat);
  plinth.position.y = 0.09;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.058, 1.48, 12), mastMat);
  mast.position.y = 0.82;
  mast.castShadow = true;

  // Armored NB-IoT / ThingsBoard telemetry box
  const ctrlBox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.28, 0.16), boxMat);
  ctrlBox.position.set(0, 0.85, 0.08);
  const statusLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.02), beaconMat);
  statusLed.position.set(0, 0.94, 0.165);

  // 360° optical/acoustic dome + angled solar charging panel + NB-IoT antenna
  const sensorRing = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 20).rotateX(Math.PI / 2), beaconMat);
  sensorRing.position.y = 1.48;
  const opticDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6),
    new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.1, metalness: 0.9 })
  );
  opticDome.position.y = 1.5;

  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.022, 0.24), solarMat);
  solarPanel.position.set(0, 1.66, -0.02);
  solarPanel.rotation.x = 0.26;

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.34, 6), mastMat);
  antenna.position.set(0.12, 1.76, -0.04);
  const antGlow = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 8), beaconMat);
  antGlow.position.set(0.12, 1.94, -0.04);

  pole.add(plinth, mast, ctrlBox, statusLed, sensorRing, opticDome, solarPanel, antenna, antGlow);
  pole.userData.sensorRing = sensorRing;
  return pole;
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
  const [showDrones, setShowDrones] = useState(true);
  const [showRobots, setShowRobots] = useState(true);
  const [showIotGrid, setShowIotGrid] = useState(true);
  const [droneDispatched, setDroneDispatched] = useState(false);
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
        detail: 'BLE iTag Indoor Triangulation · RSSI -54 dBm · Drones, LimX Robots & Patrols Armed',
        pos: [1.15, 3.15, 0.55] as [number, number, number],
      },
    ];
  }, [panicEvents]);

  const [selectedItem, setSelectedItem] = useState<CampusTelemetryItem>(() => ({
    id: 'CAMPUS-HQ',
    title: orgName ? `${orgName} — 3D Autonomous Campus Twin` : 'SafetyLink 3D Autonomous Campus Twin',
    zone: `2 Drones · 2 LimX TRON2 Robots · 6 Dynamic IoT Poles · ${meshNodes.length || 6} BLE Relays`,
    floorIndex: 0,
    status: 'RELAY',
    detail: 'Click any Drone, LimX Robot, Dynamic IoT Pole, Floor, or Patrol SUV to glide camera & inspect telemetry',
    pos: [0, 2, 0],
  }));

  const floorFilterRef = useRef<FloorFilter>(floorFilter);
  const showMeshLinksRef = useRef(showMeshLinks);
  const showPatrolsRef = useRef(showPatrols);
  const showDronesRef = useRef(showDrones);
  const showRobotsRef = useRef(showRobots);
  const showIotGridRef = useRef(showIotGrid);
  const droneDispatchedRef = useRef(droneDispatched);
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
    showDronesRef.current = showDrones;
  }, [showDrones]);

  useEffect(() => {
    showRobotsRef.current = showRobots;
  }, [showRobots]);

  useEffect(() => {
    showIotGridRef.current = showIotGrid;
  }, [showIotGrid]);

  useEffect(() => {
    droneDispatchedRef.current = droneDispatched;
  }, [droneDispatched]);

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
    if (presetId === 'drone') {
      setSelectedItem({
        id: 'DRN-01',
        title: 'Autonomous Interceptor Drone — DRN-01',
        zone: 'Rooftop Drone-in-a-Box · Airspace Sector A',
        floorIndex: 4,
        status: 'DRONE',
        detail: '4K Dual Thermal/Optical Gimbal · Pre-programmed SOS Intercept · Auto-Return Charging Dock',
        pos: [1.8, 7.6, 0.9],
      });
    } else if (presetId === 'robot') {
      setSelectedItem({
        id: 'LIMX-TRON2-01',
        title: 'LimX Dynamics TRON2 Patrol Robot — Unit 01',
        zone: 'Inner Courtyard Walkway · Autonomous Loop',
        floorIndex: 0,
        status: 'ROBOT',
        detail: 'Hybrid Wheeled-Bipedal Gait · 360° LiDAR SLAM · Mobile BLE Mesh Repeater Active',
        pos: [5.2, 0.5, 0],
      });
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

    // =========================================================================
    // ROOFTOP DRONE-IN-A-BOX PAD + 2 AUTONOMOUS TACTICAL RESPONSE DRONES
    // =========================================================================
    const droneDockGroup = new THREE.Group();
    droneDockGroup.position.set(1.75, 0.24, 0.72);
    const dockBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.84, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 })
    );
    const dockRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.026, 10, 32).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: new THREE.Color(0x0ea5e9),
        emissiveIntensity: 1.8,
      })
    );
    dockRing.position.y = 0.08;
    const dockPadH1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.012, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    dockPadH1.position.set(-0.15, 0.08, 0);
    const dockPadH2 = dockPadH1.clone();
    dockPadH2.position.x = 0.15;
    const dockPadHBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.012, 0.06),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    dockPadHBar.position.set(0, 0.08, 0);
    droneDockGroup.add(dockBase, dockRing, dockPadH1, dockPadH2, dockPadHBar);
    registerClickable(droneDockGroup, {
      id: 'DRONE-BOX-ROOF',
      title: 'Automated Drone-in-a-Box Docking Station',
      zone: 'Main Tower Rooftop · Launch Bay 01',
      floorIndex: 4,
      status: 'DRONE',
      detail: 'Inductive Fast-Charge Pad · Weatherproof Clamshell · Auto-Launches on SOS Trigger',
      pos: [1.75, roofBaseY + 0.5, 0.72],
    });
    roofGroup.add(droneDockGroup);

    const dronesGroup = new THREE.Group();
    const drone1 = createAutonomousDrone(brushedMap, 0x38bdf8);
    const drone2 = createAutonomousDrone(brushedMap, 0x10b981);
    registerClickable(drone1, {
      id: 'DRN-01',
      title: 'Autonomous Tactical Drone — DRN-01 (Interceptor)',
      zone: 'Airspace Sector A · 4K Thermal/Optical',
      floorIndex: 4,
      status: 'DRONE',
      detail: 'Linked to Rooftop Drone-in-a-Box · Pre-programmed SOS Intercept · Battery 94% · RTB Armed',
      pos: [1.8, 7.8, 1.0],
    });
    registerClickable(drone2, {
      id: 'DRN-02',
      title: 'Autonomous Perimeter Recon Drone — DRN-02',
      zone: 'Outer Perimeter Airspace · Thermal Sweep',
      floorIndex: 4,
      status: 'DRONE',
      detail: 'Autonomous Corridor Patrol · Night-Vision Optical Flow · Live RTSP Feed to War Room',
      pos: [-6.0, 9.2, 4.0],
    });
    dronesGroup.add(drone1, drone2);
    scene.add(dronesGroup);

    // =========================================================================
    // LIMX DYNAMICS MODULAR TRON2 AUTONOMOUS PATROL ROBOTS (TRUE CAMPUS SCALE)
    // =========================================================================
    const robotsGroup = new THREE.Group();
    const robot1 = createLimxPatrolRobot(brushedMap, 0x38bdf8);
    const robot2 = createLimxPatrolRobot(brushedMap, 0x10b981);
    registerClickable(robot1, {
      id: 'LIMX-TRON2-01',
      title: 'LimX Dynamics TRON2 Patrol Robot — Unit 01',
      zone: 'Inner Courtyard Walkway · Sector North-West',
      floorIndex: 0,
      status: 'ROBOT',
      detail: 'Hybrid Wheeled-Bipedal Terrain Gait · 360° LiDAR SLAM · Mobile BLE Mesh Repeater (RSSI -42 dBm)',
      pos: [5.2, 0.5, 0],
    });
    registerClickable(robot2, {
      id: 'LIMX-TRON2-02',
      title: 'LimX Dynamics TRON2 Patrol Robot — Unit 02',
      zone: 'East Muster & Gatehouse Corridor',
      floorIndex: 0,
      status: 'ROBOT',
      detail: 'Autonomous Night-Watch Thermal Verification · Acoustic Anomaly Detector · Battery 88%',
      pos: [-5.2, 0.5, 0],
    });
    robotsGroup.add(robot1, robot2);
    scene.add(robotsGroup);

    // =========================================================================
    // AUTOMATIC DYNAMIC IOT PERIMETER SMART POLES + REAL-TIME DATA PACKET LINKS
    // =========================================================================
    const iotGridGroup = new THREE.Group();
    const iotPoles: Array<{ mesh: THREE.Group; topPos: THREE.Vector3 }> = [];
    const iotPacketCurves: THREE.CatmullRomCurve3[] = [];
    const iotPackets: THREE.Mesh[] = [];
    const iotPoleCount = 6;
    const iotRadius = 6.15;
    const iotArcMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.34,
    });
    const iotPacketMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const iotPacketGeo = new THREE.SphereGeometry(0.065, 8, 8);

    const iotZones = [
      'North Access NB-IoT Pole',
      'North-East Solar Optical Node',
      'South-East Muster Sensor Mast',
      'South Driveway Acoustic Radar',
      'South-West Gatehouse AX PRO Link',
      'West Perimeter Thermal Pole',
    ];

    for (let i = 0; i < iotPoleCount; i++) {
      const angle = (i / iotPoleCount) * Math.PI * 2 + Math.PI / 6;
      const px = Math.cos(angle) * iotRadius;
      const pz = Math.sin(angle) * iotRadius;
      const pole = createDynamicIotPole(brushedMap);
      pole.position.set(px, 0, pz);
      pole.rotation.y = -angle + Math.PI;
      registerClickable(pole, {
        id: `IOT-NODE-0${i + 1}`,
        title: `Dynamic IoT Smart Pole — NODE-0${i + 1}`,
        zone: iotZones[i],
        floorIndex: 0,
        status: 'IOT',
        detail: 'NB-IoT + Hikvision AX PRO Bridge · Solar Backed · Real-Time ThingsBoard Cloud HTTP Telemetry',
        pos: [px, 1.4, pz],
      });
      iotGridGroup.add(pole);

      const topPos = new THREE.Vector3(px, 1.94, pz);
      iotPoles.push({ mesh: pole, topPos });

      // Curved dynamic telemetry arc from each IoT pole up to rooftop command uplink
      const mid = topPos.clone().lerp(linkOrigin, 0.5);
      mid.y += 1.35;
      const curve = new THREE.CatmullRomCurve3([topPos, mid, linkOrigin]);
      iotPacketCurves.push(curve);
      const arcTube = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, 0.018, 6, false), iotArcMat);
      iotGridGroup.add(arcTube);

      // Animated data packet orb sliding along the IoT arc
      const pkt = new THREE.Mesh(iotPacketGeo, iotPacketMat);
      iotGridGroup.add(pkt);
      iotPackets.push(pkt);
    }

    // Dynamic real-time link lines connecting moving Drones & LimX Robots to Rooftop Uplink & Active Alert
    const dynamicLinkPositions = new Float32Array(5 * 2 * 3); // 5 dynamic segments (2 drones->roof, 2 robots->nearest IoT, 1 drone1->SOS)
    const dynamicLinkGeo = new THREE.BufferGeometry();
    dynamicLinkGeo.setAttribute('position', new THREE.BufferAttribute(dynamicLinkPositions, 3));
    const dynamicLinkLines = new THREE.LineSegments(
      dynamicLinkGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.62 })
    );
    iotGridGroup.add(dynamicLinkLines);
    scene.add(iotGridGroup);

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
      dronesGroup.visible = showDronesRef.current;
      robotsGroup.visible = showRobotsRef.current;
      iotGridGroup.visible = showIotGridRef.current;

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

      // Animate Autonomous Drones (high-RPM rotors, banking turns, SOS intercept hover)
      const primaryAlertPos = beaconEntries[0]
        ? beaconEntries[0].group.position
        : new THREE.Vector3(1.15, 3.15, 0.55);

      if (dronesGroup.visible) {
        const spin = elapsed * 24;
        [drone1, drone2].forEach((d) => {
          const rotors = d.userData.rotors as THREE.Group[] | undefined;
          rotors?.forEach((rot, rIdx) => {
            rot.rotation.y = rIdx % 2 === 0 ? spin : -spin;
          });
        });

        // DRN-01: either hovers directly above active SOS beacon (when Dispatched) or patrols tactical orbit
        const d1TargetX = droneDispatchedRef.current
          ? primaryAlertPos.x + Math.cos(elapsed * 1.1) * 0.65
          : Math.cos(elapsed * 0.52) * 4.4;
        const d1TargetY = droneDispatchedRef.current
          ? Math.max(roofGroup.position.y + 1.85, primaryAlertPos.y + 3.0) + Math.sin(elapsed * 2.2) * 0.14
          : roofGroup.position.y + 2.1 + Math.sin(elapsed * 1.3) * 0.35;
        const d1TargetZ = droneDispatchedRef.current
          ? primaryAlertPos.z + Math.sin(elapsed * 1.1) * 0.65
          : Math.sin(elapsed * 0.52) * 3.8;

        drone1.position.x = THREE.MathUtils.damp(drone1.position.x, d1TargetX, 3.5, delta);
        drone1.position.y = THREE.MathUtils.damp(drone1.position.y, d1TargetY, 3.5, delta);
        drone1.position.z = THREE.MathUtils.damp(drone1.position.z, d1TargetZ, 3.5, delta);
        drone1.rotation.y = droneDispatchedRef.current ? -elapsed * 1.1 : -elapsed * 0.52;
        drone1.rotation.z = droneDispatchedRef.current ? 0.05 : -0.11;

        const d1Cone = drone1.userData.scanCone as THREE.Mesh | undefined;
        if (d1Cone) {
          const mat = d1Cone.material as THREE.MeshBasicMaterial;
          mat.color.setHex(droneDispatchedRef.current ? 0xef4444 : 0x38bdf8);
          mat.opacity = droneDispatchedRef.current ? 0.22 : 0.11;
        }

        // DRN-02: high-altitude outer perimeter thermal patrol
        const d2Angle = -elapsed * 0.36 + 1.4;
        drone2.position.set(
          Math.cos(d2Angle) * 8.6,
          roofGroup.position.y + 3.1 + Math.sin(elapsed * 0.9) * 0.3,
          Math.sin(d2Angle) * 8.1
        );
        drone2.rotation.y = -d2Angle + Math.PI;
        drone2.rotation.z = 0.09;
      }

      // Animate LimX Dynamics TRON2 Patrol Robots (inner courtyard loop r=5.15, hybrid stride + spinning LiDAR)
      if (robotsGroup.visible) {
        const rr = 5.15;
        const moveRobot = (rob: THREE.Group, angle: number, stridePhase: number) => {
          rob.position.set(Math.cos(angle) * rr, 0.01, Math.sin(angle) * rr);
          rob.rotation.y = -angle;
          const leftLeg = rob.userData.leftLeg as THREE.Group | undefined;
          const rightLeg = rob.userData.rightLeg as THREE.Group | undefined;
          const lidar = rob.userData.lidar as THREE.Group | undefined;
          const torso = rob.userData.torso as THREE.Group | undefined;
          const stride = Math.sin(stridePhase) * 0.26;
          if (leftLeg) leftLeg.rotation.x = stride;
          if (rightLeg) rightLeg.rotation.x = -stride;
          if (torso) torso.position.y = 0.46 + Math.abs(Math.sin(stridePhase)) * 0.025;
          if (lidar) lidar.rotation.y = elapsed * 4.2;
        };
        moveRobot(robot1, elapsed * 0.32, elapsed * 5.2);
        moveRobot(robot2, elapsed * 0.32 + Math.PI, elapsed * 5.2 + Math.PI);
      }

      // Animate Dynamic IoT Grid packets & real-time telemetry links (Drones + Robots <-> IoT <-> Roof Uplink)
      if (iotGridGroup.visible) {
        iotPackets.forEach((pkt, idx) => {
          const t = (elapsed * 0.45 + idx * 0.17) % 1;
          iotPacketCurves[idx].getPointAt(t, pkt.position);
        });

        const posAttr = dynamicLinkGeo.getAttribute('position') as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const setSeg = (segIdx: number, a: THREE.Vector3, b: THREE.Vector3) => {
          const off = segIdx * 6;
          arr[off] = a.x;
          arr[off + 1] = a.y;
          arr[off + 2] = a.z;
          arr[off + 3] = b.x;
          arr[off + 4] = b.y;
          arr[off + 5] = b.z;
        };

        const roofUplink = new THREE.Vector3(-1.1, roofGroup.position.y + 3.2, -0.4);
        // Seg 0 & 1: Drones -> Rooftop Command Uplink
        setSeg(0, drone1.position, roofUplink);
        setSeg(1, drone2.position, roofUplink);

        // Seg 2 & 3: LimX Robots -> Nearest Dynamic IoT Pole
        const findNearestPoleTop = (p: THREE.Vector3): THREE.Vector3 => {
          let best = iotPoles[0].topPos;
          let bestD = p.distanceToSquared(best);
          for (let i = 1; i < iotPoles.length; i++) {
            const d = p.distanceToSquared(iotPoles[i].topPos);
            if (d < bestD) {
              bestD = d;
              best = iotPoles[i].topPos;
            }
          }
          return best;
        };
        const r1Head = new THREE.Vector3(robot1.position.x, 0.72, robot1.position.z);
        const r2Head = new THREE.Vector3(robot2.position.x, 0.72, robot2.position.z);
        setSeg(2, r1Head, findNearestPoleTop(r1Head));
        setSeg(3, r2Head, findNearestPoleTop(r2Head));

        // Seg 4: Drone 1 optical lock line down to active SOS alert (when dispatched)
        if (droneDispatchedRef.current && dronesGroup.visible) {
          setSeg(4, drone1.position, primaryAlertPos);
        } else {
          setSeg(4, drone1.position, drone1.position);
        }
        posAttr.needsUpdate = true;
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
                  : selectedItem.status === 'PATROL' || selectedItem.status === 'DRONE'
                  ? '#38bdf8'
                  : selectedItem.status === 'IOT'
                  ? '#22d3ee'
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
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[96%] max-w-[1040px] flex flex-col items-center pointer-events-none">
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
            className="pointer-events-auto w-full rounded-xl border border-slate-700/80 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2"
            style={{ backgroundColor: 'rgba(5, 11, 22, 0.94)' }}
          >
            {/* Floor Isolation Controls */}
            <div className="flex items-center gap-1 flex-wrap">
              <Layers className="w-3.5 h-3.5 text-emerald-400 mr-0.5" />
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
              <Building2 className="w-3.5 h-3.5 text-sky-400 mr-0.5" />
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

            {/* Autonomous Fleet & Dynamic IoT Layer Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  const next = !droneDispatched;
                  setDroneDispatched(next);
                  if (next) {
                    setShowDrones(true);
                    setSelectedItem({
                      id: 'DRN-01-INTERCEPT',
                      title: 'DRN-01 Dispatched — Thermal SOS Lock',
                      zone: 'Intercepting Active Alert Beacon',
                      floorIndex: 4,
                      status: 'DRONE',
                      detail: 'Autonomous Drone-in-a-Box intercept active · 4K thermal cone locked onto distress coordinates',
                      pos: activeAlerts[0]?.pos || [1.15, 3.15, 0.55],
                    });
                  }
                }}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 transition-colors ${
                  droneDispatched
                    ? 'bg-red-600 text-white border border-red-400/60'
                    : 'bg-sky-700 hover:bg-sky-600 text-white'
                }`}
              >
                <Navigation className="w-3 h-3" />
                <span>{droneDispatched ? 'Recall Drone' : 'Dispatch Drone'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDrones((v) => !v)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                  showDrones
                    ? 'bg-sky-900/70 border border-sky-500/50 text-sky-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                Drones
              </button>

              <button
                type="button"
                onClick={() => setShowRobots((v) => !v)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showRobots
                    ? 'bg-emerald-900/70 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Bot className="w-3 h-3" />
                <span>Robots</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIotGrid((v) => !v)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showIotGrid
                    ? 'bg-cyan-900/70 border border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Cpu className="w-3 h-3" />
                <span>IoT Grid</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMeshLinks((v) => !v)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showMeshLinks
                    ? 'bg-emerald-900/70 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Mesh</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPatrols((v) => !v)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showPatrols
                    ? 'bg-sky-900/70 border border-sky-500/50 text-sky-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>SUVs</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticalCampus3DScene;
