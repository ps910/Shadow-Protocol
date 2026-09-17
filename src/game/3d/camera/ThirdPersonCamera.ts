import * as THREE from 'three';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public yaw = 0;
  public pitch = 0.35; // Slight downward angle

  // Camera settings
  private distance = 5.5;
  private targetPosition = new THREE.Vector3();
  private currentCameraPos = new THREE.Vector3();

  // Dynamic FOV
  public targetFov = 60;
  private currentFov = 60;

  constructor(fov = 60, aspect = 16 / 9) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 150);
    this.currentFov = fov;
    this.targetFov = fov;
  }

  public onMouseMove(movementX: number, movementY: number) {
    const sensitivity = 0.0025;
    this.yaw -= movementX * sensitivity;
    this.pitch -= movementY * sensitivity;

    // Clamp pitch so camera cannot flip upside down
    this.pitch = Math.max(0.1, Math.min(Math.PI / 2.5, this.pitch));
  }

  public update(delta: number, playerPos: THREE.Vector3, isSprinting = false, isTaskActive = false) {
    // Dynamic FOV based on state
    if (isTaskActive) {
      this.targetFov = 50;
      this.distance = 3.5;
    } else if (isSprinting) {
      this.targetFov = 68;
      this.distance = 6.2;
    } else {
      this.targetFov = 60;
      this.distance = 5.5;
    }

    // Smooth FOV interpolation
    this.currentFov = THREE.MathUtils.lerp(this.currentFov, this.targetFov, 6 * delta);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    // Calculate desired camera position in spherical coordinates relative to player
    const offsetX = this.distance * Math.sin(this.yaw) * Math.cos(this.pitch);
    const offsetY = this.distance * Math.sin(this.pitch) + 1.8;
    const offsetZ = this.distance * Math.cos(this.yaw) * Math.cos(this.pitch);

    this.targetPosition.set(
      playerPos.x + offsetX,
      Math.max(1.0, playerPos.y + offsetY), // Prevent below floor
      playerPos.z + offsetZ
    );

    // Smooth camera position damping
    this.currentCameraPos.lerp(this.targetPosition, 10 * delta);
    this.camera.position.copy(this.currentCameraPos);

    // Look at player chest
    const lookTarget = new THREE.Vector3(playerPos.x, playerPos.y + 1.4, playerPos.z);
    this.camera.lookAt(lookTarget);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
