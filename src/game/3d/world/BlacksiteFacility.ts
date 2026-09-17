import * as THREE from 'three';

export interface RoomZone {
  id: string;
  name: string;
  color: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  taskName?: string;
  taskTerminalPos?: [number, number, number];
}

export const BLACKSITE_ROOMS: RoomZone[] = [
  {
    id: 'command',
    name: 'Command Deck',
    color: 0x33ddd0,
    bounds: { minX: -10, maxX: 10, minZ: -32, maxZ: -18 },
    taskName: 'Emergency Broadcast Alignment',
    taskTerminalPos: [0, 0, -28],
  },
  {
    id: 'central_hub',
    name: 'Central Hub',
    color: 0x8b5cf6,
    bounds: { minX: -14, maxX: 14, minZ: -18, maxZ: 8 },
  },
  {
    id: 'cyber_lab',
    name: 'Cyber Lab',
    color: 0xf55dc0,
    bounds: { minX: -34, maxX: -14, minZ: -14, maxZ: 4 },
    taskName: 'Forensic Memory Decrypt',
    taskTerminalPos: [-24, 0, -5],
  },
  {
    id: 'security',
    name: 'Security Vault',
    color: 0xef4444,
    bounds: { minX: 14, maxX: 34, minZ: -14, maxZ: 4 },
    taskName: 'Laser Grid Calibration',
    taskTerminalPos: [24, 0, -5],
  },
  {
    id: 'power_core',
    name: 'Power Core',
    color: 0x06b6d4,
    bounds: { minX: -12, maxX: 12, minZ: 8, maxZ: 28 },
    taskName: 'Plasma Diverter Routing',
    taskTerminalPos: [0, 0, 20],
  },
  {
    id: 'archive',
    name: 'Classified Archive',
    color: 0xf59e0b,
    bounds: { minX: -32, maxX: -14, minZ: 4, maxZ: 24 },
    taskName: 'Cryptographic Cipher Wheel',
    taskTerminalPos: [-22, 0, 14],
  },
  {
    id: 'comms',
    name: 'Comms Array',
    color: 0x10b981,
    bounds: { minX: 14, maxX: 32, minZ: 4, maxZ: 24 },
    taskName: 'Sub-space Frequency Lock',
    taskTerminalPos: [22, 0, 14],
  },
];

export class BlacksiteFacility {
  public group: THREE.Group;
  public plasmaSphere!: THREE.Mesh;
  public alarmLights: THREE.PointLight[] = [];
  public holoDisplays: THREE.Mesh[] = [];
  private floorGrid!: THREE.GridHelper;

  constructor() {
    this.group = new THREE.Group();
    this.buildFacility();
  }

