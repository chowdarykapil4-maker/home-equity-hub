import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import ScenarioDelta from './ScenarioDelta';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

export default function MonthlySnapshot({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const { homePLConfig } = useAppContext();

  const monthlyNetGain = d.monthlyWealthCreation - d.monthlyCostOfOwnership;
  const baseNetGain = b.monthlyWealthCreation - b.monthlyCostOfOwnership;

  const items = [
    { label: 'Monthly housing cost', value: formatCurrency(d.monthlyCostOfOwnership), color: '', raw: d.monthlyCostOfOwnership, baseRaw: b.monthlyCostOfOwnership },
    { label: 'Monthly wealth creation', value: formatCurrency(d.monthlyWealthCreation), color: 'text-success', raw: d.monthlyWealthCreation, baseRaw: b.monthlyWealthCreation },
    { label: 'Net monthly gain', value: `${monthlyNetGain >= 0 ? '+' : ''}${formatCurrency(monthlyNetGain)}`, color: monthlyNetGain >= 0 ? 'text-success' : 'text-destructive', raw: monthlyNetGain, baseRaw: baseNetGain },
    { label: 'Equivalent rent', value: formatCurrency(homePLConfig.estimatedMonthlyRent), color: 'text-muted-foreground', raw: 0, baseRaw: 0 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.label} className="text-center space-y-0.5">
            <p className={`text-base font-bold tabular-nums ${item.color}`}>
              {item.value}
              {item.raw !== 0 && (
                <ScenarioDelta scenarioVal={item.raw} baseVal={item.baseRaw} active={scenarioActive} />
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
