import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { calculateRentInvest, calculateSensitivityTable } from '@/lib/rentInvest';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import ScenarioDelta from './ScenarioDelta';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

const PRESET_RATES = [7, 8, 10, 12];
const SENSITIVITY_RATES = [7, 8, 10, 12, 15];

export default function RentVsInvest({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const { mortgage, projects, homePLConfig } = useAppContext();
  const [open, setOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState(10);
  const [customRate, setCustomRate] = useState('');
  const [showHow, setShowHow] = useState(false);
  const [showCaveats, setShowCaveats] = useState(false);

  const completedProjects = projects.filter(p => p.status === 'Complete');

  const activeRate = customRate !== '' ? parseFloat(customRate) || 0 : selectedRate;

  const result = useMemo(() =>
    calculateRentInvest(activeRate, d.monthsOwned, d.downPayment, mortgage, homePLConfig, completedProjects, d.wealthBuilt, d.sunkCost, d.purchaseDate),
    [activeRate, d.monthsOwned, d.downPayment, d.wealthBuilt, d.sunkCost, d.purchaseDate, mortgage, homePLConfig, completedProjects]
  );

  const baseResult = useMemo(() =>
    scenarioActive ? calculateRentInvest(activeRate, b.monthsOwned, b.downPayment, mortgage, homePLConfig, completedProjects, b.wealthBuilt, b.sunkCost, b.purchaseDate) : result,
    [activeRate, b, scenarioActive, mortgage, homePLConfig, completedProjects, result]
  );

  // Preview at 10% for collapsed state
  const preview10 = useMemo(() =>
    calculateRentInvest(10, d.monthsOwned, d.downPayment, mortgage, homePLConfig, completedProjects, d.wealthBuilt, d.sunkCost, d.purchaseDate),
    [d, mortgage, homePLConfig, completedProjects]
  );

  const sensitivity = useMemo(() =>
    calculateSensitivityTable(SENSITIVITY_RATES, d.monthsOwned, d.downPayment, mortgage, homePLConfig, completedProjects, d.wealthBuilt, d.sunkCost, d.purchaseDate),
    [d, mortgage, homePLConfig, completedProjects]
  );

  const owningWinsPreview = preview10.ownershipMargin >= 0;
  const owningWins = result.ownershipMargin >= 0;
  const margin = Math.abs(result.ownershipMargin);

  const handlePillClick = (rate: number) => {
    setSelectedRate(rate);
    setCustomRate('');
  };

  const handleCustomChange = (val: string) => {
    setCustomRate(val);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full rounded-xl border border-border bg-primary/5 px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-primary/8 transition-colors">
          <span className="text-[14px] font-medium text-foreground">The full picture: own vs. rent + invest</span>
          <div className="flex items-center gap-2">
            <span className={`text-[14px] font-bold ${owningWinsPreview ? 'text-success' : 'text-warning'}`}>
              At 10% return: {owningWinsPreview ? 'Owning wins' : 'Rent + invest wins'} by +{formatCurrency(Math.abs(preview10.ownershipMargin))}
            </span>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="rounded-b-xl border border-t-0 border-border bg-card px-3 py-2.5 space-y-2.5">
          {/* Section A — Rate selector */}
          <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
            <span className="text-[12px] text-muted-foreground">Market return assumption:</span>
            <div className="flex gap-1.5">
              {PRESET_RATES.map(r => (
                <button
                  key={r}
                  onClick={() => handlePillClick(r)}
                  className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium transition-colors ${
                    customRate === '' && selectedRate === r
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {r}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              <Input
                type="number"
                value={customRate}
                onChange={e => handleCustomChange(e.target.value)}
                placeholder="Custom"
                className="w-[50px] h-6 text-[12px] px-1.5 py-0"
              />
              <span className="text-[12px] text-muted-foreground">%</span>
            </div>
            <button onClick={() => setShowHow(!showHow)} className="text-[11px] text-primary hover:underline ml-auto">
              {showHow ? 'Got it' : 'How this works?'}
            </button>
          </div>

          {/* Section B — How this works */}
          {showHow && (
            <div className="bg-muted/50 rounded-lg px-2 py-2 text-[12px] text-muted-foreground leading-[1.4]">
              On your purchase date, instead of buying, you invest your {formatCurrency(d.downPayment)} down payment.
              Each month you pay {formatCurrency(result.monthlyRent)} rent instead of ~{formatCurrency(result.monthlyOwnerCost)} in mortgage + tax + insurance + maintenance,
              and invest the {formatCurrency(result.monthlySavings)} monthly savings plus any renovation costs you avoid.
              Portfolio grows at the selected return rate, compounded monthly.
              <button onClick={() => setShowHow(false)} className="text-primary hover:underline ml-1">Got it</button>
            </div>
          )}

          {/* Section C — Side-by-side comparison */}
          <div className="grid grid-cols-[55%_45%]">
            {/* Owner column */}
            <div className="pr-3 space-y-2.5">
              <p className="text-[12px] font-semibold tracking-wide uppercase text-muted-foreground">You (homeowner)</p>
              <div>
                <p className="text-[11px] text-muted-foreground">Home equity</p>
                <p className="text-[20px] font-medium text-success leading-tight">
                  {formatCurrency(d.wealthBuilt)}
                  <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Sunk cost</p>
                <p className="text-[14px] text-destructive/70">{formatCurrency(d.sunkCost)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Net wealth</p>
                <p className="text-[14px] font-medium">
                  {formatCurrency(d.wealthBuilt)}
                  <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
                </p>
              </div>
              <span className="inline-block text-[10px] bg-muted rounded px-2 py-0.5 text-muted-foreground">Illiquid · tax-advantaged</span>
            </div>

            {/* Renter column */}
            <div className="pl-3 border-l border-border/50 space-y-2.5">
              <p className="text-[12px] font-semibold tracking-wide uppercase text-muted-foreground">If you rented + invested at {activeRate}%</p>
              <div>
                <p className="text-[11px] text-muted-foreground">Portfolio value</p>
                <p className="text-[20px] font-medium text-primary leading-tight">{formatCurrency(result.portfolioValue)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Rent paid (sunk)</p>
                <p className="text-[14px] text-destructive/70">{formatCurrency(result.totalRentPaid)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Net wealth</p>
                <p className="text-[14px] font-medium">{formatCurrency(result.portfolioValue)}</p>
              </div>
              <span className="inline-block text-[10px] bg-muted rounded px-2 py-0.5 text-muted-foreground">Liquid · taxable gains</span>
            </div>
          </div>

          {/* Section D — Verdict */}
          <div className={`rounded-lg px-4 py-2.5 text-center ${owningWins ? 'bg-success/10' : 'bg-warning/10'}`}>
            <p className={`text-[18px] font-medium ${owningWins ? 'text-success' : 'text-warning'}`}>
              {owningWins ? `Owning wins by +${formatCurrency(margin)}` : `Renting + investing wins by +${formatCurrency(margin)} at ${activeRate}% return`}
              {scenarioActive && (
                <ScenarioDelta scenarioVal={result.ownershipMargin} baseVal={baseResult.ownershipMargin} active={scenarioActive} />
              )}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {owningWins
                ? 'Your home equity exceeds what a disciplined renter-investor would have built'
                : 'However, home equity is tax-advantaged and builds forced savings discipline'}
            </p>
          </div>

          {/* Section E — Sensitivity table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Return</th>
                  <th className="text-right py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Renter portfolio</th>
                  <th className="text-right py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Your equity</th>
                  <th className="text-center py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Winner</th>
                  <th className="text-right py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Margin</th>
                </tr>
              </thead>
              <tbody>
                {sensitivity.map(row => {
                  const isActive = row.rate === activeRate;
                  const wins = row.ownershipMargin >= 0;
                  return (
                    <tr
                      key={row.rate}
                      className={`border-b border-border/30 h-7 ${isActive ? 'border-l-[3px] border-l-primary font-semibold' : ''}`}
                    >
                      <td className="py-0.5 px-1.5">{row.rate}%</td>
                      <td className="py-0.5 px-1.5 text-right">{formatCurrency(row.portfolioValue)}</td>
                      <td className="py-0.5 px-1.5 text-right">
                        {formatCurrency(d.wealthBuilt)}
                        {scenarioActive && <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />}
                      </td>
                      <td className="py-0.5 px-1.5 text-center">
                        <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${
                          wins ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                        }`}>
                          {wins ? 'Own' : 'Rent'}
                        </span>
                      </td>
                      <td className={`py-0.5 px-1.5 text-right ${wins ? 'text-success' : 'text-warning'}`}>
                        +{formatCurrency(Math.abs(row.ownershipMargin))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Section F — Caveats */}
          <Collapsible open={showCaveats} onOpenChange={setShowCaveats}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors w-full">
                Important caveats
                {showCaveats ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ol className="text-[11px] text-muted-foreground leading-[1.4] list-decimal pl-4 space-y-0.5 mt-1">
                <li>Home equity is illiquid — requires selling or HELOC to access. Portfolio is fully liquid.</li>
                <li>Up to $500K in home capital gains excluded for married couples. Investment gains taxed at 15-20%.</li>
                <li>Model assumes renter-investor invests every saved dollar monthly. Lifestyle inflation typically erodes this discipline.</li>
                <li>Rent assumed flat at {formatCurrency(homePLConfig.estimatedMonthlyRent)}/mo. Actual rents increase 3-5% annually, reducing monthly savings over time.</li>
                <li>Mortgage forces savings through mandatory payments. Investing requires active monthly discipline.</li>
              </ol>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