  private buildFacility() {
    // 1. Concrete & Dark Metal Floor
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x080c18,
      roughness: 0.8,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Floor Neon Grid Accent
    this.floorGrid = new THREE.GridHelper(80, 40, 0x33ddd0, 0x18243c);
    this.floorGrid.position.y = 0.02;
    this.group.add(this.floorGrid);

    // 2. Build Perimeter & Interior Walls
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x111628,
      roughness: 0.7,
      metalness: 0.5,
    });
    const wallTrimMat = new THREE.MeshBasicMaterial({ color: 0x33ddd0 });

    const createWall = (width: number, height: number, depth: number, x: number, y: number, z: number, hasNeon = true) => {
      const wallGeo = new THREE.BoxGeometry(width, height, depth);
      const wallMesh = new THREE.Mesh(wallGeo, wallMat);
      wallMesh.position.set(x, y, z);
      wallMesh.castShadow = true;
      wallMesh.receiveShadow = true;
      this.group.add(wallMesh);

      if (hasNeon) {
        const trimGeo = new THREE.BoxGeometry(width, 0.08, depth);
        const trimMesh = new THREE.Mesh(trimGeo, wallTrimMat);
        trimMesh.position.set(x, 0.1, z);
        this.group.add(trimMesh);
      }
    };

    const WALL_H = 4;
    // Outer boundaries
    createWall(76, WALL_H, 1, 0, WALL_H / 2, -36); // North
    createWall(76, WALL_H, 1, 0, WALL_H / 2, 36);  // South
    createWall(1, WALL_H, 72, -38, WALL_H / 2, 0); // West
    createWall(1, WALL_H, 72, 38, WALL_H / 2, 0);  // East

    // Internal dividers with doorways
    // North partition between Command and Hub
    createWall(14, WALL_H, 0.8, -20, WALL_H / 2, -18);
    createWall(14, WALL_H, 0.8, 20, WALL_H / 2, -18);

    // West partition (Cyber Lab)
    createWall(0.8, WALL_H, 16, -14, WALL_H / 2, -10);
    // East partition (Security)
    createWall(0.8, WALL_H, 16, 14, WALL_H / 2, -10);

    // South partition (Power Core & Archive/Comms)
    createWall(10, WALL_H, 0.8, -22, WALL_H / 2, 8);
    createWall(10, WALL_H, 0.8, 22, WALL_H / 2, 8);
    createWall(0.8, WALL_H, 20, -14, WALL_H / 2, 18);
    createWall(0.8, WALL_H, 20, 14, WALL_H / 2, 18);

    // 3. Central Power Core Plasma Sphere (Antimatter reactor)
    const plasmaGeo = new THREE.SphereGeometry(2.2, 32, 32);
    const plasmaMat = new THREE.MeshStandardMaterial({
      color: 0x33ddd0,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.2,
      wireframe: true,
    });
    this.plasmaSphere = new THREE.Mesh(plasmaGeo, plasmaMat);
    this.plasmaSphere.position.set(0, 2.5, 18);
    this.group.add(this.plasmaSphere);

    // Plasma core ring containment
    const ringGeo = new THREE.TorusGeometry(3.2, 0.15, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x5b21b6, emissiveIntensity: 0.8 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.position.copy(this.plasmaSphere.position);
    ring1.rotation.x = Math.PI / 4;
    this.group.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.position.copy(this.plasmaSphere.position);
    ring2.rotation.y = Math.PI / 4;
    this.group.add(ring2);

    // 4. Room Floor Labels & Neon Conduits
    BLACKSITE_ROOMS.forEach((room) => {
      const cx = (room.bounds.minX + room.bounds.maxX) / 2;
      const cz = (room.bounds.minZ + room.bounds.maxZ) / 2;

      // Illuminated floor node
      const nodeGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.05, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: room.color, transparent: true, opacity: 0.6 });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(cx, 0.04, cz);
      this.group.add(node);

      // Holographic screen pillar
      const holoGeo = new THREE.PlaneGeometry(2, 1.2);
      const holoMat = new THREE.MeshBasicMaterial({
        color: room.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const holo = new THREE.Mesh(holoGeo, holoMat);
      holo.position.set(cx, 2.2, cz);
      this.holoDisplays.push(holo);
      this.group.add(holo);
    });

    // 5. Environmental Lighting
    // Ambient dark navy glow
    const ambientLight = new THREE.AmbientLight(0x182038, 1.2);
    this.group.add(ambientLight);

    // Central Hub overhead spotlight
    const centerLight = new THREE.PointLight(0x8b5cf6, 3, 30);
    centerLight.position.set(0, 7, -5);
    this.group.add(centerLight);

    // Power Core cyan glow
    const coreLight = new THREE.PointLight(0x33ddd0, 4, 25);
    coreLight.position.set(0, 3, 18);
    this.group.add(coreLight);

    // Emergency Alarm Beacons (Red lights for sabotage/meetings)
    const alarmPositions: [number, number, number][] = [
      [-20, 3.5, -20],
      [20, 3.5, -20],
      [-20, 3.5, 18],
      [20, 3.5, 18],
    ];

    alarmPositions.forEach((pos) => {
      const alarmLight = new THREE.PointLight(0xef4444, 0, 20);
      alarmLight.position.set(...pos);
      this.alarmLights.push(alarmLight);
      this.group.add(alarmLight);

      // Housing mesh
      const sirenGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8);
      const sirenMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
      const siren = new THREE.Mesh(sirenGeo, sirenMat);
      siren.position.set(...pos);
      this.group.add(siren);
    });
  }

  public update(time: number, isAlarm = false) {
    // 1. Rotate plasma antimatter reactor
    if (this.plasmaSphere) {
      this.plasmaSphere.rotation.y += 0.02;
      this.plasmaSphere.rotation.x += 0.01;
      const pulse = 1.0 + 0.08 * Math.sin(time * 3);
      this.plasmaSphere.scale.set(pulse, pulse, pulse);
    }

    // 2. Animate holographic screens
    this.holoDisplays.forEach((h, i) => {
      h.rotation.y = time * 0.5 + i;
      h.position.y = 2.2 + 0.1 * Math.sin(time * 2 + i);
    });

    // 3. Alarm lighting pulsing
    this.alarmLights.forEach((light) => {
      if (isAlarm) {
        light.intensity = 2.5 + 2.0 * Math.sin(time * 6);
      } else {
        light.intensity = 0;
      }
    });
  }

  public getRoomAt(x: number, z: number): RoomZone {
    for (const r of BLACKSITE_ROOMS) {
      if (x >= r.bounds.minX && x <= r.bounds.maxX && z >= r.bounds.minZ && z <= r.bounds.maxZ) {
        return r;
      }
    }
    return BLACKSITE_ROOMS[1]; // Central Hub default
  }
}
