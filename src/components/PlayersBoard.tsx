import { getPlayerPoints } from '../game/rules'
import type { Player, ReceivedCard } from '../game/types'

type PlayersBoardProps = {
  activePlayerIndex: number
  isRoundComplete: boolean
  players: Player[]
}

export function PlayersBoard({
  activePlayerIndex,
  isRoundComplete,
  players,
}: PlayersBoardProps) {
  return (
    <section className="players-board" aria-label="Player cards">
      {players.map((player, index) => (
        <PlayerCard
          isActive={index === activePlayerIndex && !isRoundComplete}
          key={player.id}
          player={player}
        />
      ))}
    </section>
  )
}

type PlayerCardProps = {
  isActive: boolean
  player: Player
}

function PlayerCard({ isActive, player }: PlayerCardProps) {
  const points = getPlayerPoints(player)

  return (
    <article
      className={[
        'player-card',
        isActive ? 'active' : '',
        player.isOut ? 'out' : '',
        player.isBusted ? 'busted' : '',
        player.isFrozen ? 'frozen' : '',
        player.isFlipSeven ? 'flip-seven' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="player-card-header">
        <div>
          <span>Player {player.id}</span>
          <h2>{player.name}</h2>
        </div>
        <div className="player-status">
          <PlayerStatus player={player} />
          <strong aria-label={`${points} points`}>{points} pts</strong>
        </div>
      </div>

      {player.cards.length > 0 ? (
        <ul className="card-list">
          {player.cards.map((card, cardIndex) => (
            <VisibleCard card={card} key={cardIndex} />
          ))}
        </ul>
      ) : (
        <p className="empty-state">No cards yet</p>
      )}
    </article>
  )
}

function PlayerStatus({ player }: { player: Player }) {
  if (player.isFlipSeven) {
    return <span className="flip-seven-badge">Flip 7</span>
  }

  return (
    <>
      {player.isOut && <span className="out-badge">Out</span>}
      {player.isBusted && <span className="busted-badge">Bust</span>}
      {player.isFrozen && <span className="frozen-badge">Frozen</span>}
    </>
  )
}

function VisibleCard({ card }: { card: ReceivedCard }) {
  return (
    <li
      className={['game-card', card.category, card.isUsed ? 'used' : '']
        .filter(Boolean)
        .join(' ')}
    >
      {card.label}
      {card.isUsed && <span>Used</span>}
    </li>
  )
}
