/**
 * Shadow Protocol — Station Sabotage Mechanics
 *
 * Manages the crisis states triggered by the Shadow team:
 * - Reactor Meltdown (critical countdown timer)
 * - Communications Blackout (disrupts coordinates and task tracker)
 */

export type SabotageType = 'reactor' | 'comms';

export interface SabotageState {
  type: SabotageType;
  name: string;
  description: string;
  secondsRemaining: number;
  totalDuration: number;
  isCritical: boolean;
  requiredRoom: 'reactor' | 'comms';
}

export const SABOTAGE_DEFINITIONS: Record<SabotageType, {
  name: string;
  description: string;
  duration: number;
  isCritical: boolean;
  requiredRoom: 'reactor' | 'comms';
}> = {
  reactor: {
    name: 'Reactor Plasma Meltdown',
    description: 'Magnetic confinement failure imminent! Crew must reach the Reactor Core and stabilize containment before detonation.',
    duration: 45,
    isCritical: true,
    requiredRoom: 'reactor',
  },
  comms: {
    name: 'Communications Blackout',
    description: 'Relay antenna scrambled! Station telemetry and task markers are offline until recalibrated in Communications.',
    duration: 60,
    isCritical: false,
    requiredRoom: 'comms',
  },
};

/**
 * Initialize a sabotage event
 */
export function createSabotage(type: SabotageType): SabotageState {
  const def = SABOTAGE_DEFINITIONS[type];
  return {
    type,
    name: def.name,
    description: def.description,
    secondsRemaining: def.duration,
    totalDuration: def.duration,
    isCritical: def.isCritical,
    requiredRoom: def.requiredRoom,
  };
}
