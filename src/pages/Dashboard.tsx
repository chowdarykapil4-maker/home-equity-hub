import { useAppContext } from '@/context/AppContext';
import { getEstimatedValueAdded } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Home, Landmark, PiggyBank } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_COLORS = [
  'hsl(217, 91%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)', 'hsl(270, 60%, 55%)', 'hsl(190, 70%, 45%)',
  'hsl(330, 70%, 55%)', 'hsl(50, 80%, 50%)', 'hsl(160, 60%, 40%)',
  'hsl(210, 50%, 60%)', 'hsl(25, 80%, 50%)',
];

export default function Dashboard() {
  const { property, projects } = useAppContext();

  const completeProjects = projects.filter(p => p.status === 'Complete');
  const totalSpent = completeProjects.reduce((s, p) => s + p.actualCost, 0);
  const totalValueAdded = completeProjects.reduce((s, p) => s + getEstimatedValueAdded(p), 0);
  const netEquity = property.currentEstimatedValue - property.mortgageBalance;
  const unrealizedGainLoss = property.currentEstimatedValue - property.purchasePrice - property.closingCosts - totalSpent;

  // Bar chart: spending by year
  const yearMap: Record<string, number> = {};
  projects.forEach(p => {
    let year = '';
    if (p.status === 'Complete' && p.dateCompleted) {
      year = new Date(p.dateCompleted).getFullYear().toString();
    } else if (p.status === 'Planned 2026') year = '2026';
    else if (p.status === 'Planned 2027') year = '2027';
    else return;
    const cost = p.status === 'Complete' ? p.actualCost : (p.estimateLow + p.estimateHigh) / 2;
    yearMap[year] = (yearMap[year] || 0) + cost;
  });
  const yearData = Object.entries(yearMap).sort((a, b) => a[0].localeCompare(b[0])).map(([year, amount]) => ({ year, amount }));

  // Donut chart: by category
  const catMap: Record<string, number> = {};
  completeProjects.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + p.actualCost; });
  const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Waterfall
  const marketAppreciation = property.currentEstimatedValue - property.purchasePrice - totalValueAdded;
  const waterfallData = [
    { name: 'Purchase Price', value: property.purchasePrice },
    { name: 'Market Appreciation', value: Math.max(0, marketAppreciation) },
    { name: 'Renovation Value', value: totalValueAdded },
  ];

  const metrics = [
    { label: 'Current Home Value', value: formatCurrency(property.currentEstimatedValue), icon: Home, color: 'text-primary' },
    { label: 'Mortgage Balance', value: formatCurrency(property.mortgageBalance), icon: Landmark, color: 'text-muted-foreground' },
    { label: 'Net Equity', value: formatCurrency(netEquity), icon: PiggyBank, color: 'text-success' },
    { label: 'Total Renovation Spend', value: formatCurrency(totalSpent), icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(m => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unrealized Gain/Loss */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-3">
          {unrealizedGainLoss >= 0 ? (
            <TrendingUp className="h-6 w-6 text-success" />
          ) : (
            <TrendingDown className="h-6 w-6 text-destructive" />
          )}
          <div>
            <p className="text-sm text-muted-foreground">Unrealized Gain/Loss</p>
            <p className={`text-2xl font-bold ${unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(unrealizedGainLoss)}
            </p>
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
            ) : <p className="text-muted-foreground text-sm text-center pt-12">No data yet. Add renovation projects to see spending trends.</p>}
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

      {/* Waterfall */}
      <Card>
        <CardHeader><CardTitle className="text-base">Value Waterfall</CardTitle></CardHeader>
        <CardContent className="h-64">
          {property.currentEstimatedValue > 0 ? (
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
          ) : <p className="text-muted-foreground text-sm text-center pt-12">Set your property details to see the value waterfall.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
