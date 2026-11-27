import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ChevronDown, ChevronUp, Globe, Orbit, Radio, Satellite } from 'lucide-react';
import { useAppStore } from '../../utils/store';
import {
  createBrushedMetalRoughnessMap,
  createGlobeLandTexture,
  createPacedLoop,
  createStudioRenderer,
  disposeSceneHierarchy,
  isWebGLAvailable,
  setupStudioLights,
} from './threeEngine';

interface CommandGlobe3DSceneProps {
  heightClass?: string;
}

interface GlobeNodeInfo {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  status: 'HQ' | 'ACTIVE' | 'ALERT';
  detail: string;
}

type GlobeRegionPreset = 'sa' | 'africa' | 'global' | 'alerts';

function latLngToVector3(lat: number, lng: number, radius: number, out = new THREE.Vector3()): THREE.Vector3 {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  out.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  return out;
}

function createLeoSatellite(brushedMap: THREE.Texture): THREE.Group {
  const sat = new THREE.Group();
  const busMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.9,
    roughness: 0.22,
    roughnessMap: brushedMap,
  });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.72, roughness: 0.25 });
  const dishMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });

  // Central octagonal satellite bus
  const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8), busMat);
  sat.add(bus);

  // Dual solar wing arrays + struts
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.62, 6).rotateZ(Math.PI / 2), dishMat);
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.12), panelMat);
  wingL.position.x = -0.22;
  const wingR = wingL.clone();
  wingR.position.x = 0.22;
  sat.add(strut, wingL, wingR);

  // Parabolic downlink dish
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.05, 14, 1, true), dishMat);
  dish.position.y = -0.11;
  sat.add(dish);

  // Active telemetry beacon tip
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x38bdf8), emissiveIntensity: 2.0 })
  );
  beacon.position.y = 0.11;
  sat.add(beacon);

  return sat;
}

