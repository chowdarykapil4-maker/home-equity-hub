import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getEstimatedValueAdded, getEstimateMidpoint, resolveHomeValue } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Home, Landmark, PiggyBank, CalendarCheck, Receipt, ArrowRight, LineChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart as ReLineChart, Line } from 'recharts';
import { useHomePL } from '@/hooks/useHomePL';
import { calculateRentInvest } from '@/lib/rentInvest';
import { calculateTaxAdjusted } from '@/lib/taxCalcs';
import { calculateBreakevenTimeline } from '@/lib/breakeven';
import { Link } from 'react-router-dom';

const CHART_COLORS = [
  'hsl(217, 91%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)', 'hsl(270, 60%, 55%)', 'hsl(190, 70%, 45%)',
  'hsl(330, 70%, 55%)', 'hsl(50, 80%, 50%)', 'hsl(160, 60%, 40%)',
];

export default function Dashboard() {
  const { property, projects, mortgage, mortgagePayments, valueEntries, financingEntries, homePLConfig } = useAppContext();
  const pl = useHomePL();

  const completedProjects = projects.filter(p => p.status === 'Complete');
  const tax = homePLConfig.tax;
  const rentInvest10 = useMemo(() =>
    calculateRentInvest(10, pl.monthsOwned, pl.downPayment, mortgage, homePLConfig, completedProjects, pl.wealthBuilt, pl.sunkCost, pl.purchaseDate),
    [pl, mortgage, homePLConfig, completedProjects]
  );
  const taxAdj10 = useMemo(() => calculateTaxAdjusted(pl, rentInvest10, tax), [pl, rentInvest10, tax]);
  const breakeven10 = useMemo(() =>
    calculateBreakevenTimeline(pl.downPayment, pl.purchasePrice, mortgage, homePLConfig, tax, 10, pl.totalRenoValueAdded, 15),
    [pl, mortgage, homePLConfig, tax]
  );

  const completeProjects = completedProjects;
  const totalSpent = completeProjects.reduce((s, p) => s + p.actualCost, 0);
  const totalValueAdded = completeProjects.reduce((s, p) => s + getEstimatedValueAdded(p), 0);

  const homeValue = pl.currentHomeValue;
  const mortgageBalance = pl.currentBalance;

  // Live mortgage balance
  const sortedPayments = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const mortgageBalance = sortedPayments.length > 0 ? sortedPayments[sortedPayments.length - 1].remainingBalance : mortgage.originalLoanAmount;
  const lastPaymentDate = sortedPayments.length > 0 ? sortedPayments[sortedPayments.length - 1].paymentDate : null;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const paidThisMonth = lastPaymentDate?.startsWith(currentMonthStr);

  const currentYear = now.getFullYear().toString();
  const principalThisYear = sortedPayments.filter(p => p.paymentDate.startsWith(currentYear)).reduce((s, p) => s + p.principalPortion + p.extraPrincipal, 0);

  // Financing
  const totalHelocDrawn = financingEntries.filter(f => f.type === 'HELOC Draw').reduce((s, f) => s + f.remainingBalance, 0);
  const totalFinancingMonthly = financingEntries.reduce((s, f) => s + f.monthlyPayment, 0);
  const totalMonthlyObligations = mortgage.monthlyPayment + totalFinancingMonthly;

  // Equity
  const netEquity = homeValue - mortgageBalance - totalHelocDrawn;
  const ltv = homeValue > 0 ? (mortgageBalance / homeValue) * 100 : 0;
  const cltv = homeValue > 0 ? ((mortgageBalance + totalHelocDrawn) / homeValue) * 100 : 0;
  const availableHeloc80 = Math.max(0, homeValue * 0.80 - mortgageBalance - totalHelocDrawn);
  const availableHeloc90 = Math.max(0, homeValue * 0.90 - mortgageBalance - totalHelocDrawn);

  const unrealizedGainLoss = homeValue - property.purchasePrice - property.closingCosts - totalSpent;

  // Value trend sparkline (last 6 entries)
  const valueTrend = [...valueEntries].sort((a, b) => a.date.localeCompare(b.date)).slice(-6).map(e => ({ date: e.date, v: e.estimatedValue }));

  // Last value update
  const latestValueEntry = valueEntries.length > 0 ? [...valueEntries].sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  const daysSinceUpdate = latestValueEntry ? Math.floor((now.getTime() - new Date(latestValueEntry.date).getTime()) / 86400000) : Infinity;

  // Bar chart: spending by year
  const yearMap: Record<string, number> = {};
  projects.forEach(p => {
    let year = '';
    if (p.status === 'Complete' && p.dateCompleted) year = new Date(p.dateCompleted).getFullYear().toString();
    else if (p.status === 'Planned 2026') year = '2026';
    else if (p.status === 'Planned 2027') year = '2027';
    else return;
    const cost = p.status === 'Complete' ? p.actualCost : (p.estimateLow + p.estimateHigh) / 2;
    yearMap[year] = (yearMap[year] || 0) + cost;
  });
  const yearData = Object.entries(yearMap).sort().map(([year, amount]) => ({ year, amount }));

  const catMap: Record<string, number> = {};
  completeProjects.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.actualCost; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  const marketAppreciation = homeValue - property.purchasePrice - totalValueAdded;
  const waterfallData = [
    { name: 'Purchase Price', value: property.purchasePrice },
    { name: 'Market Appreciation', value: Math.max(0, marketAppreciation) },
    { name: 'Renovation Value', value: totalValueAdded },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Home Value with sparkline */}
        <Card className="col-span-1 sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Blended Home Value</CardTitle>
            <Home className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(homeValue)}</p>
            {valueTrend.length > 1 && (
              <div className="h-8 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={valueTrend}><Line type="monotone" dataKey="v" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} /></ReLineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className={`text-xs mt-1 ${daysSinceUpdate > 30 ? 'text-warning' : 'text-muted-foreground'}`}>
              {latestValueEntry ? (daysSinceUpdate > 30 ? 'Consider updating' : `Updated ${latestValueEntry.date}`) : 'No value entries yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mortgage Balance</CardTitle>
            <Landmark className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(mortgageBalance)}</p>
            <p className={`text-xs mt-1 ${paidThisMonth ? 'text-muted-foreground' : 'text-warning'}`}>
              {lastPaymentDate ? `Last payment: ${lastPaymentDate}` : 'No payments logged'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Equity</CardTitle>
            <PiggyBank className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent><p className={`text-2xl font-bold ${netEquity >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(netEquity)}</p></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Renovation Spend</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Principal This Year</CardTitle>
            <CalendarCheck className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent><p className="text-2xl font-bold text-success">{formatCurrency(principalThisYear)}</p></CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Obligations</CardTitle>
            <Receipt className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalMonthlyObligations)}</p>
            <p className="text-xs text-muted-foreground">Mortgage + Financing</p>
          </CardContent>
        </Card>
      </div>

      {/* Equity Position Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">Equity Position Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Blended Home Value</span>
              <span className="text-lg font-semibold">{formatCurrency(homeValue)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t">
              <span className="text-sm text-muted-foreground">Minus: Mortgage Balance</span>
              <span className="text-lg font-semibold text-destructive">−{formatCurrency(mortgageBalance)}</span>
            </div>
            {totalHelocDrawn > 0 && (
              <div className="flex justify-between items-center py-2 border-t">
                <span className="text-sm text-muted-foreground">Minus: HELOC Drawn</span>
                <span className="text-lg font-semibold text-destructive">−{formatCurrency(totalHelocDrawn)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-t-2 border-foreground/20">
              <span className="text-base font-bold">NET EQUITY</span>
              <span className={`text-2xl font-bold ${netEquity >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(netEquity)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t">
            <div><p className="text-xs text-muted-foreground">LTV Ratio</p><p className="text-lg font-bold">{formatPercent(ltv)}</p></div>
            <div><p className="text-xs text-muted-foreground">CLTV Ratio</p><p className="text-lg font-bold">{formatPercent(cltv)}</p></div>
            <div><p className="text-xs text-muted-foreground">Avail HELOC @ 80% CLTV</p><p className="text-lg font-bold text-success">{formatCurrency(availableHeloc80)}</p></div>
            <div><p className="text-xs text-muted-foreground">Avail HELOC @ 90% CLTV</p><p className="text-lg font-bold text-success">{formatCurrency(availableHeloc90)}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Unrealized Gain/Loss */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-3">
          {unrealizedGainLoss >= 0 ? <TrendingUp className="h-6 w-6 text-success" /> : <TrendingDown className="h-6 w-6 text-destructive" />}
          <div>
            <p className="text-sm text-muted-foreground">Unrealized Gain/Loss</p>
            <p className={`text-2xl font-bold ${unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(unrealizedGainLoss)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Home P&L Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Home P&L</CardTitle>
          <LineChart className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Wealth built</p>
              <p className="text-lg font-bold text-success">{formatCurrency(pl.wealthBuilt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sunk cost</p>
              <p className="text-lg font-bold text-destructive/70">{formatCurrency(pl.sunkCost)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">vs renting</p>
              <p className={`text-lg font-bold ${pl.ownershipAdvantage >= 0 ? 'text-success' : 'text-destructive'}`}>{pl.ownershipAdvantage >= 0 ? '+' : ''}{formatCurrency(pl.ownershipAdvantage)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <Link to="/home-pl" className="text-xs text-primary hover:underline inline-flex items-center gap-1">View full P&L →</Link>
            <Link to="/home-pl" className={`text-xs hover:underline ${taxAdj10.afterTaxMargin >= 0 ? 'text-success' : 'text-warning'}`}>
              vs. rent + invest (10%, after-tax): {taxAdj10.afterTaxMargin >= 0 ? 'Own wins' : 'Rent wins'} +{formatCurrency(Math.abs(taxAdj10.afterTaxMargin))}
            </Link>
            <Link to="/home-pl" className="text-xs text-muted-foreground hover:underline">
              {breakeven10.crossoverYear && breakeven10.crossoverYear <= Math.ceil(pl.yearsOwned)
                ? `Past breakeven — owning advantage growing`
                : breakeven10.crossoverYear
                  ? `Breakeven: Year ${breakeven10.crossoverYear}`
                  : 'Breakeven: 15+ years'}
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Renovation Spending by Year</CardTitle></CardHeader>
          <CardContent className="h-72">
            {yearData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearData}>
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center pt-12">No data yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Spending by Category</CardTitle></CardHeader>
          <CardContent className="h-72">
            {catData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}>
                    {catData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center pt-12">No completed projects yet.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Renovation Pipeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Renovation Pipeline</CardTitle></CardHeader>
        <CardContent>
          {(() => {
            const wishlist = projects.filter(p => p.status === 'Wishlist');
            const planned = projects.filter(p => p.status === 'Planned 2026' || p.status === 'Planned 2027' || p.status === 'In Progress');
            const wishlistVal = wishlist.reduce((s, p) => s + getEstimateMidpoint(p), 0);
            const plannedVal = planned.reduce((s, p) => s + getEstimateMidpoint(p), 0);
            return (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <div className="text-center bg-muted rounded-lg px-4 py-3 min-w-[120px]">
                  <p className="text-2xl font-bold">{wishlist.length}</p>
                  <p className="text-xs text-muted-foreground">Wishlist</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(wishlistVal)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center bg-primary/10 rounded-lg px-4 py-3 min-w-[120px]">
                  <p className="text-2xl font-bold text-primary">{planned.length}</p>
                  <p className="text-xs text-muted-foreground">Planned</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(plannedVal)}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <div className="text-center bg-success/10 rounded-lg px-4 py-3 min-w-[120px]">
                  <p className="text-2xl font-bold text-success">{completeProjects.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Value Waterfall */}
      <Card>
        <CardHeader><CardTitle className="text-base">Value Waterfall</CardTitle></CardHeader>
        <CardContent className="h-64">
          {homeValue > 0 && property.purchasePrice > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} layout="vertical">
                <XAxis type="number" tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" width={140} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {waterfallData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-sm text-center pt-12">Set purchase price and home value to see the waterfall.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
