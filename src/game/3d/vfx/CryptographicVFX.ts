import * as THREE from 'three';

export class CryptographicVFX {
  public group: THREE.Group;
  private particleGeo!: THREE.BufferGeometry;
  private particleMat!: THREE.PointsMaterial;
  private particleSystem!: THREE.Points;
  private particlePositions!: Float32Array;

  private shockwaveGeo!: THREE.RingGeometry;
  private shockwaveMat!: THREE.MeshBasicMaterial;
  private shockwave!: THREE.Mesh;

  private isProvingActive = false;
  private proofProgress = 0;
  private centerPos = new THREE.Vector3();

  private readonly PARTICLE_COUNT = 160;

  constructor() {
    this.group = new THREE.Group();
    this.initParticles();
    this.initShockwave();
  }

  private initParticles() {
    this.particlePositions = new Float32Array(this.PARTICLE_COUNT * 3);

    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.random() * 1.5;
      const y = Math.random() * 2.5;

      this.particlePositions[i * 3] = Math.cos(theta) * radius;
      this.particlePositions[i * 3 + 1] = y;
      this.particlePositions[i * 3 + 2] = Math.sin(theta) * radius;
    }

    this.particleGeo = new THREE.BufferGeometry();
    this.particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.particleMat = new THREE.PointsMaterial({
      color: 0x33ddd0,
      size: 0.15,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });

    this.particleSystem = new THREE.Points(this.particleGeo, this.particleMat);
    this.group.add(this.particleSystem);
  }

  private initShockwave() {
    this.shockwaveGeo = new THREE.RingGeometry(0.2, 0.4, 32);
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.shockwave = new THREE.Mesh(this.shockwaveGeo, this.shockwaveMat);
    this.shockwave.rotation.x = -Math.PI / 2;
    this.group.add(this.shockwave);
  }

  public triggerProofVFX(origin: THREE.Vector3) {
    this.isProvingActive = true;
    this.proofProgress = 0;
    this.centerPos.copy(origin);
    this.particleSystem.position.copy(origin);
    this.shockwave.position.copy(origin);
    this.shockwave.position.y = 0.05;
    this.shockwave.scale.set(1, 1, 1);
  }

  public update(delta: number) {
    if (!this.isProvingActive) return;

    this.proofProgress += delta * 0.9; // ~1.1s total duration

    // Swirl particles around center
    const positions = this.particleGeo.attributes.position.array as Float32Array;
    for (let i = 0; i < this.PARTICLE_COUNT; i++) {
      const idx = i * 3;
      const currentX = positions[idx];
      const currentZ = positions[idx + 2];

      const angle = 0.08;
      positions[idx] = currentX * Math.cos(angle) - currentZ * Math.sin(angle);
      positions[idx + 2] = currentX * Math.sin(angle) + currentZ * Math.cos(angle);
      positions[idx + 1] += (Math.sin(this.proofProgress * 8 + i) * 0.02);
    }
    this.particleGeo.attributes.position.needsUpdate = true;

    if (this.proofProgress < 0.7) {
      // Swirling active phase
      this.particleMat.opacity = Math.min(1.0, this.proofProgress * 2.5);
      this.shockwaveMat.opacity = 0;
    } else if (this.proofProgress < 1.0) {
      // Verification Shockwave expansion
      this.particleMat.opacity = THREE.MathUtils.lerp(this.particleMat.opacity, 0, 5 * delta);
      const waveT = (this.proofProgress - 0.7) / 0.3;
      const scale = 1.0 + waveT * 8.0;
      this.shockwave.scale.set(scale, scale, scale);
      this.shockwaveMat.opacity = (1 - waveT) * 0.9;
    } else {
      // Done
      this.isProvingActive = false;
      this.particleMat.opacity = 0;
      this.shockwaveMat.opacity = 0;
    }
  }

  public getProofProgress(): number {
    return this.proofProgress;
  }

  public getIsProvingActive(): boolean {
    return this.isProvingActive;
  }
}
