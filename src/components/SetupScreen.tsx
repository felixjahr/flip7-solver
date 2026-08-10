import type { FormEvent } from 'react'
import { MAX_PLAYERS, MIN_PLAYERS } from '../game/cards'

type SetupScreenProps = {
  canStartGame: boolean
  playerCount: number
  playerNames: string[]
  onPlayerCountChange: (count: number) => void
  onPlayerNameChange: (index: number, name: string) => void
  onStartGame: (event: FormEvent<HTMLFormElement>) => void
}

export function SetupScreen({
  canStartGame,
  playerCount,
  playerNames,
  onPlayerCountChange,
  onPlayerNameChange,
  onStartGame,
}: SetupScreenProps) {
  return (
    <main className="app-shell">
      <section className="setup-panel" aria-labelledby="setup-title">
        <div className="section-heading">
          <p className="eyebrow">Flip 7 Solver</p>
          <h1 id="setup-title">Set up the table</h1>
          <p>
            Choose 3 to 18 players, name everyone, then start tracking cards one
            turn at a time.
          </p>
        </div>

        <form className="setup-form" onSubmit={onStartGame}>
          <label className="field">
            <span>Number of players</span>
            <select
              value={playerCount}
              onChange={(event) => onPlayerCountChange(Number(event.target.value))}
            >
              {Array.from(
                { length: MAX_PLAYERS - MIN_PLAYERS + 1 },
                (_, index) => MIN_PLAYERS + index,
              ).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <div className="player-name-grid">
            {playerNames.map((name, index) => (
              <label className="field" key={index}>
                <span>Player {index + 1}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => onPlayerNameChange(index, event.target.value)}
                  placeholder={`Player ${index + 1}`}
                />
              </label>
            ))}
          </div>

          <button className="primary-button" disabled={!canStartGame}>
            Start game
          </button>
        </form>
      </section>
    </main>
  )
}
