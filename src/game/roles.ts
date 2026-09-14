/**
 * Shadow Protocol — Role Definitions & Action Validation
 *
 * Defines the game's role system, action types, and validation logic.
 * Each role has specific abilities and win conditions.
 *
 * PRIVACY MODEL:
 * - Role assignments are PRIVATE (never on-chain)
 * - Action types are validated WITHOUT revealing the role
 * - Only action outcomes are public
 */

// ─── Role Enum ───────────────────────────────────────────────────────
export enum Role {
  Assassin = 'ASSASSIN',
  Spy = 'SPY',
  Guardian = 'GUARDIAN',
  Investigator = 'INVESTIGATOR',
  Civilian = 'CIVILIAN',
}

// ─── Action Types ────────────────────────────────────────────────────
export enum ActionType {
  Assassinate = 'ASSASSINATE',
  Protect = 'PROTECT',
  Investigate = 'INVESTIGATE',
  Sabotage = 'SABOTAGE',
  PhantomPing = 'PHANTOM_PING',
  CompleteTask = 'COMPLETE_TASK',
  Hide = 'HIDE',         // Civilian night action
  Skip = 'SKIP',         // No action
}

// ─── Role Metadata ───────────────────────────────────────────────────
export interface RoleMeta {
  role: Role;
  name: string;
  emoji: string;
  description: string;
  objective: string;
  nightAction: ActionType;
  nightActionLabel: string;
  team: 'evil' | 'good';
  color: string;
}

export const ROLE_METADATA: Record<Role, RoleMeta> = {
  [Role.Assassin]: {
    role: Role.Assassin,
    name: 'Assassin',
    emoji: '🗡️',
    description: 'A deadly Shadow operative aboard Aegis Station. Stalk and eliminate crew members without being caught.',
    objective: 'Eliminate Protocol members until Shadow achieves numerical parity or critical sabotage succeeds.',
    nightAction: ActionType.Assassinate,
    nightActionLabel: 'Choose a player to eliminate',
    team: 'evil',
    color: '#ef4444',
  },
  [Role.Spy]: {
    role: Role.Spy,
    name: 'Spy',
    emoji: '🕵️',
    description: 'A covert operative specializing in electronic disruption. Trigger sabotages and emit false task signals.',
    objective: 'Destabilize station systems, disrupt crew communication, and shield the Assassin.',
    nightAction: ActionType.PhantomPing,
    nightActionLabel: 'Deploy a phantom task ping or trigger sabotage',
    team: 'evil',
    color: '#f97316',
  },
  [Role.Guardian]: {
    role: Role.Guardian,
    name: 'Guardian',
    emoji: '🛡️',
    description: 'A station defender with protective counter-measures. Cast a cryptographic shield over a crew member each cycle.',
    objective: 'Shield vulnerable targets and identify the Shadow agents through discussion and voting.',
    nightAction: ActionType.Protect,
    nightActionLabel: 'Choose a player to protect',
    team: 'good',
    color: '#10b981',
  },
  [Role.Investigator]: {
    role: Role.Investigator,
    name: 'Investigator',
    emoji: '🔎',
    description: 'Security officer with clearance to access the Security Station scanner. Privately inspect suspect allegiances.',
    objective: 'Scan suspect players, gather verifiable evidence, and guide the crew to exile Shadow operatives.',
    nightAction: ActionType.Investigate,
    nightActionLabel: 'Choose a player to scan',
    team: 'good',
    color: '#8b5cf6',
  },
  [Role.Civilian]: {
    role: Role.Civilian,
    name: 'Civilian / Crew',
    emoji: '👨‍🔧',
    description: 'Station maintenance engineer. Complete assigned mini-game tasks, repair sabotaged systems, and uncover impostors.',
    objective: 'Survive, push Protocol Task Completion to 100%, and vote out the Shadow team.',
    nightAction: ActionType.CompleteTask,
    nightActionLabel: 'Complete assigned station tasks',
    team: 'good',
    color: '#38bdf8',
  },
};

// ─── Role Distribution ──────────────────────────────────────────────
/**
 * Role distribution for a 6-player Aegis Station match:
 * 1 Assassin, 1 Spy, 1 Guardian, 1 Investigator, 2 Civilians
 */
export const DEFAULT_ROLE_DISTRIBUTION: Role[] = [
  Role.Civilian,      // Player 0: Alice
  Role.Assassin,      // Player 1: Bob
  Role.Guardian,      // Player 2: Charlie
  Role.Investigator,  // Player 3: David
  Role.Civilian,      // Player 4: Emma
  Role.Spy,           // Player 5: Frank
];

// ─── Action Validation ──────────────────────────────────────────────
/**
 * Validate whether a given action is legal for a specific role.
 * This is the core of the privacy mechanic — the system can verify
 * "this player is authorized to perform this action" without
 * revealing WHAT role they have.
 */
export function isActionValid(role: Role, action: ActionType): boolean {
  const validActions: Record<Role, ActionType[]> = {
    [Role.Assassin]: [ActionType.Assassinate, ActionType.Sabotage, ActionType.Skip],
    [Role.Spy]: [ActionType.PhantomPing, ActionType.Sabotage, ActionType.CompleteTask, ActionType.Skip],
    [Role.Guardian]: [ActionType.Protect, ActionType.CompleteTask, ActionType.Skip],
    [Role.Investigator]: [ActionType.Investigate, ActionType.CompleteTask, ActionType.Skip],
    [Role.Civilian]: [ActionType.CompleteTask, ActionType.Hide, ActionType.Skip],
  };

  return validActions[role]?.includes(action) ?? false;
}

/**
 * Get the allowed actions for a role.
 */
export function getAllowedActions(role: Role): ActionType[] {
  const actions: Record<Role, ActionType[]> = {
    [Role.Assassin]: [ActionType.Assassinate, ActionType.Sabotage],
    [Role.Spy]: [ActionType.PhantomPing, ActionType.Sabotage],
    [Role.Guardian]: [ActionType.Protect, ActionType.CompleteTask],
    [Role.Investigator]: [ActionType.Investigate, ActionType.CompleteTask],
    [Role.Civilian]: [ActionType.CompleteTask, ActionType.Hide],
  };
  return actions[role] ?? [];
}

/**
 * Get role description for display.
 */
export function getRoleDescription(role: Role): RoleMeta {
  return ROLE_METADATA[role];
}

/**
 * Check if a role belongs to the evil team.
 */
export function isEvil(role?: Role | null): boolean {
  if (!role || !ROLE_METADATA[role]) return false;
  return ROLE_METADATA[role].team === 'evil';
}

/**
 * Check if a role belongs to the good team.
 */
export function isGood(role?: Role | null): boolean {
  if (!role || !ROLE_METADATA[role]) return false;
  return ROLE_METADATA[role].team === 'good';
}
