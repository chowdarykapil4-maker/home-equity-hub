import { useAppContext } from '@/context/AppContext';
import { getROIPercentage, getEstimateMidpoint, getEstimatedValueAdded } from '@/types';
import { formatCurrency } from '@/lib/format';
import { HelpTip } from '@/components/homepl/HelpTip';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function NextRenovationUp() {
  const { projects } = useAppContext();

  const planned = projects
    .filter(p => p.status.startsWith('Planned'))
    .sort((a, b) => getROIPercentage(b) - getROIPercentage(a));

  const best = planned[0];

  if (!best) {
    return (
      <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border/20">
        <p className="text-[11px] text-muted-foreground">No planned projects — add some in Renovations</p>
      </div>
    );
  }

  const roi = getROIPercentage(best);
  const cost = getEstimateMidpoint(best);
  const valueAdded = getEstimatedValueAdded(best);
  const dotColor = roi > 70 ? 'bg-success' : roi >= 40 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border/20">
      <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-tight">
          Next best:{' '}
          <HelpTip plain="The planned renovation with the highest estimated return on investment. Completing high-ROI projects first maximizes your equity growth.">
            {best.projectName}
          </HelpTip>
        </p>
        <p className="text-[10px] text-muted-foreground">
          Est. {formatCurrency(cost)} · adds ~{formatCurrency(valueAdded)} value ({roi}% ROI)
        </p>
      </div>
      <Link to="/renovations" className="text-[10px] text-primary hover:underline shrink-0 inline-flex items-center gap-0.5">
        View <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  );
}