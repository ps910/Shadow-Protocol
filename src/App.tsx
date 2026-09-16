import { useState, useCallback, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { GameLobby } from './components/GameLobby';
import { RoleReveal } from './components/RoleReveal';
import { AegisStationView } from './components/AegisStationView';
import { MiniGameModal } from './components/minigames/MiniGameModal';
import { EmergencyMeeting } from './components/EmergencyMeeting';
import { VotingPhase } from './components/VotingPhase';
import { GameOver } from './components/GameOver';
import { PrivacyDashboard } from './components/PrivacyDashboard';
import { FeedbackModal } from './components/FeedbackModal';
import { CadetOnboarding } from './components/CadetOnboarding';
import { PreprodDirectory } from './components/PreprodDirectory';
import { WalletRequiredModal } from './components/WalletRequiredModal';
import type { FeedbackSubmission } from './data/preprodUsers';
import {
  initializeGame,
  startGame,
  movePlayer,
  completePlayerTask,
  triggerSabotageAction,
  resolveSabotageAction,
  eliminatePlayerInRoom,
  reportDeadBodyAction,
  callEmergencyButtonAction,
  submitShieldedVote,
  resolveEmergencyVote,
  nextRound,
  GamePhase,
} from './game/gameEngine';
import type { GameState } from './game/gameEngine';
import type { RoomId } from './game/stationMap';
import type { PlayerTask } from './game/tasks';

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

  const [gameState, setGameState] = useState<GameState>(() => initializeGame(6));
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [activeTask, setActiveTask] = useState<PlayerTask | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCadetManual, setShowCadetManual] = useState(false);
  const [showWalletRequiredModal, setShowWalletRequiredModal] = useState(false);
  const [, setCommunityFeedback] = useState<FeedbackSubmission[]>([]);

  const handleFeedbackSubmit = useCallback((fb: FeedbackSubmission) => {
    setCommunityFeedback(prev => [fb, ...prev]);
  }, []);

  // Sabotage countdown timer
  useEffect(() => {
    if (!gameState.activeSabotage) return;
    const timer = setInterval(() => {
      setGameState(prev => {
        if (!prev.activeSabotage) return prev;
        const remaining = prev.activeSabotage.secondsRemaining - 1;
        if (remaining <= 0) {
          // Critical sabotage timeout -> Shadow Victory!
          return {
            ...prev,
            phase: GamePhase.GameOver,
            outcome: 'evil_wins',
            winner: 'evil',
            winReason: `Shadow Victory! ${prev.activeSabotage.name} was not stabilized in time. The station was destroyed!`,
            activeSabotage: null,
          };
        }
        return {
          ...prev,
          activeSabotage: {
            ...prev.activeSabotage,
            secondsRemaining: remaining,
          },
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.activeSabotage]);

  // Strict 1AM Wallet requirement: Disconnecting in-match immediately returns to lobby
  useEffect(() => {
    if (!wallet.connected && gameState.phase !== GamePhase.Lobby) {
      setGameState(initializeGame(6));
      setActivePlayerIndex(0);
      setActiveTask(null);
      setShowWalletRequiredModal(true);
    }
  }, [wallet.connected, gameState.phase]);

  // ─── Game Actions ──────────────────────────────────────────────────

  const handleStartGame = useCallback(() => {
    if (!wallet.connected) {
      setShowWalletRequiredModal(true);
      window.dispatchEvent(new CustomEvent('trigger-1am-connect'));
      return;
    }
    // startGame() assigns roles to all players before transitioning to RoleReveal
    setGameState(prev => startGame(prev));
    setActivePlayerIndex(0);
  }, [wallet.connected]);

  const handleRoleContinue = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.FreeRoam,
    }));
  }, []);

  const handleMovePlayer = useCallback((targetRoom: RoomId) => {
    const currentPlayer = gameState.players[activePlayerIndex];
    if (!currentPlayer) return;
    setGameState(prev => movePlayer(prev, currentPlayer.id, targetRoom));
  }, [gameState.players, activePlayerIndex]);

  const handleOpenTask = useCallback((task: PlayerTask) => {
    setActiveTask(task);
  }, []);

  const handleTaskComplete = useCallback(() => {
    if (!activeTask) return;
    const currentPlayer = gameState.players[activePlayerIndex];
    if (!currentPlayer) return;

    setGameState(prev => completePlayerTask(prev, currentPlayer.id, activeTask.id));
    setActiveTask(null);
  }, [activeTask, gameState.players, activePlayerIndex]);

  const handleTriggerSabotage = useCallback((type: 'reactor' | 'comms') => {
    setGameState(prev => triggerSabotageAction(prev, type));
  }, []);

  const handleResolveSabotage = useCallback(() => {
    setGameState(prev => resolveSabotageAction(prev));
  }, []);

  const handleEliminate = useCallback((targetId: string) => {
    const currentPlayer = gameState.players[activePlayerIndex];
    if (!currentPlayer) return;
    setGameState(prev => eliminatePlayerInRoom(prev, currentPlayer.id, targetId));
  }, [gameState.players, activePlayerIndex]);

  const handleReportBody = useCallback(() => {
    const currentPlayer = gameState.players[activePlayerIndex];
    if (!currentPlayer) return;
    setGameState(prev => reportDeadBodyAction(prev, currentPlayer.id));
  }, [gameState.players, activePlayerIndex]);

  const handleCallEmergency = useCallback(() => {
    const currentPlayer = gameState.players[activePlayerIndex];
    if (!currentPlayer) return;
    setGameState(prev => callEmergencyButtonAction(prev, currentPlayer.id));
  }, [gameState.players, activePlayerIndex]);

  const handleProceedToVoting = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: GamePhase.Voting,
    }));
  }, []);

  const handleSubmitVote = useCallback((targetId: string) => {
    const currentPlayer = gameState.players[activePlayerIndex];
    if (!currentPlayer) return;

    let updated = submitShieldedVote(gameState, currentPlayer.id, targetId);

    // Auto-simulate votes for other living NPC players
    const livingPlayers = updated.players.filter(p => p.isAlive && p.id !== currentPlayer.id);
    livingPlayers.forEach(p => {
      const candidates = updated.players.filter(cand => cand.isAlive && cand.id !== p.id).map(c => c.id);
      candidates.push('skip');
      const randomTarget = candidates[Math.floor(Math.random() * candidates.length)];
      updated = submitShieldedVote(updated, p.id, randomTarget);
    });

    // Resolve tallies
    const resolved = resolveEmergencyVote(updated);
    setGameState(resolved);
  }, [gameState, activePlayerIndex]);

  const handleProceedNextRound = useCallback(() => {
    setGameState(prev => nextRound(prev));
  }, []);

  const handlePlayAgain = useCallback(() => {
    setGameState(initializeGame(6));
    setActivePlayerIndex(0);
    setActiveTask(null);
  }, []);

  // ─── Current Player View ──────────────────────────────────────────

  const currentPlayer = gameState.players[activePlayerIndex] || gameState.players[0];

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo-icon">◉</div>
          <div>
            <div className="app-logo-text">SHADOW PROTOCOL</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--text-muted)', letterSpacing: '0.12em' }}>
              AEGIS STATION · ZK SOCIAL DEDUCTION
            </div>
          </div>
        </div>

        <nav className="nav-links">
          <a href="#roles" className="nav-link">ROLES</a>
          <a href="#why-midnight" className="nav-link">PRIVACY</a>
          <a href="#loop" className="nav-link">LOOP</a>
          <a href="#screens" className="nav-link">SCREENS</a>
          <a href="#security" className="nav-link">SECURITY</a>
          <a href="#victory" className="nav-link">WIN</a>
          <a href="#roadmap" className="nav-link">ROADMAP</a>
          <a href="#preprod-directory" className="nav-link" style={{ color: 'var(--protocol-cyan)' }}>PREPROD (50)</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <div className="network-beacon" title="Connected to Midnight Preprod indexer and proof server">
            <span className="network-beacon-dot" />
            <span>MIDNIGHT PREPROD</span>
          </div>

          <a
            href="https://x.com/shadow_pr0tocol"
            target="_blank"
            rel="noopener noreferrer"
            className="x-nav-btn"
            title="Official Product Channel on X"
          >
            <span>𝕏</span>
            <span>@shadow_pr0tocol</span>
          </a>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowCadetManual(true)}
            title="Open Aegis Cadet Flight Manual"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
          >
            📖 Manual
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowFeedbackModal(true)}
            title="Give Playtest Feedback"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', borderColor: 'rgba(0, 240, 255, 0.4)' }}
          >
            ✍️ Feedback
          </button>
          {gameState.phase === GamePhase.Lobby ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleStartGame}
              id="header-play-btn"
              title={!wallet.connected ? '1AM Wallet required to play' : 'Play Match'}
            >
              {wallet.connected ? 'Play Match →' : '🔒 Play Match'}
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={handlePlayAgain}>
              Exit to Lobby
            </button>
          )}
          <WalletConnect wallet={wallet} setWallet={setWallet} onWalletApi={() => {}} />
        </div>
      </header>

      {/* Player Selector (visible during live gameplay) */}
      {gameState.phase !== GamePhase.Lobby && gameState.phase !== GamePhase.GameOver && (
        <div className="section animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              SIMULATED MULTIPLAYER · SWITCH ACTIVE CREW VIEW:
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--protocol-cyan)' }}>
              ROUND {gameState.round} · SECTOR: {currentPlayer?.currentRoom.toUpperCase()}
            </span>
          </div>
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
                <span style={{ fontSize: '0.6875rem', opacity: 0.7 }}>({player.currentRoom})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase-specific Views */}
      {gameState.phase === GamePhase.Lobby && (
        <GameLobby
          gameState={gameState}
          onStartGame={handleStartGame}
          isWalletConnected={wallet.connected}
          onConnectWallet={() => {
            setShowWalletRequiredModal(true);
            window.dispatchEvent(new CustomEvent('trigger-1am-connect'));
          }}
        />
      )}

      {gameState.phase === GamePhase.RoleReveal && currentPlayer && (
        <RoleReveal
          playerName={currentPlayer.name}
          playerAvatar={currentPlayer.avatar}
          role={currentPlayer.role!}
          onContinue={handleRoleContinue}
        />
      )}

      {(gameState.phase === GamePhase.FreeRoam || gameState.phase === GamePhase.Night) && currentPlayer && (
        <AegisStationView
          gameState={gameState}
          currentPlayer={currentPlayer}
          onMovePlayer={handleMovePlayer}
          onOpenTask={handleOpenTask}
          onTriggerSabotage={handleTriggerSabotage}
          onResolveSabotage={handleResolveSabotage}
          onEliminate={handleEliminate}
          onReportBody={handleReportBody}
          onCallEmergency={handleCallEmergency}
        />
      )}

      {gameState.phase === GamePhase.EmergencyMeeting && currentPlayer && (
        <EmergencyMeeting
          gameState={gameState}
          currentPlayer={currentPlayer}
          onProceedToVoting={handleProceedToVoting}
        />
      )}

      {(gameState.phase === GamePhase.Voting || gameState.phase === GamePhase.VoteResult) && currentPlayer && (
        <VotingPhase
          gameState={gameState}
          currentPlayerId={currentPlayer.id}
          hasVoted={currentPlayer.hasVoted}
          onSubmitVote={handleSubmitVote}
          onProceed={handleProceedNextRound}
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

      {/* Mini-Game Modal Overlay */}
      {activeTask && (
        <MiniGameModal
          task={activeTask}
          onComplete={handleTaskComplete}
          onClose={() => setActiveTask(null)}
        />
      )}

      {/* Privacy Dashboard (visible during live game) */}
      {gameState.phase !== GamePhase.Lobby && gameState.phase !== GamePhase.GameOver && (
        <section className="section animate-slide-up animate-delay-4">
          <PrivacyDashboard gameState={gameState} />
        </section>
      )}

      {/* Level 5: 50 Preprod User Directory & Living Feedback Loop */}
      <PreprodDirectory
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onOpenCadetManual={() => setShowCadetManual(true)}
      />

      {/* Level 5 Modals */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        playerHandle={currentPlayer?.name || 'cadet_player'}
      />

      <CadetOnboarding
        isOpen={showCadetManual}
        onClose={() => setShowCadetManual(false)}
      />

      <WalletRequiredModal
        isOpen={showWalletRequiredModal}
        onClose={() => setShowWalletRequiredModal(false)}
        onConnect={() => window.dispatchEvent(new CustomEvent('trigger-1am-connect'))}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Built on{' '}
          <a href="https://midnight.network" target="_blank" rel="noopener">
            Midnight Network
          </a>{' '}
          · Level 5 Full Moon Verified · 50 Preprod Testers · Aegis Station Telemetry
        </p>
      </footer>
    </div>
  );
}
