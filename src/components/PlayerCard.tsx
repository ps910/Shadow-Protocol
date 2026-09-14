import { ROLE_METADATA } from '../game/roles';
import type { Player } from '../game/gameEngine';
import type { Role } from '../game/roles';

interface PlayerCardProps {
  player: Player;
  showRole?: boolean;
  isSelected?: boolean;
  isCurrentPlayer?: boolean;
  onClick?: () => void;
  selectable?: boolean;
}

export function PlayerCard({
  player,
  showRole = false,
  isSelected = false,
  isCurrentPlayer = false,
  onClick,
  selectable = false,
}: PlayerCardProps) {
  const roleMeta = player.role ? ROLE_METADATA[player.role] : null;

  const classNames = [
    'player-card',
    !player.isAlive && 'dead',
    isSelected && 'selected',
    isCurrentPlayer && 'current-player',
    selectable && player.isAlive && 'selectable',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      onClick={selectable && player.isAlive ? onClick : undefined}
      role={selectable ? 'button' : undefined}
      tabIndex={selectable ? 0 : undefined}
      id={`player-card-${player.id}`}
    >
      <div className="player-avatar">{player.avatar}</div>
      <div className="player-name">{player.name}</div>
      <div className="player-status">
        {!player.isAlive ? '☠️ Eliminated' : isCurrentPlayer ? '⭐ You' : '🟢 Alive'}
      </div>
      {showRole && roleMeta && (
        <div
          className="player-role-badge"
          style={{
            background: `${roleMeta.color}22`,
            color: roleMeta.color,
            border: `1px solid ${roleMeta.color}44`,
          }}
        >
          {roleMeta.emoji} {roleMeta.name}
        </div>
      )}
    </div>
  );
}
