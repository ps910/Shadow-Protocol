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
  Guardian = 'GUARDIAN',
  Investigator = 'INVESTIGATOR',
  Civilian = 'CIVILIAN',
}

// ─── Action Types ────────────────────────────────────────────────────
export enum ActionType {
  Assassinate = 'ASSASSINATE',
  Protect = 'PROTECT',
  Investigate = 'INVESTIGATE',
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
    description: 'A deadly agent working in the shadows. Eliminate key players without being discovered.',
    objective: 'Eliminate all Guardians or reach numerical majority.',
    nightAction: ActionType.Assassinate,
    nightActionLabel: 'Choose a player to eliminate',
    team: 'evil',
    color: '#dc2626',
  },
  [Role.Guardian]: {
    role: Role.Guardian,
    name: 'Guardian',
    emoji: '🛡️',
    description: 'A protector of the innocent. Shield players from assassination attempts.',
    objective: 'Identify and eliminate the Assassin through voting.',
    nightAction: ActionType.Protect,
    nightActionLabel: 'Choose a player to protect',
    team: 'good',
    color: '#2563eb',
  },
  [Role.Investigator]: {
    role: Role.Investigator,
    name: 'Investigator',
    emoji: '🔎',
    description: 'A keen observer who gathers intelligence. Investigate players to uncover their allegiance.',
    objective: 'Identify suspicious players and guide the town to victory.',
    nightAction: ActionType.Investigate,
    nightActionLabel: 'Choose a player to investigate',
    team: 'good',
    color: '#7c3aed',
  },
  [Role.Civilian]: {
    role: Role.Civilian,
    name: 'Civilian',
    emoji: '👤',
    description: 'An ordinary citizen. Stay alive and help identify the threat through discussion and voting.',
    objective: 'Survive and vote to eliminate the Assassin.',
    nightAction: ActionType.Hide,
    nightActionLabel: 'You hide and hope for the best',
    team: 'good',
    color: '#64748b',
  },
};

// ─── Role Distribution ──────────────────────────────────────────────
/**
 * Default role distribution for a 6-player game.
 * 1 Assassin, 1 Guardian, 1 Investigator, 3 Civilians
 */
export const DEFAULT_ROLE_DISTRIBUTION: Role[] = [
  Role.Assassin,
  Role.Guardian,
  Role.Investigator,
  Role.Civilian,
  Role.Civilian,
  Role.Civilian,
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
    [Role.Assassin]: [ActionType.Assassinate, ActionType.Skip],
    [Role.Guardian]: [ActionType.Protect, ActionType.Skip],
    [Role.Investigator]: [ActionType.Investigate, ActionType.Skip],
    [Role.Civilian]: [ActionType.Hide, ActionType.Skip],
  };

  return validActions[role]?.includes(action) ?? false;
}

/**
 * Get the allowed night actions for a role.
 */
export function getAllowedActions(role: Role): ActionType[] {
  const actions: Record<Role, ActionType[]> = {
    [Role.Assassin]: [ActionType.Assassinate],
    [Role.Guardian]: [ActionType.Protect],
    [Role.Investigator]: [ActionType.Investigate],
    [Role.Civilian]: [ActionType.Hide],
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
export function isEvil(role: Role): boolean {
  return ROLE_METADATA[role].team === 'evil';
}

/**
 * Check if a role belongs to the good team.
 */
export function isGood(role: Role): boolean {
  return ROLE_METADATA[role].team === 'good';
}
