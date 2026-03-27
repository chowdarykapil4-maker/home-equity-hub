import { formatCurrency } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';

export default function MonthlySnapshot({ d }: { d: HomePLData }) {
  const { homePLConfig } = useAppContext();

  const monthlyNetGain = d.monthlyWealthCreation - d.monthlyCostOfOwnership;

  const items = [
    { label: 'Monthly housing cost', value: formatCurrency(d.monthlyCostOfOwnership), color: '' },
    { label: 'Monthly wealth creation', value: formatCurrency(d.monthlyWealthCreation), color: 'text-success' },
    { label: 'Net monthly gain', value: `${monthlyNetGain >= 0 ? '+' : ''}${formatCurrency(monthlyNetGain)}`, color: monthlyNetGain >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'Equivalent rent', value: formatCurrency(homePLConfig.estimatedMonthlyRent), color: 'text-muted-foreground' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-2.5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(item => (
          <div key={item.label} className="text-center space-y-0.5">
            <p className={`text-base font-bold tabular-nums ${item.color}`}>{item.value}</p>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
