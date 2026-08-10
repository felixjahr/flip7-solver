import type { Player } from '../game/types'

type ScoreboardProps = {
  players: Player[]
  remainingDeckCount: number
}

export function Scoreboard({ players, remainingDeckCount }: ScoreboardProps) {
  return (
    <section className="scoreboard" aria-label="Game scores">
      <div>
        <span className="turn-label">Draw pile</span>
        <strong>{remainingDeckCount} cards</strong>
      </div>
      {players.map((player) => (
        <div className="score-row" key={player.id}>
          <span>{player.name}</span>
          <strong>{player.totalScore} pts</strong>
        </div>
      ))}
    </section>
  )
}
