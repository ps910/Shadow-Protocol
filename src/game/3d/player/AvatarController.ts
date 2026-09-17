import * as THREE from 'three';

export type AnimationState = 'IDLE' | 'WALK' | 'RUN' | 'TASK' | 'ELIMINATED';

export interface MovementInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
}

export class AvatarController {
  public mesh: THREE.Group;
  public state: AnimationState = 'IDLE';

  // Articulated Skeleton Parts
  public head: THREE.Group;
  public visor: THREE.Mesh;
  public torso: THREE.Mesh;
  public jetpack: THREE.Mesh;
  public leftArm: THREE.Group;
  public rightArm: THREE.Group;
  public leftLeg: THREE.Group;
  public rightLeg: THREE.Group;
  public roleAura: THREE.Mesh;

  // Movement physics & velocity
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public rotationY = 0;
  private targetRotationY = 0;

  // Speeds
  private readonly WALK_SPEED = 6.5;
  private readonly RUN_SPEED = 10.5;
  private readonly ACCELERATION = 20.0;
  private readonly DECELERATION = 14.0;

  // Animation phase timer
  private animTimer = 0;

  constructor(roleColor = 0x33ddd0) {
    this.mesh = new THREE.Group();

    // 1. Torso & Cyber Armor
    const torsoGeo = new THREE.BoxGeometry(0.8, 1.0, 0.5);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x181c2e,
      roughness: 0.5,
      metalness: 0.6,
    });
    this.torso = new THREE.Mesh(torsoGeo, torsoMat);
    this.torso.position.y = 1.3;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Jetpack on back
    const jetGeo = new THREE.BoxGeometry(0.5, 0.7, 0.3);
    const jetMat = new THREE.MeshStandardMaterial({ color: 0x0f1320, metalness: 0.8 });
    this.jetpack = new THREE.Mesh(jetGeo, jetMat);
    this.jetpack.position.set(0, 0.1, -0.35);
    this.torso.add(this.jetpack);

    // 2. Head & Visor
    this.head = new THREE.Group();
    this.head.position.set(0, 0.75, 0);
    this.torso.add(this.head);

    const helmetGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const helmetMat = new THREE.MeshStandardMaterial({ color: 0x22283e, metalness: 0.7, roughness: 0.3 });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    this.head.add(helmet);

    // Glowing Visor
    const visorGeo = new THREE.BoxGeometry(0.48, 0.18, 0.22);
    const visorMat = new THREE.MeshStandardMaterial({
      color: roleColor,
      emissive: roleColor,
      emissiveIntensity: 1.5,
      roughness: 0.1,
    });
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 0.05, 0.25);
    this.head.add(this.visor);

    // 3. Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.55, 0.35, 0);
    this.torso.add(this.leftArm);

    const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.8, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0x1a2136, metalness: 0.5 });
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.y = -0.35;
    this.leftArm.add(leftArmMesh);

    // 4. Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.55, 0.35, 0);
    this.torso.add(this.rightArm);

    const rightArmMesh = new THREE.Mesh(armGeo, armMat);
    rightArmMesh.position.y = -0.35;
    this.rightArm.add(rightArmMesh);

    // 5. Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.25, -0.5, 0);
    this.torso.add(this.leftLeg);

    const legGeo = new THREE.CylinderGeometry(0.14, 0.12, 0.8, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x121728, metalness: 0.4 });
    const leftLegMesh = new THREE.Mesh(legGeo, legMat);
    leftLegMesh.position.y = -0.4;
    this.leftLeg.add(leftLegMesh);

    // 6. Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.25, -0.5, 0);
    this.torso.add(this.rightLeg);

    const rightLegMesh = new THREE.Mesh(legGeo, legMat);
    rightLegMesh.position.y = -0.4;
    this.rightLeg.add(rightLegMesh);

    // 7. Role Aura Ring
    const auraGeo = new THREE.RingGeometry(0.8, 0.95, 32);
    const auraMat = new THREE.MeshBasicMaterial({
      color: roleColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    this.roleAura = new THREE.Mesh(auraGeo, auraMat);
    this.roleAura.rotation.x = -Math.PI / 2;
    this.roleAura.position.y = 0.05;
    this.mesh.add(this.roleAura);
  }

  public setRoleColor(colorHex: number) {
    (this.visor.material as THREE.MeshStandardMaterial).color.setHex(colorHex);
    (this.visor.material as THREE.MeshStandardMaterial).emissive.setHex(colorHex);
    (this.roleAura.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
  }

  public update(delta: number, input: MovementInput, cameraYaw: number) {
    this.animTimer += delta;

    // Calculate move vector from input relative to camera yaw
    const moveZ = (input.forward ? -1 : 0) + (input.backward ? 1 : 0);
    const moveX = (input.left ? -1 : 0) + (input.right ? 1 : 0);

    const isMoving = moveX !== 0 || moveZ !== 0;

    if (this.state !== 'TASK' && this.state !== 'ELIMINATED') {
      if (!isMoving) {
        this.state = 'IDLE';
      } else {
        this.state = input.sprint ? 'RUN' : 'WALK';
      }
    }

    const currentSpeed = this.state === 'RUN' ? this.RUN_SPEED : this.WALK_SPEED;

    if (isMoving && this.state !== 'TASK' && this.state !== 'ELIMINATED') {
      // Direction in camera space
      const angle = Math.atan2(moveX, moveZ);
      this.targetRotationY = cameraYaw + angle;

      // Smooth rotation interpolation
      const diff = Math.atan2(Math.sin(this.targetRotationY - this.rotationY), Math.cos(this.targetRotationY - this.rotationY));
      this.rotationY += diff * 12 * delta;
      this.mesh.rotation.y = this.rotationY;

      // Velocity in world coordinates
      const worldDirX = Math.sin(this.targetRotationY);
      const worldDirZ = Math.cos(this.targetRotationY);

      this.velocity.x += (worldDirX * currentSpeed - this.velocity.x) * this.ACCELERATION * delta;
      this.velocity.z += (worldDirZ * currentSpeed - this.velocity.z) * this.ACCELERATION * delta;
    } else {
      // Decelerate to stop
      this.velocity.x += (0 - this.velocity.x) * this.DECELERATION * delta;
      this.velocity.z += (0 - this.velocity.z) * this.DECELERATION * delta;
    }

    // Apply movement with facility boundaries
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Clamp inside Blacksite walls (-34 to 34 X, -34 to 34 Z)
    this.position.x = Math.max(-34, Math.min(34, this.position.x));
    this.position.z = Math.max(-34, Math.min(34, this.position.z));

    this.mesh.position.copy(this.position);

    // Run Animation State Machine
    this.animateStateMachine(delta);
  }

  private animateStateMachine(delta: number) {
    const t = this.animTimer;

    switch (this.state) {
      case 'IDLE': {
        // Breathing motion (torso rises and falls subtly)
        this.torso.position.y = 1.3 + 0.04 * Math.sin(t * 2.5);
        this.head.rotation.y = 0.05 * Math.sin(t * 1.2);
        this.head.rotation.x = 0.03 * Math.sin(t * 2.0);

        // Arms relax slightly at side
        this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0.05 * Math.sin(t * 2), 10 * delta);
        this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, -0.05 * Math.sin(t * 2), 10 * delta);
        this.leftArm.rotation.z = THREE.MathUtils.lerp(this.leftArm.rotation.z, -0.1, 10 * delta);
        this.rightArm.rotation.z = THREE.MathUtils.lerp(this.rightArm.rotation.z, 0.1, 10 * delta);

        // Legs neutral
        this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 10 * delta);
        this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 10 * delta);
        this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, 0, 8 * delta);
        break;
      }

      case 'WALK': {
        const walkFreq = 9.0;
        const swing = Math.sin(t * walkFreq);

        // Torso subtle vertical step bobbing
        this.torso.position.y = 1.3 + 0.06 * Math.abs(Math.sin(t * walkFreq));
        this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, 0.1, 6 * delta);

        // Arms swing counter to legs
        this.leftArm.rotation.x = swing * 0.6;
        this.rightArm.rotation.x = -swing * 0.6;

        // Legs alternate steps
        this.leftLeg.rotation.x = -swing * 0.7;
        this.rightLeg.rotation.x = swing * 0.7;
        break;
      }

      case 'RUN': {
        const runFreq = 14.0;
        const swing = Math.sin(t * runFreq);

        // Torso forward sprint lean
        this.torso.rotation.x = THREE.MathUtils.lerp(this.torso.rotation.x, 0.28, 10 * delta);
        this.torso.position.y = 1.25 + 0.1 * Math.abs(Math.sin(t * runFreq));

        // High intensity arm and leg strides
        this.leftArm.rotation.x = swing * 1.1;
        this.rightArm.rotation.x = -swing * 1.1;
        this.leftLeg.rotation.x = -swing * 1.2;
        this.rightLeg.rotation.x = swing * 1.2;
        break;
      }

      case 'TASK': {
        // Character reaches forward to terminal
        this.torso.position.y = 1.3;
        this.torso.rotation.x = 0.15;
        this.leftArm.rotation.x = -Math.PI / 3;
        this.rightArm.rotation.x = -Math.PI / 3;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      }

      case 'ELIMINATED': {
        // Disintegration scale
        this.mesh.scale.multiplyScalar(0.95);
        this.mesh.position.y += 0.05;
        this.torso.rotation.y += 0.2;
        break;
      }
    }

    // Role Aura subtle breathing rotation
    this.roleAura.rotation.z += 0.03;
    const auraPulse = 0.95 + 0.08 * Math.sin(t * 3);
    this.roleAura.scale.set(auraPulse, auraPulse, auraPulse);
  }
}
