type EvPanelProps = {
  bustPercentage: number
  drawExpectedValue: number
  drawValueDelta: number
  recommendedAction: 'Draw' | 'Quit'
}

export function EvPanel({
  bustPercentage,
  drawExpectedValue,
  drawValueDelta,
  recommendedAction,
}: EvPanelProps) {
  const formattedDelta =
    drawValueDelta >= 0
      ? `+${drawValueDelta.toFixed(1)}`
      : drawValueDelta.toFixed(1)

  return (
    <section className="ev-panel" aria-label="Expected values">
      <div>
        <span className="turn-label">Draw EV</span>
        <strong>
          {drawExpectedValue.toFixed(1)} ({formattedDelta})
        </strong>
      </div>
      <div>
        <span className="turn-label">Recommended</span>
        <strong>{recommendedAction}</strong>
      </div>
      <div>
        <span className="turn-label">Bust risk</span>
        <strong>{bustPercentage.toFixed(0)}%</strong>
      </div>
    </section>
  )
}
