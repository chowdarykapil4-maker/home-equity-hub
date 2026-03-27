import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { HomePLConfig } from '@/context/AppContext';
import { useHomePL } from '@/hooks/useHomePL';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings2, TrendingUp, DollarSign, Percent, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, Legend } from 'recharts';

function TagBadge({ type }: { type: 'equity' | 'sunk' | 'guaranteed' | 'market' }) {
  const styles = {
    equity: 'bg-success/15 text-success border-success/30',
    sunk: 'bg-destructive/15 text-destructive border-destructive/30',
    guaranteed: 'bg-success/15 text-success border-success/30',
    market: 'bg-muted text-muted-foreground border-border',
  };
  const labels = { equity: 'Builds equity', sunk: 'Sunk cost', guaranteed: 'Guaranteed', market: 'Market dependent' };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${styles[type]}`}>{labels[type]}</span>;
}

export default function HomePL() {
  const { homePLConfig, setHomePLConfig } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<HomePLConfig>(homePLConfig);
  const d = useHomePL();

  const saveConfig = () => { setHomePLConfig(draft); setEditing(false); };

  const sunkLedger = [
    { label: 'Interest to bank', value: d.interestPaid },
    { label: 'Property tax', value: d.totalPropertyTax },
    { label: 'Net renovation cost', value: d.netRenoCost },
    { label: 'Insurance', value: d.totalInsurance },
    { label: 'Maintenance', value: d.totalMaintenance },
    ...(d.totalHOA > 0 ? [{ label: 'HOA', value: d.totalHOA }] : []),
  ].sort((a, b) => b.value - a.value);

  const crossoverData = d.crossoverMonth ? d.chartData.find(p => p.month === d.crossoverMonth) : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Home P&L</h2>
        {!editing && (
          <button onClick={() => { setDraft(homePLConfig); setEditing(true); }} className="text-xs text-primary hover:underline flex items-center gap-1">
            <Settings2 className="h-3 w-3" /> Edit assumptions
          </button>
        )}
      </div>

      {/* Assumptions editor */}
      {editing && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Cost Assumptions</p>
              <button onClick={() => setEditing(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div><Label className="text-[11px]">Annual property tax</Label><Input type="number" value={draft.annualPropertyTax} onChange={e => setDraft({ ...draft, annualPropertyTax: +e.target.value })} /></div>
              <div><Label className="text-[11px]">Monthly insurance</Label><Input type="number" value={draft.monthlyInsurance} onChange={e => setDraft({ ...draft, monthlyInsurance: +e.target.value })} /></div>
              <div><Label className="text-[11px]">Monthly HOA</Label><Input type="number" value={draft.monthlyHOA} onChange={e => setDraft({ ...draft, monthlyHOA: +e.target.value })} /></div>
              <div><Label className="text-[11px]">Comparable rent/mo</Label><Input type="number" value={draft.estimatedMonthlyRent} onChange={e => setDraft({ ...draft, estimatedMonthlyRent: +e.target.value })} /></div>
              <div><Label className="text-[11px]">Annual maintenance</Label><Input type="number" value={draft.annualMaintenance} onChange={e => setDraft({ ...draft, annualMaintenance: +e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={saveConfig}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 1 — Big Picture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground font-medium">Total cash invested</p></div>
            <p className="text-2xl font-bold">{formatCurrency(d.totalCashInvested)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Every dollar related to this house</p>
          </CardContent>
        </Card>
        <Card className="border-success/30">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-success" /><p className="text-xs text-muted-foreground font-medium">Wealth built</p></div>
            <p className="text-2xl font-bold text-success">{formatCurrency(d.wealthBuilt)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Down payment + principal + appreciation + reno value</p>
          </CardContent>
        </Card>
        <Card className={d.returnOnCash >= 0 ? 'border-success/30' : 'border-destructive/30'}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-1"><Percent className="h-4 w-4" style={{ color: d.returnOnCash >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }} /><p className="text-xs text-muted-foreground font-medium">Return on cash</p></div>
            <p className={`text-2xl font-bold ${d.returnOnCash >= 0 ? 'text-success' : 'text-destructive'}`}>{formatPercent(d.returnOnCash)}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Net wealth created: {formatCurrency(d.netWealthCreated)}</p>
          </CardContent>
        </Card>
      </div>

      {/* SECTIONS 2 & 3 — Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 2 — Money Out */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Where your money went</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Down payment" value={d.downPayment} tag="equity" />
            <Row label="Principal paid" value={d.principalPaid} tag="equity" />
            <Row label="Interest paid" value={d.interestPaid} tag="sunk" />
            <div className="pl-0">
              <Row label="Renovation spend" value={d.totalRenoSpend} />
              <div className="pl-4 space-y-1 mt-1">
                <Row label={`Value recovered (~${Math.round(d.renoRecoveryPct)}%)`} value={d.totalRenoValueAdded} tag="equity" small />
                <Row label={`Net reno cost (~${Math.round(100 - d.renoRecoveryPct)}%)`} value={d.netRenoCost} tag="sunk" small />
              </div>
            </div>
            <Row label="Property tax" value={d.totalPropertyTax} tag="sunk" />
            <Row label="Insurance" value={d.totalInsurance} tag="sunk" />
            {d.totalHOA > 0 && <Row label="HOA" value={d.totalHOA} tag="sunk" />}
            <Row label="Maintenance" value={d.totalMaintenance} tag="sunk" />

            <Separator className="my-3" />
            <div className="flex justify-between font-bold"><span>Total cash out</span><span>{formatCurrency(d.totalCashOut)}</span></div>
            <div className="flex justify-between text-success text-xs mt-2">
              <span>Equity-building spend ({formatPercent(d.equityBuildingPct)})</span>
              <span>{formatCurrency(d.equityBuildingSpend)}</span>
            </div>
            <div className="flex justify-between text-destructive text-xs">
              <span>Sunk cost ({formatPercent(d.sunkCostPct)})</span>
              <span>{formatCurrency(d.sunkCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 — Equity Breakdown */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Equity breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Down payment" value={d.downPayment} tag="guaranteed" />
            <Row label="Principal paid to date" value={d.principalPaid} tag="guaranteed" />
            <div>
              <Row label="Market appreciation" value={d.marketAppreciation} tag="market" />
              <p className="text-[11px] text-muted-foreground pl-4 mt-0.5">Home grew from {formatCurrency(d.purchasePrice)} to {formatCurrency(d.currentHomeValue)}</p>
            </div>
            <div>
              <Row label="Renovation value-add" value={d.totalRenoValueAdded} tag="market" />
              <p className="text-[11px] text-muted-foreground pl-4 mt-0.5">{Math.round(d.renoRecoveryPct)}% recovery on {formatCurrency(d.totalRenoSpend)} invested</p>
            </div>

            <Separator className="my-3" />
            <div className="flex justify-between font-bold text-success"><span>Total equity</span><span className="text-xl">{formatCurrency(d.wealthBuilt)}</span></div>
            <div className="flex justify-between text-success text-xs mt-2"><span>Guaranteed equity</span><span>{formatCurrency(d.guaranteedEquity)}</span></div>
            <div className="flex justify-between text-muted-foreground text-xs"><span>Market-dependent equity</span><span>{formatCurrency(d.marketDependentEquity)}</span></div>

            {/* Stacked bar */}
            {d.wealthBuilt > 0 && (
              <div className="flex h-3 rounded-full overflow-hidden mt-3">
                <div className="bg-success" style={{ width: `${(d.guaranteedEquity / d.wealthBuilt) * 100}%` }} />
                <div className="bg-muted" style={{ width: `${(d.marketDependentEquity / d.wealthBuilt) * 100}%` }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4 — Sunk Cost Ledger */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Cost of ownership (non-recoverable)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {sunkLedger.map(item => (
              <div key={item.label} className="flex justify-between py-1">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(d.sunkCost)}</span></div>
            <p className="text-xs text-muted-foreground mt-2">Monthly cost of ownership: <span className="font-semibold text-foreground">{formatCurrency(d.monthlyCostOfOwnership)}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 5 — vs Renting */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Owning vs. renting this home</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-xs text-muted-foreground mb-2">IF YOU OWNED (ACTUAL)</p>
              <ComparisonRow label="Total cash spent" value={d.totalCashOut} />
              <ComparisonRow label="Equity built" value={d.wealthBuilt} color="success" />
              <ComparisonRow label="Sunk cost" value={d.ownerSunkCost} color="destructive" />
              <ComparisonRow label="Monthly eff. cost" value={d.monthlyCostOfOwnership} />
            </div>
            <div>
              <p className="font-semibold text-xs text-muted-foreground mb-2">IF YOU RENTED (ESTIMATED)</p>
              <ComparisonRow label="Total rent paid" value={d.totalRentWouldHavePaid} />
              <ComparisonRow label="Equity built" value={0} />
              <ComparisonRow label="Sunk cost" value={d.renterSunkCost} color="destructive" />
              <ComparisonRow label="Monthly eff. cost" value={homePLConfig.estimatedMonthlyRent} />
            </div>
          </div>

          <Separator className="my-4" />
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">THE VERDICT</p>
            <p className={`text-3xl font-bold ${d.ownershipAdvantage >= 0 ? 'text-success' : 'text-destructive'}`}>
              {d.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(d.ownershipAdvantage)}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              By owning instead of renting, you spent {formatCurrency(Math.abs(d.sunkCostDiff))} {d.sunkCostDiff > 0 ? 'more' : 'less'} in sunk costs but built {formatCurrency(d.wealthBuilt)} in equity. Net wealth advantage: {formatCurrency(d.ownershipAdvantage)}
            </p>
            <p className="text-sm font-medium">Monthly wealth creation rate: <span className="text-success">{formatCurrency(d.monthlyWealthCreation)}/mo</span></p>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 6 — Cost Over Time Chart */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Cost & equity over time</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={d.chartData}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={5} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Month: ${l}`} />
              <Legend />
              <Line type="monotone" dataKey="sunkCost" name="Cumulative sunk cost" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="equity" name="Cumulative equity" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="rent" name="Renter would have spent" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              {crossoverData && (
                <ReferenceDot x={d.crossoverMonth!} y={crossoverData.equity} r={6} fill="hsl(var(--success))" stroke="hsl(var(--background))" strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, tag, small }: { label: string; value: number; tag?: 'equity' | 'sunk' | 'guaranteed' | 'market'; small?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${small ? 'text-xs' : ''}`}>
      <span className={small ? 'text-muted-foreground' : ''}>{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
        {tag && <TagBadge type={tag} />}
      </div>
    </div>
  );
}

function ComparisonRow({ label, value, color }: { label: string; value: number; color?: 'success' | 'destructive' }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${color === 'success' ? 'text-success' : color === 'destructive' ? 'text-destructive' : ''}`}>{formatCurrency(value)}</span>
    </div>
  );
}
