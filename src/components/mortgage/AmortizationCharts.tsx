import { useMemo } from 'react';
import { AmortizationRow } from '@/lib/amortization';
import { generateScheduledBalanceCurve } from '@/lib/amortization';
import { MortgageProfile, MortgagePayment } from '@/types';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
} from 'recharts';

interface Props {
  rows: AmortizationRow[];
  mortgage: MortgageProfile;
  payments: MortgagePayment[];
}

export default function AmortizationCharts({ rows, mortgage, payments }: Props) {
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Sample every 3rd month for performance
  const sampledRows = useMemo(() => {
    return rows.filter((_, i) => i % 3 === 0 || rows[i].isCurrentMonth);
  }, [rows]);

  // Stacked area data
  const areaData = useMemo(() =>
    sampledRows.map(r => ({
      date: r.date,
      Principal: Math.round(r.principalPortion),
      Interest: Math.round(r.interestPortion),
    })), [sampledRows]);

  // Balance curve data with actual vs scheduled comparison
  const hasExtraPayments = payments.some(p => p.extraPrincipal > 0);
  const scheduledCurve = useMemo(() => generateScheduledBalanceCurve(mortgage), [mortgage]);

  const balanceData = useMemo(() => {
    const scheduledMap = new Map(scheduledCurve.map(p => [p.date, p.balance]));
    return sampledRows.map(r => ({
      date: r.date,
      actual: r.remainingBalance,
      scheduled: scheduledMap.get(r.date) ?? null,
    }));
  }, [sampledRows, scheduledCurve]);

  const formatDate = (ym: string) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return m === '01' ? y : '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1 - Stacked Area */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Principal vs Interest Composition</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={50} />
              <Tooltip
                formatter={(v: number, name: string) => [formatCurrency(v), name]}
                labelFormatter={(l: string) => {
                  const [y, m] = l.split('-');
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  return `${months[parseInt(m)-1]} ${y}`;
                }}
              />
              <ReferenceLine x={currentYM} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={1.5} />
              <Area type="monotone" dataKey="Principal" stackId="1" fill="hsl(var(--success))" stroke="hsl(var(--success))" fillOpacity={0.5} />
              <Area type="monotone" dataKey="Interest" stackId="1" fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))" fillOpacity={0.4} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Chart 2 - Balance Paydown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Balance Paydown</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={55} />
              <Tooltip
                formatter={(v: number, name: string) => [formatCurrency(v), name === 'actual' ? 'Actual Balance' : 'Standard Schedule']}
                labelFormatter={(l: string) => {
                  const [y, m] = l.split('-');
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  return `${months[parseInt(m)-1]} ${y}`;
                }}
              />
              <ReferenceLine x={currentYM} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth={1.5} />
              {hasExtraPayments && (
                <Line type="monotone" dataKey="scheduled" stroke="hsl(var(--muted-foreground))" strokeDasharray="6 3" strokeWidth={1.5} dot={false} name="scheduled" />
              )}
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="actual" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
