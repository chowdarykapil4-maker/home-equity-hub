import { formatCurrency } from '@/lib/format';

interface Props {
  scenarioPercent: number;
  onChange: (pct: number) => void;
  modeledValue: number;
  baseValue: number;
}

const PRESETS = [
  { label: 'Crash −20%', value: -20, bg: 'bg-destructive/10', activeBg: 'bg-destructive/25', text: 'text-destructive' },
  { label: 'Flat 0%', value: 0, bg: 'bg-muted', activeBg: 'bg-muted-foreground/25', text: 'text-muted-foreground' },
  { label: 'Growth +15%', value: 15, bg: 'bg-success/10', activeBg: 'bg-success/25', text: 'text-success' },
  { label: 'Hot +25%', value: 25, bg: 'bg-success/15', activeBg: 'bg-success/35', text: 'text-success' },
];

export default function ValueSensitivitySlider({ scenarioPercent, onChange, modeledValue, baseValue }: Props) {
  const isActive = scenarioPercent !== 0;
  const diff = modeledValue - baseValue;
  const sign = scenarioPercent > 0 ? '+' : '';

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2.5 space-y-1.5">
      {/* Row 1 — header + modeled value */}
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-foreground">What-if modeling</span>
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <span className={`text-lg font-medium tabular-nums ${scenarioPercent < 0 ? 'text-destructive' : 'text-success'}`}>
                Modeled: {formatCurrency(modeledValue)}
              </span>
              <span className={`text-[10px] font-medium ${scenarioPercent < 0 ? 'text-destructive' : 'text-success'}`}>
                ({sign}{scenarioPercent}% / {sign}{formatCurrency(diff)})
              </span>
              <button onClick={() => onChange(0)} className="text-[11px] text-primary hover:underline">Reset</button>
            </>
          ) : (
            <span className="text-lg font-medium tabular-nums text-foreground">
              Current: {formatCurrency(baseValue)}
            </span>
          )}
        </div>
      </div>

      {/* Row 2 — slider */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground shrink-0">−30%</span>
        <div className="relative flex-1 h-7 flex items-center">
          {/* Color zones behind slider */}
          <div className="absolute inset-x-0 h-1.5 rounded-full overflow-hidden flex">
            <div className="w-1/3 bg-destructive/10" />
            <div className="w-1/3 bg-muted/60" />
            <div className="w-1/3 bg-success/10" />
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            step={1}
            value={scenarioPercent}
            onChange={e => onChange(Number(e.target.value))}
            className="relative z-10 w-full h-1.5 appearance-none bg-transparent cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-md
              [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background"
          />
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">+30%</span>
      </div>

      {/* Row 3 — preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(p => {
          const isSelected = scenarioPercent === p.value;
          return (
            <button
              key={p.value}
              onClick={() => onChange(p.value)}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors
                ${isSelected ? `${p.activeBg} ${p.text} font-medium` : `${p.bg} ${p.text}`}
              `}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
