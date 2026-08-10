type GameHeaderProps = {
  isDeckEmpty: boolean
  isResolvingFlipThree: boolean
  isRoundComplete: boolean
  activePlayerName?: string
  flipThreeTargetName?: string
  flipThreeCardsRemaining?: number
  onNextRound: () => void
  onResetGame: () => void
}

export function GameHeader({
  isDeckEmpty,
  isResolvingFlipThree,
  isRoundComplete,
  activePlayerName,
  flipThreeTargetName,
  flipThreeCardsRemaining,
  onNextRound,
  onResetGame,
}: GameHeaderProps) {
  return (
    <section className="game-header" aria-labelledby="game-title">
      <div className="section-heading">
        <p className="eyebrow">Card tracker</p>
        <h1 id="game-title">Enter the next card</h1>
        <p>
          {isRoundComplete
            ? isDeckEmpty
              ? 'The draw pile is empty. Start the next round to recycle off-board cards.'
              : 'Every player is out, busted, or frozen for this round.'
            : isResolvingFlipThree
              ? `${flipThreeTargetName} is resolving Flip Three. Enter ${flipThreeCardsRemaining} more card${flipThreeCardsRemaining === 1 ? '' : 's'}, then the turn resumes.`
              : `Only ${activePlayerName} can receive a card now. After entry, the turn moves to the next player still in.`}
        </p>
      </div>
      <div className="header-actions">
        <button
          className="primary-button"
          type="button"
          disabled={!isRoundComplete}
          onClick={onNextRound}
        >
          Next round
        </button>
        <button className="secondary-button" type="button" onClick={onResetGame}>
          New setup
        </button>
      </div>
    </section>
  )
}
