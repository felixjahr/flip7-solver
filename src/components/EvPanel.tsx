type EvPanelProps = {
  bustPercentage: number
  drawExpectedValue: number
  quitExpectedValue: number
}

export function EvPanel({
  bustPercentage,
  drawExpectedValue,
  quitExpectedValue,
}: EvPanelProps) {
  return (
    <section className="ev-panel" aria-label="Expected values">
      <div>
        <span className="turn-label">Draw EV</span>
        <strong>{drawExpectedValue.toFixed(1)}</strong>
      </div>
      <div>
        <span className="turn-label">Quit EV</span>
        <strong>{quitExpectedValue.toFixed(1)}</strong>
      </div>
      <div>
        <span className="turn-label">Bust risk</span>
        <strong>{bustPercentage.toFixed(0)}%</strong>
      </div>
    </section>
  )
}
