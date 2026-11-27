import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ChevronDown, ChevronUp, Radio, Send, Wifi, WifiOff } from 'lucide-react';
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

interface BleMeshVisualizer3DSceneProps {
  heightClass?: string;
}

interface RadarNodeSpec {
  id: string;
  label: string;
  role: string;
  rssi: string;
  battery: string;
  pos: [number, number, number];
  kind: 'itag' | 'phone' | 'peer' | 'gateway' | 'tower';
}

function createPhoneRelayModel(metalMat: THREE.Material, screenColor: number): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.08, 24), metalMat);
  base.position.y = 0.04;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.54, 1.02, 0.08), metalMat);
  body.position.y = 0.58;
  body.castShadow = true;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.46, 0.88),
    new THREE.MeshStandardMaterial({
      color: screenColor,
      emissive: new THREE.Color(screenColor),
      emissiveIntensity: 0.75,
      roughness: 0.18,
    })
  );
  screen.position.set(0, 0.58, 0.045);
  const topLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 10, 10),
    new THREE.MeshStandardMaterial({ color: screenColor, emissive: new THREE.Color(screenColor), emissiveIntensity: 1.8 })
  );
  topLed.position.y = 1.15;
  g.add(base, body, screen, topLed);
  return g;
}

function createCellTowerModel(metalMat: THREE.Material): { group: THREE.Group; statusMat: THREE.MeshStandardMaterial } {
  const g = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.2, 8), metalMat);
  plinth.position.y = 0.1;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.24, 3.1, 6), metalMat);
  mast.position.y = 1.75;
  mast.castShadow = true;
  const crossArm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.14), metalMat);
  crossArm.position.y = 2.85;
  const antL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.65, 0.18), metalMat);
  antL.position.set(-0.48, 2.85, 0);
  const antR = antL.clone();
  antR.position.x = 0.48;
  const statusMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: new THREE.Color(0x10b981),
    emissiveIntensity: 2.0,
  });
  const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), statusMat);
  beacon.position.y = 3.45;
  g.add(plinth, mast, crossArm, antL, antR, beacon);
  return { group: g, statusMat };
}

function createEstateGatewayModel(metalMat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.95, 0.65), metalMat);
  pedestal.position.y = 0.475;
  pedestal.castShadow = true;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.12, 0.76),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.6 })
  );
  roof.position.y = 1.0;
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.95, 10), metalMat);
  antenna.position.set(0.24, 1.48, 0);
  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: new THREE.Color(0x38bdf8), emissiveIntensity: 2.0 })
  );
  beacon.position.set(0.24, 1.98, 0);
  const statusStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.08, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: new THREE.Color(0x10b981), emissiveIntensity: 1.8 })
  );
  statusStrip.position.set(0, 0.72, 0.34);
  g.add(pedestal, roof, antenna, beacon, statusStrip);
  return g;
}

