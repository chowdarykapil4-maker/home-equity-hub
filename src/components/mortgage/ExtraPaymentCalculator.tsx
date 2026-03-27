import { useState, useMemo } from 'react';
import { MortgageProfile } from '@/types';
import { calculateExtraPaymentImpact } from '@/lib/amortization';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, TrendingDown, Clock, DollarSign } from 'lucide-react';

interface Props {
  mortgage: MortgageProfile;
  currentBalance: number;
}

export default function ExtraPaymentCalculator({ mortgage, currentBalance }: Props) {
  const [extra, setExtra] = useState(0);

  const result = useMemo(() => {
    if (extra <= 0) return null;
    return calculateExtraPaymentImpact(mortgage, currentBalance, extra);
  }, [extra, mortgage, currentBalance]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          What if I pay extra?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Label className="text-sm whitespace-nowrap">Extra monthly principal:</Label>
          <div className="relative w-36">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              className="pl-7 h-9"
              placeholder="0"
              value={extra || ''}
              onChange={e => setExtra(Math.max(0, +e.target.value))}
            />
          </div>
        </div>

        {result && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Time saved</p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.floor(result.monthsSaved / 12)}y {result.monthsSaved % 12}m
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.originalPayoffDate} → {result.newPayoffDate}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-success/5">
              <DollarSign className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Interest saved</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(result.interestSaved)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(result.originalTotalInterest)} → {formatCurrency(result.newTotalInterest)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
              <TrendingDown className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Months shaved</p>
                <p className="text-lg font-semibold text-foreground">{result.monthsSaved}</p>
                <p className="text-xs text-muted-foreground">fewer payments</p>
              </div>
            </div>
          </div>
        )}

        {!result && (
          <p className="text-xs text-muted-foreground">Enter an amount to see how extra payments accelerate your payoff.</p>
        )}
      </CardContent>
    </Card>
  );
}
