interface Props {
  scenarioPercent: number;
  extraPrincipal?: number;
  onReset: () => void;
}

export default function ScenarioBanner({ scenarioPercent, extraPrincipal = 0, onReset }: Props) {
  if (scenarioPercent === 0 && extraPrincipal === 0) return null;

  const parts: string[] = [];
  if (scenarioPercent !== 0) {
    const sign = scenarioPercent > 0 ? '+' : '';
    parts.push(`values adjusted [${sign}${scenarioPercent}%]`);
  }
  if (extraPrincipal > 0) {
    parts.push(`+$${extraPrincipal.toLocaleString()}/mo extra principal`);
  }

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-warning/10 text-warning px-3 h-6 text-xs font-medium">
      <span>Modeling: {parts.join(' + ')}</span>
      <button onClick={onReset} className="text-primary hover:underline text-[11px] font-medium ml-2">
        Exit scenario
      </button>
    </div>
  );
}
