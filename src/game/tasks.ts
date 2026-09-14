/**
 * Shadow Protocol — Tasks & Mini-Game Specifications
 *
 * Defines the station maintenance tasks, their assigned locations,
 * validation mechanics, and cryptographic completion receipts.
 */

import type { RoomId } from './stationMap';

export type TaskType = 'reactor' | 'power' | 'signal' | 'chemical';

export interface TaskDefinition {
  id: string;
  type: TaskType;
  name: string;
  roomId: RoomId;
  description: string;
  difficulty: 'short' | 'medium' | 'long';
  icon: string;
}

export interface PlayerTask extends TaskDefinition {
  isCompleted: boolean;
  completedAtRound?: number;
  taskNullifier?: string; // Verifiable proof receipt
}

export const STATION_TASKS: TaskDefinition[] = [
  {
    id: 'task-reactor-1',
    type: 'reactor',
    name: 'Calibrate Magnetic Containment',
    roomId: 'reactor',
    description: 'Synchronize 3 dynamic hex-code sequences to stabilize plasma confinement field.',
    difficulty: 'short',
    icon: '⚛️',
  },
  {
    id: 'task-power-1',
    type: 'power',
    name: 'Re-route Primary Power Nodes',
    roomId: 'engine',
    description: 'Connect Node Alpha to Node Omega through matching grid nodes without ground collision.',
    difficulty: 'medium',
    icon: '🔌',
  },
  {
    id: 'task-signal-1',
    type: 'signal',
    name: 'Tune Carrier Wave Frequency',
    roomId: 'comms',
    description: 'Adjust frequency and amplitude sliders to match the reference carrier wave.',
    difficulty: 'short',
    icon: '📡',
  },
  {
    id: 'task-chem-1',
    type: 'chemical',
    name: 'Synthesize Coolant Reagents',
    roomId: 'lab',
    description: 'Sequence 4 chemical isotopes in proper stoichiometric balance.',
    difficulty: 'medium',
    icon: '🧪',
  },
  {
    id: 'task-power-2',
    type: 'power',
    name: 'Balance Ion Engine Coils',
    roomId: 'engine',
    description: 'Distribute auxiliary power capacitors to eliminate magnetic variance.',
    difficulty: 'short',
    icon: '⚡',
  },
  {
    id: 'task-signal-2',
    type: 'signal',
    name: 'Align Subspace Dish',
    roomId: 'comms',
    description: 'Lock azimuth and elevation coordinates to the primary relay transponder.',
    difficulty: 'long',
    icon: '🛰️',
  },
];

/**
 * Generate a task list for a player.
 * Protocol crew members receive 3-4 tasks; Shadow players receive simulated task lists
 * so they can plausibly pretend to perform work without generating real proofs.
 */
export function generateTasksForPlayer(playerId: string, isShadow: boolean): PlayerTask[] {
  // Select 3 deterministic tasks based on player ID hash
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const taskIndices = [hash % 3, (hash + 1) % 3 + 3, (hash + 2) % STATION_TASKS.length];
  const uniqueIndices = Array.from(new Set(taskIndices)).slice(0, 3);

  return uniqueIndices.map(idx => ({
    ...STATION_TASKS[idx % STATION_TASKS.length],
    isCompleted: false,
  }));
}

/**
 * Compute global task completion metrics
 */
export function calculateTaskProgress(playerTasks: Record<string, PlayerTask[]>): {
  completed: number;
  total: number;
  percentage: number;
} {
  let completed = 0;
  let total = 0;

  Object.values(playerTasks).forEach(tasks => {
    tasks.forEach(t => {
      total++;
      if (t.isCompleted) completed++;
    });
  });

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

/**
 * Generate a deterministic single-use Task Nullifier
 * Nullifier_task = H(secret || taskId || round)
 * Guarantees a task can only be counted once and cannot be linked to the solver's identity.
 */
export function generateTaskNullifier(playerId: string, taskId: string, round: number): string {
  const seed = `${playerId}:${taskId}:${round}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `0xNULL-${Math.abs(hash).toString(16).padStart(12, '0').toUpperCase()}`;
}
