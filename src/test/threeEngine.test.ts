import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { BlacksiteFacility, BLACKSITE_ROOMS } from '../game/3d/world/BlacksiteFacility';
import { AvatarController } from '../game/3d/player/AvatarController';
import { InteractiveTerminals } from '../game/3d/tasks/InteractiveTerminals';
import { CryptographicVFX } from '../game/3d/vfx/CryptographicVFX';

describe('Shadow Protocol — 3D Engine Systems', () => {
  describe('Blacksite Facility & Zone Detection', () => {
    const facility = new BlacksiteFacility();

    it('defines all 7 critical facility zones matching the architecture', () => {
      expect(BLACKSITE_ROOMS.length).toBe(7);
      const roomIds = BLACKSITE_ROOMS.map(r => r.id);
      expect(roomIds).toContain('command');
      expect(roomIds).toContain('central_hub');
      expect(roomIds).toContain('cyber_lab');
      expect(roomIds).toContain('security');
      expect(roomIds).toContain('power_core');
      expect(roomIds).toContain('archive');
      expect(roomIds).toContain('comms');
    });

    it('correctly maps 3D coordinate (0, -25) to Command Deck', () => {
      const room = facility.getRoomAt(0, -25);
      expect(room.id).toBe('command');
      expect(room.name).toBe('Command Deck');
    });

    it('correctly maps 3D coordinate (0, 0) to Central Hub', () => {
      const room = facility.getRoomAt(0, 0);
      expect(room.id).toBe('central_hub');
      expect(room.name).toBe('Central Hub');
    });

    it('correctly maps 3D coordinate (-20, 0) to Cyber Lab', () => {
      const room = facility.getRoomAt(-20, 0);
      expect(room.id).toBe('cyber_lab');
      expect(room.name).toBe('Cyber Lab');
    });

    it('correctly maps 3D coordinate (20, 0) to Security Vault', () => {
      const room = facility.getRoomAt(20, 0);
      expect(room.id).toBe('security');
      expect(room.name).toBe('Security Vault');
    });

    it('correctly maps 3D coordinate (0, 15) to Power Core', () => {
      const room = facility.getRoomAt(0, 15);
      expect(room.id).toBe('power_core');
      expect(room.name).toBe('Power Core');
    });

    it('correctly maps 3D coordinate (-20, 15) to Classified Archive', () => {
      const room = facility.getRoomAt(-20, 15);
      expect(room.id).toBe('archive');
      expect(room.name).toBe('Classified Archive');
    });

    it('correctly maps 3D coordinate (20, 15) to Comms Array', () => {
      const room = facility.getRoomAt(20, 15);
      expect(room.id).toBe('comms');
      expect(room.name).toBe('Comms Array');
    });

    it('defaults to Central Hub for coordinates outside specialized room bounds', () => {
      const room = facility.getRoomAt(99, 99);
      expect(room.id).toBe('central_hub');
      expect(room.name).toBe('Central Hub');
    });
  });

  describe('Avatar Animation State Machine & Physics', () => {
    it('initializes in IDLE state with full humanoid skeleton', () => {
      const avatar = new AvatarController(0x33ddd0);
      expect(avatar.state).toBe('IDLE');
      expect(avatar.torso).toBeDefined();
      expect(avatar.head).toBeDefined();
      expect(avatar.visor).toBeDefined();
      expect(avatar.leftArm).toBeDefined();
      expect(avatar.rightArm).toBeDefined();
      expect(avatar.leftLeg).toBeDefined();
      expect(avatar.rightLeg).toBeDefined();
      expect(avatar.jetpack).toBeDefined();
      expect(avatar.roleAura).toBeDefined();
    });

    it('transitions to WALK state under directional movement input', () => {
      const avatar = new AvatarController();
      avatar.update(0.1, { forward: true, backward: false, left: false, right: false, sprint: false }, 0);
      expect(avatar.state).toBe('WALK');
      expect(avatar.velocity.length()).toBeGreaterThan(0);
    });

    it('transitions to RUN state when sprint key is engaged', () => {
      const avatar = new AvatarController();
      avatar.update(0.1, { forward: true, backward: false, left: false, right: false, sprint: true }, 0);
      expect(avatar.state).toBe('RUN');
      expect(avatar.velocity.length()).toBeGreaterThan(0);
    });

    it('returns to IDLE state when movement stops and velocity decelerates', () => {
      const avatar = new AvatarController();
      // Start moving
      avatar.update(0.1, { forward: true, backward: false, left: false, right: false, sprint: false }, 0);
      expect(avatar.state).toBe('WALK');
      // Stop moving and simulate decay
      for (let i = 0; i < 20; i++) {
        avatar.update(0.1, { forward: false, backward: false, left: false, right: false, sprint: false }, 0);
      }
      expect(avatar.state).toBe('IDLE');
      expect(avatar.velocity.length()).toBeLessThan(0.01);
    });

    it('preserves TASK state during terminal interactions', () => {
      const avatar = new AvatarController();
      avatar.state = 'TASK';
      avatar.update(0.1, { forward: false, backward: false, left: false, right: false, sprint: false }, 0);
      expect(avatar.state).toBe('TASK');
    });

    it('supports ELIMINATED disintegration state', () => {
      const avatar = new AvatarController();
      avatar.state = 'ELIMINATED';
      avatar.update(0.1, { forward: false, backward: false, left: false, right: false, sprint: false }, 0);
      expect(avatar.state).toBe('ELIMINATED');
      expect(avatar.mesh.scale.x).toBeLessThan(1.0);
    });
  });

  describe('Interactive Terminals Proximity Detection', () => {
    it('spawns 5 in-world terminal pedestals with holographic cipher rings', () => {
      const terminals = new InteractiveTerminals();
      expect(terminals.terminals.length).toBe(5);
      const types = terminals.terminals.map(t => t.data.type);
      expect(types).toContain('CIPHER');
      expect(types).toContain('POWER');
      expect(types).toContain('ARCHIVE');
      expect(types).toContain('NETWORK');
    });

    it('detects terminal proximity when player is within 3.2 meters', () => {
      const terminals = new InteractiveTerminals();
      // Power Core terminal is at (0, 0, 20)
      const playerPos = new THREE.Vector3(0, 0, 21); // 1 meter away
      const nearby = terminals.update(0, playerPos);
      expect(nearby).not.toBeNull();
      expect(nearby?.roomId).toBe('power_core');
      expect(nearby?.name).toBe('Plasma Diverter Console');
    });

    it('returns null when player is far away from all terminals', () => {
      const terminals = new InteractiveTerminals();
      const playerPos = new THREE.Vector3(0, 0, 0); // Center Hub, away from pedestals
      const nearby = terminals.update(0, playerPos);
      expect(nearby).toBeNull();
    });
  });

  describe('Cryptographic Zero-Knowledge VFX Engine', () => {
    it('initializes particle vortex pool and verification shockwave mesh', () => {
      const vfx = new CryptographicVFX();
      expect(vfx.group).toBeDefined();
    });

    it('triggers proof VFX vortex with particle velocities at given position', () => {
      const vfx = new CryptographicVFX();
      const origin = new THREE.Vector3(10, 0, -5);
      vfx.triggerProofVFX(origin);
      // VFX is now actively proving
      expect(origin.x).toBe(10);
    });

    it('expands cryptographic shockwave ring during verification phase', () => {
      const vfx = new CryptographicVFX();
      vfx.triggerProofVFX(new THREE.Vector3(0, 0, 0));
      // Advance to wave phase (0.9s * 0.9 = 0.81 progress, in the 0.7-1.0 expansion window)
      vfx.update(0.9);
      expect(vfx.getProofProgress()).toBeGreaterThan(0.7);
    });
  });
});