export const BleMeshVisualizer3DScene: React.FC<BleMeshVisualizer3DSceneProps> = ({
  heightClass = 'h-[430px]',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const bleDevices = useAppStore((s) => s.bleDevices);

  const [cellularOffline, setCellularOffline] = useState(false);
  const [packetDemoActive, setPacketDemoActive] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglSupported] = useState(() => isWebGLAvailable());

  const pairedPrimary = bleDevices?.[0];

  const radarNodes = useMemo<RadarNodeSpec[]>(() => {
    const primaryName = pairedPrimary?.friendlyName || 'SafetyLink iTAG Keyfob';
    const primaryRssi = typeof pairedPrimary?.rssi === 'number' ? `${pairedPrimary.rssi} dBm` : '-48 dBm';
    const primaryBatt = typeof pairedPrimary?.batteryLevel === 'number' ? `${pairedPrimary.batteryLevel}%` : '94%';

    return [
      {
        id: 'ITAG-PRIMARY',
        label: primaryName,
        role: 'Origin BLE 5.0 Hardware Panic Trigger',
        rssi: primaryRssi,
        battery: primaryBatt,
        pos: [-1.15, 0, 0.75],
        kind: 'itag',
      },
      {
        id: 'USER-PHONE',
        label: 'Operator Smartphone (Native PanicService)',
        role: 'Primary BLE GATT Listener & ZeroLink Bridge',
        rssi: 'Direct Bus',
        battery: '88%',
        pos: [0, 0, 0],
        kind: 'phone',
      },
      {
        id: 'PEER-GUARD-1',
        label: 'Nearby Patrol Peer — Unit Alpha',
        role: 'Hop 1 Offline BLE Mesh Repeater (28m)',
        rssi: '-62 dBm',
        battery: '91%',
        pos: [2.45, 0, 1.95],
        kind: 'peer',
      },
      {
        id: 'PEER-RESIDENT-2',
        label: 'Neighbor Relay Phone — Block C',
        role: 'Hop 2 Encrypted Store-and-Forward Node (52m)',
        rssi: '-71 dBm',
        battery: '76%',
        pos: [4.2, 0, -0.85],
        kind: 'peer',
      },
      {
        id: 'ESTATE-GATEWAY',
        label: 'Estate ZeroLink Gateway & USSD Bridge',
        role: 'Hop 3 Fiber / Satellite / LoRa Command Uplink',
        rssi: '-58 dBm',
        battery: 'AC + UPS',
        pos: [1.85, 0, -4.15],
        kind: 'gateway',
      },
      {
        id: 'CELL-TOWER',
        label: 'Direct LTE Cellular Tower',
        role: 'Primary 4G/SMS Uplink (Bypassed during blackout)',
        rssi: '-84 dBm',
        battery: 'Grid',
        pos: [-4.6, 0, -3.4],
        kind: 'tower',
      },
    ];
  }, [pairedPrimary]);

  const [selectedNode, setSelectedNode] = useState<RadarNodeSpec>(radarNodes[0]);

  const cellularOfflineRef = useRef(cellularOffline);
  const packetDemoRef = useRef(packetDemoActive);

  useEffect(() => {
    cellularOfflineRef.current = cellularOffline;
  }, [cellularOffline]);

  useEffect(() => {
    packetDemoRef.current = packetDemoActive;
  }, [packetDemoActive]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') setDockCollapsed((c) => !c);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !webglSupported) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b16);
    scene.fog = new THREE.FogExp2(0x050b16, 0.032);

    const width = Math.max(container.clientWidth || 640, 1);
    const height = Math.max(container.clientHeight || 420, 1);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0.8, 7.6, 9.6);

    const { renderer, isSoftwareGl, envRenderTarget, maxAnisotropy } = createStudioRenderer(container, scene, {
      exposure: 1.15,
    });
    setupStudioLights(scene, isSoftwareGl, {
      shadowExtent: 11,
      keyPosition: [8, 14, 8],
      keyIntensity: 2.1,
      hemiIntensity: 0.9,
      useSoftbox: false,
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0.4, 0.8, -0.7);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4.5;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI * 0.47;

    const brushedMap = createBrushedMetalRoughnessMap(maxAnisotropy);
    const gridTex = createTacticalGridTexture(maxAnisotropy, '#10b981');
    const contactTex = createContactShadowTexture();

    // Radar base floor
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(22, 64).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: gridTex, roughness: 0.88, metalness: 0.12 })
    );
    floor.receiveShadow = true;
    scene.add(floor);

    // Rotating 3D radar sweep wedge (offset y=0.025 to avoid z-fighting)
    const sweepGeo = new THREE.CircleGeometry(6.2, 32, 0, Math.PI / 4);
    sweepGeo.rotateX(-Math.PI / 2);
    const sweepMesh = new THREE.Mesh(
      sweepGeo,
      new THREE.MeshBasicMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    sweepMesh.position.y = 0.025;
    scene.add(sweepMesh);

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.88,
      roughness: 0.24,
      roughnessMap: brushedMap,
    });
    const shadowMat = new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });

    const clickable: THREE.Object3D[] = [];
    const registerClickable = (obj: THREE.Object3D, spec: RadarNodeSpec) => {
      obj.traverse((c) => {
        c.userData.radarSpec = spec;
        c.layers.enable(1);
      });
      clickable.push(obj);
    };

    let towerStatusMat: THREE.MeshStandardMaterial | null = null;

    radarNodes.forEach((spec) => {
      let nodeObj: THREE.Group;

      if (spec.kind === 'itag') {
        nodeObj = new THREE.Group();
        const body = new THREE.Mesh(
          new THREE.CylinderGeometry(0.34, 0.36, 0.14, 24),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.25 })
        );
        body.position.y = 0.22;
        body.castShadow = true;
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.035, 10, 28).rotateX(Math.PI / 2), metalMat);
        rim.position.y = 0.22;
        const led = new THREE.Mesh(
          new THREE.TorusGeometry(0.18, 0.024, 10, 24).rotateX(Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: new THREE.Color(0xef4444), emissiveIntensity: 2.0 })
        );
        led.position.y = 0.3;
        const btn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.16, 0.06, 20),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
        );
        btn.position.y = 0.31;
        nodeObj.add(body, rim, led, btn);
      } else if (spec.kind === 'phone') {
        nodeObj = createPhoneRelayModel(metalMat, 0x10b981);
      } else if (spec.kind === 'peer') {
        nodeObj = createPhoneRelayModel(metalMat, 0x38bdf8);
      } else if (spec.kind === 'gateway') {
        nodeObj = createEstateGatewayModel(metalMat);
      } else {
        const built = createCellTowerModel(metalMat);
        nodeObj = built.group;
        towerStatusMat = built.statusMat;
      }

      const contact = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4).rotateX(-Math.PI / 2), shadowMat);
      contact.position.y = 0.015;
      nodeObj.add(contact);
      nodeObj.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);

      registerClickable(nodeObj, spec);
      scene.add(nodeObj);
    });

    // Build curves for Direct LTE Path vs Multi-Hop Offline ZeroLink BLE Mesh Path
    const pItag = new THREE.Vector3(...radarNodes[0].pos).add(new THREE.Vector3(0, 0.45, 0));
    const pPhone = new THREE.Vector3(...radarNodes[1].pos).add(new THREE.Vector3(0, 0.95, 0));
    const pPeer1 = new THREE.Vector3(...radarNodes[2].pos).add(new THREE.Vector3(0, 0.95, 0));
    const pPeer2 = new THREE.Vector3(...radarNodes[3].pos).add(new THREE.Vector3(0, 0.95, 0));
    const pGateway = new THREE.Vector3(...radarNodes[4].pos).add(new THREE.Vector3(0, 1.85, 0));
    const pTower = new THREE.Vector3(...radarNodes[5].pos).add(new THREE.Vector3(0, 3.25, 0));

    // iTag -> Phone BLE link (always active)
    const itagCurve = new THREE.CatmullRomCurve3([pItag, pItag.clone().lerp(pPhone, 0.5).add(new THREE.Vector3(0, 0.6, 0)), pPhone]);
    const itagTube = new THREE.Mesh(
      new THREE.TubeGeometry(itagCurve, 20, 0.025, 8, false),
      new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.7 })
    );
    scene.add(itagTube);

    // Direct LTE curve (Phone -> Tower)
    const lteCurve = new THREE.CatmullRomCurve3([
      pPhone,
      pPhone.clone().lerp(pTower, 0.5).add(new THREE.Vector3(0, 1.4, 0)),
      pTower,
    ]);
    const lteMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.72 });
    const lteTube = new THREE.Mesh(new THREE.TubeGeometry(lteCurve, 28, 0.03, 8, false), lteMat);
    scene.add(lteTube);

    // Offline ZeroLink Multi-Hop BLE Mesh Curve (Phone -> Peer1 -> Peer2 -> Estate Gateway)
    const meshCurve = new THREE.CatmullRomCurve3([
      pPhone,
      pPhone.clone().lerp(pPeer1, 0.5).add(new THREE.Vector3(0, 0.95, 0)),
      pPeer1,
      pPeer1.clone().lerp(pPeer2, 0.5).add(new THREE.Vector3(0, 0.95, 0)),
      pPeer2,
      pPeer2.clone().lerp(pGateway, 0.5).add(new THREE.Vector3(0, 1.15, 0)),
      pGateway,
    ]);
    const meshMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
    const meshTube = new THREE.Mesh(new THREE.TubeGeometry(meshCurve, 56, 0.032, 8, false), meshMat);
    scene.add(meshTube);

    // Animated packet orbs
    const packetOrbMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 2.4,
    });
    const packetOrbs = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), packetOrbMat);
      scene.add(m);
      return m;
    });

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
      const hits = raycaster.intersectObjects(clickable, true);
      if (hits.length > 0) {
        const spec = hits[0].object.userData.radarSpec as RadarNodeSpec | undefined;
        if (spec) setSelectedNode(spec);
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

    const _pt = new THREE.Vector3();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const loop = createPacedLoop(renderer, isSoftwareGl);
    loop.start((delta, elapsed) => {
      sweepMesh.rotation.y = -elapsed * 0.75;

      const offline = cellularOfflineRef.current;
      const activeDemo = packetDemoRef.current;

      if (towerStatusMat) {
        towerStatusMat.color.setHex(offline ? 0xef4444 : 0x10b981);
        towerStatusMat.emissive.setHex(offline ? 0xef4444 : 0x10b981);
      }
      lteMat.color.setHex(offline ? 0xef4444 : 0x10b981);
      lteMat.opacity = offline ? 0.2 : 0.78;
      meshMat.color.setHex(offline ? 0xf59e0b : 0x38bdf8);
      meshMat.opacity = offline ? 0.88 : 0.28;
      packetOrbMat.emissive.setHex(offline ? 0xf59e0b : 0x10b981);

      packetOrbs.forEach((orb, idx) => {
        orb.visible = activeDemo;
        if (!activeDemo) return;
        const phase = (elapsed * 0.42 + idx / packetOrbs.length) % 1;
        if (phase < 0.22) {
          itagCurve.getPointAt(phase / 0.22, _pt);
        } else {
          const routeT = (phase - 0.22) / 0.78;
          if (offline) {
            meshCurve.getPointAt(routeT, _pt);
          } else {
            lteCurve.getPointAt(routeT, _pt);
          }
        }
        orb.position.copy(_pt);
      });

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
  }, [radarNodes, webglSupported]);

  if (!webglSupported) {
    return (
      <div className={`w-full ${heightClass} rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-6 text-center`}>
        <p className="text-xs font-mono text-slate-400">
          3D BLE Proximity Radar requires WebGL. Native BLE scanning and pairing remain fully operational.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl overflow-hidden bg-[#050b16] border border-slate-800 select-none`}
      data-testid="three-ble-mesh-visualizer"
    >
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top-Left Node Inspector Badge */}
      <div
        className="absolute top-3 left-3 z-10 max-w-sm rounded-xl px-3.5 py-2.5 border border-slate-700/80 pointer-events-none"
        style={{ backgroundColor: 'rgba(5, 11, 22, 0.92)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: cellularOffline ? '#f59e0b' : '#10b981' }}
          />
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
            {cellularOffline ? 'CELLULAR BLACKOUT -> 3-HOP BLE MESH' : 'DIRECT LTE + BLE READY'}
          </span>
        </div>
        <div className="text-xs font-bold text-white mt-1">{selectedNode.label}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">{selectedNode.role}</div>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-emerald-400">
          <span>RSSI: {selectedNode.rssi}</span>
          <span>Power: {selectedNode.battery}</span>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[94%] max-w-[740px] flex flex-col items-center pointer-events-none">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-lg rounded-b-md border border-slate-700/80 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:text-white flex items-center gap-1.5"
          style={{ backgroundColor: 'rgba(5, 11, 22, 0.93)' }}
        >
          {dockCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{dockCollapsed ? 'Show BLE 3D Controls (H)' : 'Hide Controls (H)'}</span>
        </button>

        {!dockCollapsed && (
          <div
            className="pointer-events-auto w-full rounded-xl border border-slate-700/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5"
            style={{ backgroundColor: 'rgba(5, 11, 22, 0.94)' }}
          >
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
                ZeroLink Offline Handoff Lab
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setCellularOffline((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                  cellularOffline
                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                    : 'bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {cellularOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>{cellularOffline ? 'Blackout Active (Mesh Reroute)' : 'Simulate Cellular Blackout'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPacketDemoActive((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                  packetDemoActive
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{packetDemoActive ? 'Pause Packet Stream' : 'Stream Test Packet'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BleMeshVisualizer3DScene;
