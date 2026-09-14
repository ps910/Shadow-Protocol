/**
 * Aegis Station — Architectural Map & Spatial Navigation
 *
 * Defines the 7 compartments of Aegis Station, hallway connections,
 * interactive room terminals, and cryptographic presence beacons for alibis.
 */

export type RoomId =
  | 'command'
  | 'hub'
  | 'engine'
  | 'security'
  | 'reactor'
  | 'lab'
  | 'comms';

export interface RoomDefinition {
  id: RoomId;
  name: string;
  code: string;
  icon: string;
  description: string;
  color: string;
  adjacentRooms: RoomId[];
  hasEmergencyButton?: boolean;
  sabotageType?: 'reactor' | 'comms';
  terminalName: string;
  taskType: 'power' | 'reactor' | 'signal' | 'chemical' | 'none';
  gridPosition: { x: number; y: number }; // Relative coordinates for 2D schematic
}

export const AEGIS_STATION_ROOMS: Record<RoomId, RoomDefinition> = {
  command: {
    id: 'command',
    name: 'Command Center',
    code: 'SEC-01',
    icon: '🧭',
    description: 'The tactical bridge of Aegis Station. Contains the Emergency Meeting terminal and primary telemetry.',
    color: '#8b5cf6',
    adjacentRooms: ['hub'],
    hasEmergencyButton: true,
    terminalName: 'Emergency Broadcast Console',
    taskType: 'none',
    gridPosition: { x: 50, y: 12 },
  },
  hub: {
    id: 'hub',
    name: 'Central Hub',
    code: 'SEC-02',
    icon: '🏢',
    description: 'The central arterial nexus connecting all sectors of the station.',
    color: '#38bdf8',
    adjacentRooms: ['command', 'engine', 'security', 'lab'],
    terminalName: 'Station Conduit Terminal',
    taskType: 'none',
    gridPosition: { x: 50, y: 40 },
  },
  engine: {
    id: 'engine',
    name: 'Engine Room',
    code: 'SEC-03',
    icon: '⚙️',
    description: 'Houses the main sub-light ion drives and primary energy distribution grids.',
    color: '#f59e0b',
    adjacentRooms: ['hub', 'reactor'],
    terminalName: 'Power Grid Routing Relay',
    taskType: 'power',
    gridPosition: { x: 18, y: 40 },
  },
  security: {
    id: 'security',
    name: 'Security Station',
    code: 'SEC-04',
    icon: '🔒',
    description: 'Monitors internal hull pressure and biometric signatures. Features the Investigator scanner.',
    color: '#10b981',
    adjacentRooms: ['hub', 'comms'],
    terminalName: 'Biometric Scanner & Surveillance',
    taskType: 'none',
    gridPosition: { x: 82, y: 40 },
  },
  reactor: {
    id: 'reactor',
    name: 'Reactor Core',
    code: 'SEC-05',
    icon: '⚛️',
    description: 'Heavy plasma confinement chamber. Critical facility vulnerable to Shadow sabotage.',
    color: '#ef4444',
    adjacentRooms: ['engine', 'lab', 'comms'],
    sabotageType: 'reactor',
    terminalName: 'Magnetic Containment Terminal',
    taskType: 'reactor',
    gridPosition: { x: 18, y: 72 },
  },
  lab: {
    id: 'lab',
    name: 'Laboratory',
    code: 'SEC-06',
    icon: '🧪',
    description: 'Advanced materials synthesis and hazardous chemical filtration lab.',
    color: '#a855f7',
    adjacentRooms: ['hub', 'reactor'],
    terminalName: 'Spectrometry & Reagent Synthesizer',
    taskType: 'chemical',
    gridPosition: { x: 50, y: 72 },
  },
  comms: {
    id: 'comms',
    name: 'Communications Array',
    code: 'SEC-07',
    icon: '📡',
    description: 'High-frequency subspace relay linking Aegis Station to orbital relays.',
    color: '#06b6d4',
    adjacentRooms: ['security', 'reactor'],
    sabotageType: 'comms',
    terminalName: 'Carrier Wave Transceiver',
    taskType: 'signal',
    gridPosition: { x: 82, y: 72 },
  },
};

export const ALL_ROOM_IDS: RoomId[] = [
  'command',
  'hub',
  'engine',
  'security',
  'reactor',
  'lab',
  'comms',
];

/**
 * Check if a player can move directly from one room to another
 */
export function canMoveBetween(from: RoomId, to: RoomId): boolean {
  if (from === to) return true;
  return AEGIS_STATION_ROOMS[from].adjacentRooms.includes(to);
}

/**
 * Generate a deterministic Room Presence Token (Beacon)
 * Used as verifiable evidence during emergency meetings to establish an alibi
 * without leaking role or identity prior to proof submission.
 */
export function generateRoomBeacon(roomId: RoomId, timestamp: number): string {
  const seed = `${roomId}:${Math.floor(timestamp / 10000)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `BCN-${roomId.toUpperCase()}-${Math.abs(hash).toString(16).padStart(6, '0').toUpperCase()}`;
}
