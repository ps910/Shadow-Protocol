import { useState, useCallback } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { GameLobby } from './components/GameLobby';
import { RoleReveal } from './components/RoleReveal';
import { NightPhase } from './components/NightPhase';
import { DayPhase } from './components/DayPhase';
import { VotingPhase } from './components/VotingPhase';
import { GameOver } from './components/GameOver';
import { PrivacyDashboard } from './components/PrivacyDashboard';
import {
  initializeGame,
  assignRoles,
  startNightPhase,
  submitNightAction,
  processNightActions,
  allPlayersActed,
  startDiscussionPhase,
  startVotingPhase,
  submitVote,
  allPlayersVoted,
  processVotes,
  nextRound,
  getPlayerView,
  GamePhase,
} from './game/gameEngine';
import type { GameState } from './game/gameEngine';
import { ActionType } from './game/roles';

export interface WalletState {
  connected: boolean;
  address: string | null;
  networkId: string | null;
}

export default function App() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    networkId: null,
  });

  const [gameState, setGameState] = useState<GameState>(initializeGame(6));
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);

  // ─── Game Actions ──────────────────────────────────────────────────

  const handleStartGame = useCallback(async () => {
    const withRoles = await assignRoles(gameState);
    setGameState(withRoles);
    setActivePlayerIndex(0);
  }, [gameState]);

  const handleRoleContinue = useCallback(() => {
    setGameState(prev => startNightPhase(prev));
  }, []);

  const handleSubmitAction = useCallback(async (action: ActionType, targetId: string | null) => {
    const currentPlayer = gameState.players[activePlayerIndex];
    try {
      let updated = await submitNightAction(gameState, currentPlayer.id, action, targetId);
      setGameState(updated);

      // Auto-advance other players (simulated multiplayer)
      // We'll auto-submit for NPCs after the current player acts
      for (let i = 0; i < updated.players.length; i++) {
        if (i === activePlayerIndex) continue;
        const player = updated.players[i];
        if (!player.isAlive || player.hasActed) continue;

        // AI-controlled action based on role
        let aiAction = ActionType.Skip;
        let aiTarget: string | null = null;
        const alivePlayers = updated.players.filter(p => p.isAlive && p.id !== player.id);

        if (player.role) {
          switch (player.role) {
            case 'ASSASSIN':
              aiAction = ActionType.Assassinate;
              aiTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]?.id || null;
              break;
            case 'GUARDIAN':
              aiAction = ActionType.Protect;
              aiTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]?.id || null;
              break;
            case 'INVESTIGATOR':
              aiAction = ActionType.Investigate;
              aiTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]?.id || null;
              break;
            default:
              aiAction = ActionType.Hide;
              break;
          }
        }

        try {
          updated = await submitNightAction(updated, player.id, aiAction, aiTarget);
        } catch {
          // Skip if action fails
        }
      }

      // If all have acted, process night
      if (allPlayersActed(updated)) {
        const processed = processNightActions(updated);
        setGameState(processed);
      } else {
        setGameState(updated);
      }
    } catch (err) {
      console.error('Action failed:', err);
    }
  }, [gameState, activePlayerIndex]);

  const handleStartVoting = useCallback(() => {
    setGameState(prev => startVotingPhase(prev));
  }, []);

  const handleSubmitVote = useCallback(async (targetId: string) => {
    const currentPlayer = gameState.players[activePlayerIndex];
    try {
      let updated = await submitVote(gameState, currentPlayer.id, targetId);

      // Auto-vote for other players (simulated multiplayer)
      for (let i = 0; i < updated.players.length; i++) {
        if (i === activePlayerIndex) continue;
        const player = updated.players[i];
        if (!player.isAlive || player.hasVoted) continue;

        const validTargets = updated.players.filter(p =>
          p.isAlive && p.id !== player.id
        );
        const randomTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
        if (randomTarget) {
          try {
            updated = await submitVote(updated, player.id, randomTarget.id);
          } catch {
            // Skip if vote fails
          }
        }
      }

      // If all voted, process votes
      if (allPlayersVoted(updated)) {
        const processed = processVotes(updated);
        setGameState(processed);
      } else {
        setGameState(processed => processed); // trigger re-render
        setGameState(updated);
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  }, [gameState, activePlayerIndex]);

  const handleNextRound = useCallback(() => {
    setGameState(prev => nextRound(prev));
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameState(initializeGame(6));
    setActivePlayerIndex(0);
  }, []);

  const handleDayProceedToDiscussion = useCallback(() => {
    setGameState(prev => startDiscussionPhase(prev));
  }, []);

  // ─── Current Player View ──────────────────────────────────────────

  const currentPlayer = gameState.players[activePlayerIndex];
  const playerView = currentPlayer ? getPlayerView(gameState, currentPlayer.id) : null;

  // Find the first alive player index for auto-switching
  const findFirstAliveIndex = () => {
    const idx = gameState.players.findIndex(p => p.isAlive);
    return idx >= 0 ? idx : 0;
  };

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">◉</div>
          <div className="app-logo-text">SHADOW PROTOCOL</div>
        </div>
        <nav className="nav-links">
          <a href="#roles" className="nav-link">ROLES</a>
          <a href="#why-midnight" className="nav-link">PRIVACY</a>
          <a href="#loop" className="nav-link">LOOP</a>
          <a href="#screens" className="nav-link">SCREENS</a>
          <a href="#security" className="nav-link">SECURITY</a>
          <a href="#victory" className="nav-link">WIN</a>
          <a href="#roadmap" className="nav-link">ROADMAP</a>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {gameState.phase === GamePhase.Lobby ? (
            <button className="btn btn-primary btn-sm" onClick={handleStartGame}>
              Play Match →
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={handlePlayAgain}>
              Exit to Lobby
            </button>
          )}
          <WalletConnect wallet={wallet} setWallet={setWallet} onWalletApi={() => {}} />
        </div>
      </header>

      {/* Player Selector (visible during gameplay) */}
      {gameState.phase !== GamePhase.Lobby && gameState.phase !== GamePhase.GameOver && (
        <div className="section animate-fade-in">
          <div className="player-selector">
            {gameState.players.map((player, index) => (
              <button
                key={player.id}
                className={`player-tab ${index === activePlayerIndex ? 'active' : ''} ${!player.isAlive ? 'dead' : ''}`}
                onClick={() => player.isAlive ? setActivePlayerIndex(index) : null}
                disabled={!player.isAlive}
              >
                <span>{player.avatar}</span>
                <span>{player.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase-specific Content */}
      {gameState.phase === GamePhase.Lobby && (
        <GameLobby gameState={gameState} onStartGame={handleStartGame} />
      )}

      {gameState.phase === GamePhase.RoleReveal && currentPlayer && (
        <RoleReveal
          playerName={currentPlayer.name}
          playerAvatar={currentPlayer.avatar}
          role={currentPlayer.role!}
          onContinue={handleRoleContinue}
        />
      )}

      {gameState.phase === GamePhase.Night && currentPlayer && (
        <NightPhase
          round={gameState.round}
          currentPlayer={currentPlayer}
          allPlayers={gameState.players}
          onSubmitAction={handleSubmitAction}
          hasActed={currentPlayer.hasActed}
        />
      )}

      {(gameState.phase === GamePhase.DayReport || gameState.phase === GamePhase.Discussion) && currentPlayer && playerView && (
        <DayPhase
          gameState={gameState}
          currentPlayerId={currentPlayer.id}
          investigationResults={playerView.investigationResults}
          onStartVoting={handleStartVoting}
        />
      )}

      {(gameState.phase === GamePhase.Voting || gameState.phase === GamePhase.VoteResult) && currentPlayer && (
        <VotingPhase
          gameState={gameState}
          currentPlayerId={currentPlayer.id}
          hasVoted={currentPlayer.hasVoted}
          onSubmitVote={handleSubmitVote}
          onProceed={handleNextRound}
          voteResult={
            gameState.phase === GamePhase.VoteResult
              ? gameState.voteResults[gameState.voteResults.length - 1] || null
              : null
          }
        />
      )}

      {gameState.phase === GamePhase.GameOver && (
        <GameOver gameState={gameState} onPlayAgain={handlePlayAgain} />
      )}

      {/* Privacy Dashboard (visible during gameplay) */}
      {gameState.phase !== GamePhase.Lobby && gameState.phase !== GamePhase.GameOver && (
        <section className="section animate-slide-up animate-delay-4">
          <PrivacyDashboard gameState={gameState} />
        </section>
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built on{' '}
          <a href="https://midnight.network" target="_blank" rel="noopener">
            Midnight Network
          </a>{' '}
          · Privacy-First Social Deduction ·{' '}
          If the hidden information were public, the game breaks.
        </p>
      </footer>
    </div>
  );
}
