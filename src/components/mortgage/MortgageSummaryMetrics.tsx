import { useMemo } from 'react';
import { MortgageProfile, MortgagePayment, isARM, calculateMonthsRemaining } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  mortgage: MortgageProfile;
  payments: MortgagePayment[];
  currentValue: number;
}

export default function MortgageSummaryMetrics({ mortgage, payments, currentValue }: Props) {
  const sorted = useMemo(() => [...payments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate)), [payments]);

  const currentBalance = sorted.length > 0 ? sorted[sorted.length - 1].remainingBalance : mortgage.originalLoanAmount;
  const totalPrincipalPaid = sorted.reduce((s, p) => s + p.principalPortion + p.extraPrincipal, 0);
  const totalInterestPaid = sorted.reduce((s, p) => s + p.interestPortion, 0);
  const totalPaid = sorted.reduce((s, p) => s + p.paymentAmount + p.extraPrincipal, 0);
  const principalPct = totalPrincipalPaid + totalInterestPaid > 0 ? (totalPrincipalPaid / (totalPrincipalPaid + totalInterestPaid)) * 100 : 0;
  const interestPct = 100 - principalPct;
  const ltv = currentValue > 0 ? (currentBalance / currentValue) * 100 : 0;
  const equity = currentValue - currentBalance;
  const monthsRemaining = calculateMonthsRemaining(currentBalance, mortgage.interestRate, mortgage.monthlyPayment);
  const paymentsMade = sorted.length;
  const totalTermMonths = mortgage.loanTermYears * 12;
  const paymentsRemaining = Math.max(0, totalTermMonths - paymentsMade);

  // Timeline
  const startDate = new Date(mortgage.loanStartDate);
  const now = new Date();
  const yearsIn = ((now.getTime() - startDate.getTime()) / (365.25 * 24 * 3600000));
  const yearsRemStr = monthsRemaining === Infinity ? '∞' : (monthsRemaining / 12).toFixed(1);
  const projectedPayoff = new Date(now.getFullYear(), now.getMonth() + monthsRemaining, 1);

  // P/I donut data
  const donutData = [
    { name: 'Principal', value: Math.round(totalPrincipalPaid) },
    { name: 'Interest', value: Math.round(totalInterestPaid) },
  ];

  // ARM
  const showARM = isARM(mortgage.loanType);
  const armReset = new Date(mortgage.armResetDate);
  const monthsUntilReset = (armReset.getFullYear() - now.getFullYear()) * 12 + (armReset.getMonth() - now.getMonth());

  return (
    <div className="space-y-4">
      {/* Row 1 — Key Balances */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Original Loan" value={formatCurrency(mortgage.originalLoanAmount)} />
        <MetricCard label="Current Balance" value={formatCurrency(currentBalance)} accent />
        <MetricCard label="Total Paid to Date" value={formatCurrency(totalPaid)} />
        <MetricCard label="Equity" value={formatCurrency(equity)} sub={`LTV: ${formatPercent(ltv)}`} positive />
      </div>

      {/* Row 2 — P/I Breakdown with Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_140px] gap-3">
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Principal Paid" value={formatCurrency(totalPrincipalPaid)} positive sub={`${principalPct.toFixed(1)}% of payments`} />
          <MetricCard label="Interest Paid" value={formatCurrency(totalInterestPaid)} negative sub={`${interestPct.toFixed(1)}% of payments`} />
          <MetricCard label="Principal Paid %" value={formatPercent((totalPrincipalPaid / mortgage.originalLoanAmount) * 100)}>
            <Progress value={(totalPrincipalPaid / mortgage.originalLoanAmount) * 100} className="mt-1.5 h-1.5" />
          </MetricCard>
        </div>
        <Card className="flex items-center justify-center">
          <ResponsiveContainer width={100} height={100}>
            <PieChart>
              <Pie data={donutData} dataKey="value" innerRadius={28} outerRadius={42} paddingAngle={2} strokeWidth={0}>
                <Cell fill="hsl(var(--success))" />
                <Cell fill="hsl(var(--destructive))" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3 — Timeline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Payments Made" value={String(paymentsMade)} sub={`of ~${totalTermMonths}`} />
        <MetricCard label="Payments Remaining" value={monthsRemaining === Infinity ? '∞' : String(monthsRemaining)} />
        <MetricCard label="Projected Payoff" value={projectedPayoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} />
        <MetricCard label="Loan Progress" value={`${yearsIn.toFixed(1)} yrs in`} sub={`${yearsRemStr} yrs remaining`} />
      </div>

      {/* Row 4 — ARM (conditional) */}
      {showARM && (
        <Card className={monthsUntilReset <= 12 ? 'border-warning bg-warning/5' : ''}>
          <CardContent className="py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">ARM Reset</p><p className="font-semibold">{armReset.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p></div>
              <div><p className="text-xs text-muted-foreground">Months Until Reset</p><p className="font-semibold">{monthsUntilReset}</p></div>
              <div><p className="text-xs text-muted-foreground">Current Rate</p><p className="font-semibold">{mortgage.interestRate}%</p></div>
              <div><p className="text-xs text-muted-foreground">Est. Market Rate</p><p className="font-semibold">{mortgage.estimatedMarketRate}%</p></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, accent, positive, negative, children }: {
  label: string; value: string; sub?: string; accent?: boolean; positive?: boolean; negative?: boolean; children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold mt-0.5 ${positive ? 'text-success' : negative ? 'text-destructive' : accent ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
