interface Props {
  scenarioPercent: number;
  onReset: () => void;
}

export default function ScenarioBanner({ scenarioPercent, onReset }: Props) {
  if (scenarioPercent === 0) return null;

  const sign = scenarioPercent > 0 ? '+' : '';

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-warning/10 text-warning px-3 h-6 text-xs font-medium">
      <span>Scenario mode: values adjusted [{sign}{scenarioPercent}%] from current estimate</span>
      <button onClick={onReset} className="text-primary hover:underline text-[11px] font-medium ml-2">
        Exit scenario
      </button>
    </div>
  );
}