export const CommandGlobe3DScene: React.FC<CommandGlobe3DSceneProps> = ({ heightClass = 'h-[520px]' }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const organizations = useAppStore((s) => s.organizations);
  const panicEvents = useAppStore((s) => s.panicEvents);

  const [autoRotate, setAutoRotate] = useState(true);
  const [showArcs, setShowArcs] = useState(true);
  const [showSatellites, setShowSatellites] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [activePreset, setActivePreset] = useState<GlobeRegionPreset>('sa');
  const [webglSupported] = useState(() => isWebGLAvailable());

  const nodes = useMemo<GlobeNodeInfo[]>(() => {
    const baseNodes: GlobeNodeInfo[] = [
      {
        id: 'SL-HQ-JHB',
        name: 'SafetyLink Core HQ — Gauteng',
        region: 'Johannesburg, South Africa',
        lat: -26.2041,
        lng: 28.0473,
        status: 'HQ',
        detail: 'Primary Global Command Core · Cloudflare Worker + ZeroLink SMS Gateway',
      },
      {
        id: 'SL-NODE-CPT',
        name: 'Western Cape Tactical Hub',
        region: 'Cape Town, South Africa',
        lat: -33.9249,
        lng: 18.4241,
        status: 'ACTIVE',
        detail: 'Estate & Campus Dispatch Relay · 99.98% Uptime · BLE + LTE',
      },
      {
        id: 'SL-NODE-DBN',
        name: 'KZN Coastal Patrol Node',
        region: 'Durban, South Africa',
        lat: -29.8587,
        lng: 31.0218,
        status: 'ACTIVE',
        detail: 'Armed Response Mesh Cluster · 14 Active Patrol Units',
      },
      {
        id: 'SL-NODE-PTA',
        name: 'Tshwane Campus & Gov Grid',
        region: 'Pretoria, South Africa',
        lat: -25.7479,
        lng: 28.2293,
        status: 'ACTIVE',
        detail: 'School & Municipal Alert Loop · Offline USSD Bridge Online',
      },
      {
        id: 'SL-NODE-NBO',
        name: 'East Africa Relay PoP',
        region: 'Nairobi, Kenya',
        lat: -1.2921,
        lng: 36.8219,
        status: 'ACTIVE',
        detail: 'Regional Edge Failover & Fleet Synchronization Node',
      },
      {
        id: 'SL-NODE-LOS',
        name: 'West Africa Enterprise PoP',
        region: 'Lagos, Nigeria',
        lat: 6.5244,
        lng: 3.3792,
        status: 'ACTIVE',
        detail: 'Corporate Lone-Worker & Industrial Muster Gateway',
      },
      {
        id: 'SL-NODE-LON',
        name: 'EU/UK Cloud Mirror Edge',
        region: 'London, United Kingdom',
        lat: 51.5072,
        lng: -0.1276,
        status: 'ACTIVE',
        detail: 'Encrypted Evidence Vault Mirror & Redundant API Ingress',
      },
    ];

    // Map live organizations from store onto the Southern African / regional corridor
    (organizations || []).slice(0, 8).forEach((org, idx) => {
      const latOffset = ((idx % 4) - 1.5) * 2.1;
      const lngOffset = (Math.floor(idx / 4) - 0.5) * 3.4;
      const hasAlert = (panicEvents || []).some(
        (p: any) => p.status !== 'RESOLVED' && (p.orgCode === org.id || p.organizationId === org.id)
      );
      baseNodes.push({
        id: org.id,
        name: org.name || org.id,
        region: `${org.orgCode || org.code || 'Security Node'} · ${org.id}`,
        lat: -26.3 + latOffset,
        lng: 27.8 + lngOffset,
        status: hasAlert ? 'ALERT' : 'ACTIVE',
        detail: `Node: ${org.approved === false ? 'PENDING APPROVAL' : 'VERIFIED ACTIVE'} · ${hasAlert ? 'Active Distress Signal!' : 'Telemetry Nominal'}`,
      });
    });

    // Add live unresolved panic coordinates directly on the globe
    (panicEvents || [])
      .filter((p: any) => p.status !== 'RESOLVED' && typeof p.lat === 'number' && typeof p.lng === 'number' && (p.lat !== 0 || p.lng !== 0))
      .slice(0, 5)
      .forEach((p: any, idx: number) => {
        baseNodes.push({
          id: p.id || `LIVE-SOS-${idx}`,
          name: p.profileName || `Active Distress #${idx + 1}`,
          region: `${Number(p.lat).toFixed(3)}, ${Number(p.lng).toFixed(3)}`,
          lat: Number(p.lat),
          lng: Number(p.lng),
          status: 'ALERT',
          detail: `Live Emergency Dispatch · ${p.status || 'ACTIVE'}`,
        });
      });

    return baseNodes;
  }, [organizations, panicEvents]);

  const [selectedNode, setSelectedNode] = useState<GlobeNodeInfo>(nodes[0]);

  const autoRotateRef = useRef(autoRotate);
  const showArcsRef = useRef(showArcs);
  const showSatellitesRef = useRef(showSatellites);
  const cameraGoalRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    showArcsRef.current = showArcs;
  }, [showArcs]);

  useEffect(() => {
    showSatellitesRef.current = showSatellites;
  }, [showSatellites]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') setDockCollapsed((c) => !c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const focusLatLng = (lat: number, lng: number, distance: number) => {
    const dir = latLngToVector3(lat, lng, 1).normalize();
    cameraGoalRef.current = {
      pos: dir.multiplyScalar(distance),
      target: new THREE.Vector3(0, 0, 0),
    };
    setAutoRotate(false);
  };

  const applyPreset = (preset: GlobeRegionPreset) => {
    setActivePreset(preset);
    if (preset === 'sa') {
      focusLatLng(-28.5, 25.5, 6.2);
      setSelectedNode(nodes[0]);
    } else if (preset === 'africa') {
      focusLatLng(-4, 22, 8.8);
    } else if (preset === 'global') {
      cameraGoalRef.current = {
        pos: new THREE.Vector3(0, 3.2, 10.6),
        target: new THREE.Vector3(0, 0, 0),
      };
      setAutoRotate(true);
    } else if (preset === 'alerts') {
      const alertNode = nodes.find((n) => n.status === 'ALERT') || nodes[0];
      setSelectedNode(alertNode);
      focusLatLng(alertNode.lat, alertNode.lng, 5.8);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglSupported) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914);
    scene.fog = new THREE.FogExp2(0x040914, 0.025);

    const width = Math.max(container.clientWidth || 720, 1);
    const height = Math.max(container.clientHeight || 480, 1);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 120);
    // Start aimed directly at Southern Africa HQ
    const initCam = latLngToVector3(-28.5, 25.5, 6.6);
    camera.position.copy(initCam);

    const { renderer, isSoftwareGl, envRenderTarget, maxAnisotropy } = createStudioRenderer(container, scene, {
      exposure: 1.15,
    });
    setupStudioLights(scene, isSoftwareGl, {
      shadowExtent: 10,
      keyPosition: [10, 8, 12],
      keyIntensity: 2.1,
      hemiIntensity: 0.95,
      useSoftbox: false,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 15;
    controls.addEventListener('start', () => {
      cameraGoalRef.current = null;
    });

    const brushedMap = createBrushedMetalRoughnessMap(maxAnisotropy);
    const globeTex = createGlobeLandTexture(maxAnisotropy);

    const GLOBE_RADIUS = 2.65;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Core Earth PBR sphere
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: globeTex,
      roughness: 0.62,
      metalness: 0.18,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 2. Subtle atmospheric Fresnel shell (outer glass halo)
    const atmoMesh = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.045, 48, 36),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    globeGroup.add(atmoMesh);

    // 3. Equatorial tactical telemetry ring
    const eqRing = new THREE.Mesh(
      new THREE.TorusGeometry(GLOBE_RADIUS * 1.18, 0.008, 8, 96).rotateX(Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.25 })
    );
    globeGroup.add(eqRing);

    // 4. InstancedMesh tactical surface grid nodes (180 points around globe)
    const dotCount = 180;
    const dotGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 6);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.55 });
    const dotInstances = new THREE.InstancedMesh(dotGeo, dotMat, dotCount);
    const _dummy = new THREE.Object3D();
    const _up = new THREE.Vector3(0, 1, 0);
    const _pos = new THREE.Vector3();
    const _norm = new THREE.Vector3();

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < dotCount; i++) {
      const y = 1 - (i / (dotCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      _norm.set(Math.cos(theta) * r, y, Math.sin(theta) * r).normalize();
      _pos.copy(_norm).multiplyScalar(GLOBE_RADIUS + 0.012);
      _dummy.position.copy(_pos);
      _dummy.quaternion.setFromUnitVectors(_up, _norm);
      _dummy.scale.setScalar(1);
      _dummy.updateMatrix();
      dotInstances.setMatrixAt(i, _dummy.matrix);
    }
    dotInstances.instanceMatrix.needsUpdate = true;
    dotInstances.computeBoundingSphere();
    globeGroup.add(dotInstances);

    // 5. Clickable Organization & Distress Node Towers
    const clickableNodes: THREE.Object3D[] = [];
    const hqPos = latLngToVector3(nodes[0].lat, nodes[0].lng, GLOBE_RADIUS);

    const arcsGroup = new THREE.Group();
    const arcTravelers: Array<{ mesh: THREE.Mesh; curve: THREE.QuadraticBezierCurve3; speed: number; offset: number }> = [];

    nodes.forEach((node, idx) => {
      const surfacePos = latLngToVector3(node.lat, node.lng, GLOBE_RADIUS);
      const normal = surfacePos.clone().normalize();
      const colorHex = node.status === 'ALERT' ? 0xef4444 : node.status === 'HQ' ? 0xf59e0b : 0x10b981;
      const towerH = node.status === 'ALERT' ? 0.42 : node.status === 'HQ' ? 0.36 : 0.22;

      const towerGroup = new THREE.Group();
      towerGroup.position.copy(surfacePos);
      towerGroup.quaternion.setFromUnitVectors(_up, normal);

      const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.08, 0.014, 8, 24).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: colorHex })
      );
      baseRing.position.y = 0.01;
      const spire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.032, towerH, 8),
        new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: new THREE.Color(colorHex),
          emissiveIntensity: 1.4,
          roughness: 0.25,
        })
      );
      spire.position.y = towerH / 2;
      const tip = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.055, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: new THREE.Color(colorHex),
          emissiveIntensity: 2.2,
        })
      );
      tip.position.y = towerH + 0.05;

      // Invisible enlarged proxy hit sphere for easy clicking
      const hitProxy = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 10, 10),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitProxy.position.y = towerH * 0.6;
      hitProxy.userData.nodeInfo = node;
      hitProxy.layers.enable(1);
      clickableNodes.push(hitProxy);

      towerGroup.add(baseRing, spire, tip, hitProxy);
      globeGroup.add(towerGroup);

      // Connect every non-HQ node to Gauteng HQ via elevated great-circle TubeGeometry arc
      if (idx > 0) {
        const mid = hqPos.clone().add(surfacePos).multiplyScalar(0.5);
        const arcLift = GLOBE_RADIUS + Math.min(hqPos.distanceTo(surfacePos) * 0.38, 1.45);
        mid.normalize().multiplyScalar(arcLift);
        const curve = new THREE.QuadraticBezierCurve3(hqPos, mid, surfacePos);
        const tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 32, 0.012, 6, false),
          new THREE.MeshBasicMaterial({
            color: node.status === 'ALERT' ? 0xef4444 : 0x38bdf8,
            transparent: true,
            opacity: node.status === 'ALERT' ? 0.78 : 0.42,
          })
        );
        arcsGroup.add(tube);

        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.042, 10, 10),
          new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(node.status === 'ALERT' ? 0xef4444 : 0x10b981),
            emissiveIntensity: 2.4,
          })
        );
        arcsGroup.add(orb);
        arcTravelers.push({ mesh: orb, curve, speed: node.status === 'ALERT' ? 0.48 : 0.24, offset: idx * 0.19 });
      }
    });
    globeGroup.add(arcsGroup);

    // 6. Three Composite LEO Relay Satellites on inclined orbits
    const satGroup = new THREE.Group();
    const satellites: Array<{ pivot: THREE.Group; sat: THREE.Group; speed: number; radius: number; phase: number }> = [];
    [
      { tiltX: 0.42, tiltZ: 0.2, speed: 0.34, radius: 3.45, phase: 0 },
      { tiltX: -0.58, tiltZ: 0.48, speed: 0.28, radius: 3.68, phase: 2.1 },
      { tiltX: 0.95, tiltZ: -0.35, speed: 0.24, radius: 3.85, phase: 4.2 },
    ].forEach((cfg) => {
      const pivot = new THREE.Group();
      pivot.rotation.set(cfg.tiltX, 0, cfg.tiltZ);
      const orbitPath = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.radius, 0.006, 6, 96).rotateX(Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.2 })
      );
      pivot.add(orbitPath);
      const sat = createLeoSatellite(brushedMap);
      pivot.add(sat);
      satGroup.add(pivot);
      satellites.push({ pivot, sat, speed: cfg.speed, radius: cfg.radius, phase: cfg.phase });
    });
    scene.add(satGroup);

    // Subtle deep-space background starfield (Points)
    const starCount = 320;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 24 + (i % 15) * 1.4;
      const theta = i * 2.39996;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / starCount);
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.14, sizeAttenuation: true })
    );
    scene.add(stars);

    // Raycaster on layer 1
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
      const hits = raycaster.intersectObjects(clickableNodes, false);
      if (hits.length > 0) {
        const info = hits[0].object.userData.nodeInfo as GlobeNodeInfo | undefined;
        if (info) {
          setSelectedNode(info);
          const worldDir = new THREE.Vector3();
          hits[0].object.getWorldPosition(worldDir).normalize();
          cameraGoalRef.current = {
            pos: worldDir.multiplyScalar(6.0),
            target: new THREE.Vector3(0, 0, 0),
          };
          setAutoRotate(false);
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

    const _arcPt = new THREE.Vector3();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const loop = createPacedLoop(renderer, isSoftwareGl);
    loop.start((delta, elapsed) => {
      if (autoRotateRef.current && !cameraGoalRef.current) {
        globeGroup.rotation.y += delta * 0.14;
      }

      arcsGroup.visible = showArcsRef.current;
      satGroup.visible = showSatellitesRef.current;

      if (arcsGroup.visible) {
        arcTravelers.forEach((tr) => {
          const t = (elapsed * tr.speed + tr.offset) % 1;
          tr.curve.getPointAt(t, _arcPt);
          tr.mesh.position.copy(_arcPt);
        });
      }

      if (satGroup.visible) {
        satellites.forEach((s) => {
          const a = elapsed * s.speed + s.phase;
          s.sat.position.set(Math.cos(a) * s.radius, 0, Math.sin(a) * s.radius);
          s.sat.rotation.y = -a;
        });
      }

      const goal = cameraGoalRef.current;
      if (goal) {
        // Reset globe Y rotation smoothly when jumping to a lat/lng preset
        globeGroup.rotation.y = THREE.MathUtils.damp(globeGroup.rotation.y, 0, 6, delta);
        const alpha = 1 - Math.exp(-5.5 * delta);
        camera.position.lerp(goal.pos, alpha);
        controls.target.lerp(goal.target, alpha);
        if (camera.position.distanceTo(goal.pos) < 0.05 && Math.abs(globeGroup.rotation.y) < 0.02) {
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
  }, [nodes, webglSupported]);

  if (!webglSupported) {
    return (
      <div className={`w-full ${heightClass} rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-6 text-center`}>
        <p className="text-xs font-mono text-slate-400">
          3D Operations Globe unavailable on this device. All Super Admin tables and feeds remain active.
        </p>
      </div>
    );
  }

  const alertCount = nodes.filter((n) => n.status === 'ALERT').length;

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-[#040914] border border-slate-800 select-none`}
      data-testid="three-command-globe-scene"
    >
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Minimal Top-Left Selected Node Telemetry Card */}
      <div
        className="absolute top-3 left-3 z-10 max-w-sm rounded-xl px-3.5 py-2.5 border border-slate-700/80 pointer-events-none"
        style={{ backgroundColor: 'rgba(4, 9, 20, 0.92)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                selectedNode.status === 'ALERT'
                  ? '#ef4444'
                  : selectedNode.status === 'HQ'
                  ? '#f59e0b'
                  : '#10b981',
            }}
          />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            GLOBAL MESH · {nodes.length} NODES · {alertCount} ALERT(S)
          </span>
        </div>
        <div className="text-xs font-bold text-white mt-1">{selectedNode.name}</div>
        <div className="text-[10px] font-mono text-sky-400">{selectedNode.region}</div>
        <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{selectedNode.detail}</div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-[820px] flex flex-col items-center pointer-events-none">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-lg rounded-b-md border border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5"
          style={{ backgroundColor: 'rgba(4, 9, 20, 0.93)' }}
        >
          {dockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{dockCollapsed ? 'Show Globe Controls (H)' : 'Hide Controls (H)'}</span>
        </button>

        {!dockCollapsed && (
          <div
            className="pointer-events-auto w-full rounded-xl border border-slate-700/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5"
            style={{ backgroundColor: 'rgba(4, 9, 20, 0.94)' }}
          >
            {/* Region Camera Presets */}
            <div className="flex items-center gap-1 flex-wrap">
              <Globe className="w-3.5 h-3.5 text-amber-400 mr-1" />
              {(
                [
                  ['sa', 'South Africa HQ'],
                  ['africa', 'Africa Mesh'],
                  ['global', 'Global View'],
                  ['alerts', 'Active Alerts'],
                ] as Array<[GlobeRegionPreset, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                    activePreset === key
                      ? key === 'alerts'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setShowArcs((v) => !v)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showArcs
                    ? 'bg-sky-900/70 border border-sky-500/50 text-sky-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Relay Arcs</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSatellites((v) => !v)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  showSatellites
                    ? 'bg-emerald-900/70 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Satellite className="w-3 h-3" />
                <span>Satellites</span>
              </button>
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase flex items-center gap-1 ${
                  autoRotate
                    ? 'bg-amber-900/70 border border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Orbit className="w-3 h-3" />
                <span>Orbit</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandGlobe3DScene;
