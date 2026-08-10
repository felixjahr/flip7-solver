import type { FormEvent } from 'react'
import { actionCards, bonusCards, numberCards } from '../game/cards'
import { getRemainingCount } from '../game/rules'
import type { Player } from '../game/types'

type TurnPanelProps = {
  actionTargetId: string
  activePlayer?: Player
  availableActionTargets: Player[]
  canAddSelectedCard: boolean
  isResolvingFlipThree: boolean
  isRoundComplete: boolean
  needsActionTarget: boolean
  selectedCardId: string
  targetLabel: string
  usedCardCounts: Record<string, number>
  onAddCard: (event: FormEvent<HTMLFormElement>) => void
  onQuitRound: () => void
  onSelectedCardChange: (cardId: string) => void
  onTargetChange: (targetId: string) => void
}

export function TurnPanel({
  actionTargetId,
  activePlayer,
  availableActionTargets,
  canAddSelectedCard,
  isResolvingFlipThree,
  isRoundComplete,
  needsActionTarget,
  selectedCardId,
  targetLabel,
  usedCardCounts,
  onAddCard,
  onQuitRound,
  onSelectedCardChange,
  onTargetChange,
}: TurnPanelProps) {
  return (
    <section className="turn-panel" aria-label="Current turn">
      <div>
        <span className="turn-label">
          {isRoundComplete
            ? 'Round complete'
            : isResolvingFlipThree
              ? 'Flip Three target'
              : 'Current player'}
        </span>
        <h2>{isRoundComplete ? 'No active players' : activePlayer?.name}</h2>
      </div>

      <form
        className={`card-entry ${needsActionTarget ? 'with-target' : ''}`}
        onSubmit={onAddCard}
      >
        <label className="field">
          <span>Card received</span>
          <select
            disabled={isRoundComplete}
            value={selectedCardId}
            onChange={(event) => onSelectedCardChange(event.target.value)}
          >
            <CardOptions
              label="Numbers"
              cards={numberCards}
              usedCardCounts={usedCardCounts}
            />
            <CardOptions
              label="Bonus"
              cards={bonusCards}
              usedCardCounts={usedCardCounts}
            />
            <CardOptions
              label="Actions"
              cards={actionCards}
              usedCardCounts={usedCardCounts}
            />
          </select>
        </label>

        {needsActionTarget && (
          <label className="field">
            <span>{targetLabel}</span>
            <select
              disabled={isRoundComplete || availableActionTargets.length === 0}
              value={actionTargetId}
              onChange={(event) => onTargetChange(event.target.value)}
            >
              {availableActionTargets.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button className="primary-button" disabled={!canAddSelectedCard}>
          Add card
        </button>
      </form>

      <button
        className="danger-button"
        type="button"
        disabled={isRoundComplete || isResolvingFlipThree}
        onClick={onQuitRound}
      >
        Quit round
      </button>
    </section>
  )
}

type CardOptionsProps = {
  label: string
  cards: typeof numberCards
  usedCardCounts: Record<string, number>
}

function CardOptions({ label, cards, usedCardCounts }: CardOptionsProps) {
  return (
    <optgroup label={label}>
      {cards.map((card) => {
        const remainingCount = getRemainingCount(card, usedCardCounts)

        return (
          <option disabled={remainingCount <= 0} key={card.id} value={card.id}>
            {card.label} ({remainingCount} left)
          </option>
        )
      })}
    </optgroup>
  )
}
