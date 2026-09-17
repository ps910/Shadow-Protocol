import * as THREE from 'three';

export interface TerminalData {
  id: string;
  name: string;
  roomId: string;
  position: [number, number, number];
  color: number;
  type: 'CIPHER' | 'POWER' | 'NETWORK' | 'ARCHIVE';
}

export const TERMINAL_CONFIGS: TerminalData[] = [
  { id: 'term_archive', name: 'Cipher Wheel Terminal', roomId: 'archive', position: [-22, 0, 14], color: 0xf59e0b, type: 'CIPHER' },
  { id: 'term_power', name: 'Plasma Diverter Console', roomId: 'power_core', position: [0, 0, 20], color: 0x06b6d4, type: 'POWER' },
  { id: 'term_cyber', name: 'Forensic Neural Node', roomId: 'cyber_lab', position: [-24, 0, -5], color: 0xf55dc0, type: 'ARCHIVE' },
  { id: 'term_comms', name: 'Sub-space Carrier Array', roomId: 'comms', position: [22, 0, 14], color: 0x10b981, type: 'NETWORK' },
  { id: 'term_command', name: 'Command Beacon Console', roomId: 'command', position: [0, 0, -28], color: 0x33ddd0, type: 'POWER' },
];

export class InteractiveTerminals {
  public group: THREE.Group;
  public terminals: {
    data: TerminalData;
    mesh: THREE.Group;
    rings: THREE.Mesh[];
    screen: THREE.Mesh;
    halo: THREE.Mesh;
  }[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.buildTerminals();
  }

  private buildTerminals() {
    TERMINAL_CONFIGS.forEach((data) => {
      const termGroup = new THREE.Group();
      termGroup.position.set(...data.position);

      // 1. Pedestal Base
      const baseGeo = new THREE.CylinderGeometry(0.7, 0.9, 1.2, 8);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x141828, metalness: 0.8, roughness: 0.3 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.6;
      base.castShadow = true;
      termGroup.add(base);

      // 2. Angled Holographic Monitor Screen
      const screenGeo = new THREE.BoxGeometry(1.0, 0.6, 0.08);
      const screenMat = new THREE.MeshStandardMaterial({
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 1.2,
        roughness: 0.2,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 1.35, 0.2);
      screen.rotation.x = -Math.PI / 6;
      termGroup.add(screen);

      // 3. Floating 3D Cipher Rings (Above console)
      const rings: THREE.Mesh[] = [];
      const ring1Geo = new THREE.TorusGeometry(0.55, 0.04, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: data.color, wireframe: true });
      const ring1 = new THREE.Mesh(ring1Geo, ringMat);
      ring1.position.y = 2.1;
      termGroup.add(ring1);
      rings.push(ring1);

      const ring2Geo = new THREE.TorusGeometry(0.35, 0.03, 16, 24);
      const ring2 = new THREE.Mesh(ring2Geo, ringMat);
      ring2.position.y = 2.1;
      ring2.rotation.x = Math.PI / 2;
      termGroup.add(ring2);
      rings.push(ring2);

      // 4. Floor Proximity Glow Ring
      const haloGeo = new THREE.RingGeometry(1.8, 2.0, 32);
      const haloMat = new THREE.MeshBasicMaterial({
        color: data.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.03;
      termGroup.add(halo);

      this.group.add(termGroup);

      this.terminals.push({
        data,
        mesh: termGroup,
        rings,
        screen,
        halo,
      });
    });
  }

  public update(time: number, playerPos: THREE.Vector3): TerminalData | null {
    let nearest: TerminalData | null = null;
    let minDist = 3.2; // 3.2 meters interaction range

    this.terminals.forEach((term) => {
      // 1. Rotate floating holographic rings
      term.rings[0].rotation.z += 0.02;
      term.rings[1].rotation.x += 0.025;
      term.rings[0].position.y = 2.1 + 0.08 * Math.sin(time * 2.5);
      term.rings[1].position.y = term.rings[0].position.y;

      // 2. Check player distance
      const termWorldPos = new THREE.Vector3(...term.data.position);
      const dist = playerPos.distanceTo(termWorldPos);

      if (dist < minDist) {
        nearest = term.data;
        // Pulse halo brightly when player is in range
        (term.halo.material as THREE.MeshBasicMaterial).opacity = 0.8 + 0.2 * Math.sin(time * 8);
        term.halo.scale.set(1.1, 1.1, 1.1);
      } else {
        (term.halo.material as THREE.MeshBasicMaterial).opacity = 0.35;
        term.halo.scale.set(1.0, 1.0, 1.0);
      }
    });

    return nearest;
  }
}
