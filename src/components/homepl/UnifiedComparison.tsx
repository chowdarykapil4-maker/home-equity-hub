import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { calculateRentInvest, calculateSensitivityTable } from '@/lib/rentInvest';
import { calculateTaxAdjusted, calculateTaxAdjustedSensitivity } from '@/lib/taxCalcs';
import { calculateBreakevenTimeline } from '@/lib/breakeven';
import { HomePLData } from '@/hooks/useHomePL';
import { useAppContext } from '@/context/AppContext';
import ScenarioDelta from './ScenarioDelta';
import { HelpTip, HelpPopover } from './HelpTip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

interface Props {
  d: HomePLData;
  baseD?: HomePLData;
  scenarioActive?: boolean;
}

type ViewMode = 'simple' | 'investing' | 'aftertax';
const PRESET_RATES = [7, 8, 10, 12];
const SENSITIVITY_RATES = [7, 8, 10, 12, 15];

export default function UnifiedComparison({ d, baseD, scenarioActive = false }: Props) {
  const b = baseD || d;
  const { mortgage, projects, homePLConfig } = useAppContext();
  const [viewMode, setViewMode] = useState<ViewMode>('aftertax');
  const [selectedRate, setSelectedRate] = useState(10);
  const [customRate, setCustomRate] = useState('');
  const [showHow, setShowHow] = useState(false);
  const [showCaveats, setShowCaveats] = useState(false);
  const [showYearlyTable, setShowYearlyTable] = useState(false);

  const tax = homePLConfig.tax;
  const completedProjects = projects.filter(p => p.status === 'Complete');
  const activeRate = customRate !== '' ? parseFloat(customRate) || 0 : selectedRate;
  const afterTax = viewMode === 'aftertax';

  const result = useMemo(() =>
    calculateRentInvest(activeRate, d.monthsOwned, d.downPayment, mortgage, homePLConfig, completedProjects, d.wealthBuilt, d.sunkCost, d.purchaseDate, d.resolvedRent),
    [activeRate, d.monthsOwned, d.downPayment, d.wealthBuilt, d.sunkCost, d.purchaseDate, d.resolvedRent, mortgage, homePLConfig, completedProjects]
  );

  const baseResult = useMemo(() =>
    scenarioActive ? calculateRentInvest(activeRate, b.monthsOwned, b.downPayment, mortgage, homePLConfig, completedProjects, b.wealthBuilt, b.sunkCost, b.purchaseDate, b.resolvedRent) : result,
    [activeRate, b, scenarioActive, mortgage, homePLConfig, completedProjects, result]
  );

  const taxAdj = useMemo(() => calculateTaxAdjusted(d, result, tax), [d, result, tax]);
  const baseTaxAdj = useMemo(() =>
    scenarioActive ? calculateTaxAdjusted(b, baseResult, tax) : taxAdj,
    [b, baseResult, scenarioActive, tax, taxAdj]
  );

  const makeRI = (rate: number) => calculateRentInvest(rate, d.monthsOwned, d.downPayment, mortgage, homePLConfig, completedProjects, d.wealthBuilt, d.sunkCost, d.purchaseDate);
  const sensitivity = useMemo(() =>
    calculateTaxAdjustedSensitivity(SENSITIVITY_RATES, d, makeRI, tax),
    [d, mortgage, homePLConfig, completedProjects, tax]
  );

  const breakeven = useMemo(() =>
    calculateBreakevenTimeline(d.downPayment, d.purchasePrice, mortgage, homePLConfig, tax, activeRate, d.totalRenoValueAdded, 15),
    [d.downPayment, d.purchasePrice, mortgage, homePLConfig, tax, activeRate, d.totalRenoValueAdded]
  );

  // Margins
  const currentMargin = afterTax ? taxAdj.afterTaxMargin : result.ownershipMargin;
  const owningWins = currentMargin >= 0;
  const margin = Math.abs(currentMargin);

  // Simple mode margin
  const simpleMargin = d.ownershipAdvantage;

  // Preview (for collapsed header)
  const preview10 = useMemo(() =>
    calculateRentInvest(10, d.monthsOwned, d.downPayment, mortgage, homePLConfig, completedProjects, d.wealthBuilt, d.sunkCost, d.purchaseDate),
    [d, mortgage, homePLConfig, completedProjects]
  );
  const preview10Tax = useMemo(() => calculateTaxAdjusted(d, preview10, tax), [d, preview10, tax]);
  const previewMargin = afterTax ? preview10Tax.afterTaxMargin : preview10.ownershipMargin;
  const owningWinsPreview = previewMargin >= 0;

  const handlePillClick = (rate: number) => { setSelectedRate(rate); setCustomRate(''); };

  // Bar percentages for visual header
  const ownerEquityPct = d.wealthBuilt > 0 && d.totalCashOut > 0 ? (d.wealthBuilt / d.totalCashOut) * 100 : 0;
  const ownerSunkPct = d.totalCashOut > 0 ? (d.sunkCost / d.totalCashOut) * 100 : 0;
  const renterFillPct = d.totalCashOut > 0 ? (d.totalRentWouldHavePaid / d.totalCashOut) * 100 : 50;

  return (
    <div className="rounded-xl border border-border bg-card px-5 py-3 space-y-2.5">
      {/* Header with tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-[14px] font-medium text-foreground">You vs. the alternative</p>
        <div className="flex items-center gap-1.5">
          {([
            { key: 'simple' as const, label: 'Simple' },
            { key: 'investing' as const, label: 'With investing' },
            { key: 'aftertax' as const, label: 'After tax' },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setViewMode(tab.key)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
                viewMode === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      {/* Visual header — horizontal bars */}
      <div className="grid grid-cols-1 sm:grid-cols-[60%_40%] gap-2">
        {/* Owner bar */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">You (owner)</p>
          <div className="h-7 rounded-lg overflow-hidden flex">
            <div className="bg-success/70 flex items-center justify-center" style={{ width: `${Math.min(ownerEquityPct, 100)}%`, minWidth: 0 }}>
              {ownerEquityPct > 15 && <span className="text-[10px] font-semibold text-success-foreground whitespace-nowrap px-1">{formatCurrency(d.wealthBuilt)}</span>}
            </div>
            <div className="bg-destructive/50 flex items-center justify-center" style={{ width: `${Math.min(ownerSunkPct, 100)}%`, minWidth: 0 }}>
              {ownerSunkPct > 15 && <span className="text-[10px] font-semibold text-destructive-foreground whitespace-nowrap px-1">{formatCurrency(d.sunkCost)}</span>}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{formatCurrency(d.totalCashOut)} spent → {formatCurrency(d.wealthBuilt)} equity</p>
        </div>

        {/* Renter bar */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-muted-foreground">If you rented</p>
          <div className="h-7 rounded-lg overflow-hidden bg-muted/30">
            <div className="bg-destructive/50 flex items-center justify-center h-full" style={{ width: `${Math.min(renterFillPct, 100)}%` }}>
              {renterFillPct > 15 && <span className="text-[10px] font-semibold text-destructive-foreground whitespace-nowrap px-1">{formatCurrency(d.totalRentWouldHavePaid)}</span>}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">{formatCurrency(d.totalRentWouldHavePaid)} spent → $0 equity</p>
        </div>
      </div>

      {/* SIMPLE VIEW */}
      {viewMode === 'simple' && (
        <p className="text-[13px] text-center text-muted-foreground py-1">
          You spent {formatCurrency(Math.abs(d.totalCashOut - d.totalRentWouldHavePaid))} more but built {formatCurrency(Math.max(0, d.wealthBuilt))} in equity →{' '}
          <span className={`font-bold ${simpleMargin >= 0 ? 'text-success' : 'text-destructive'}`}>
            Net: {simpleMargin >= 0 ? '+' : ''}{formatCurrency(simpleMargin)}
            <ScenarioDelta scenarioVal={d.ownershipAdvantage} baseVal={b.ownershipAdvantage} active={scenarioActive} />
          </span>
        </p>
      )}

      {/* INVESTING / AFTER-TAX VIEW */}
      {(viewMode === 'investing' || viewMode === 'aftertax') && (
        <div className="space-y-2.5">
          {/* Rate selector */}
          <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-border/50">
            <span className="text-[12px] text-muted-foreground">Market return:</span>
            <div className="flex gap-1.5">
              {PRESET_RATES.map(r => (
                <button key={r} onClick={() => handlePillClick(r)}
                  className={`px-2.5 py-0.5 rounded-full text-[12px] font-medium transition-colors ${
                    customRate === '' && selectedRate === r ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}>{r}%</button>
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              <Input type="number" value={customRate} onChange={e => setCustomRate(e.target.value)} placeholder="Custom" className="w-[50px] h-6 text-[12px] px-1.5 py-0" />
              <span className="text-[12px] text-muted-foreground">%</span>
            </div>
            <button onClick={() => setShowHow(!showHow)} className="text-[11px] text-primary hover:underline ml-auto">
              {showHow ? 'Got it' : 'How this works?'}
            </button>
          </div>

          {showHow && (
            <div className="bg-muted/50 rounded-lg px-2 py-2 text-[12px] text-muted-foreground leading-[1.4]">
              On your purchase date, instead of buying, you invest your {formatCurrency(d.downPayment)} down payment.
              Each month you pay {formatCurrency(result.monthlyRent)} rent instead of ~{formatCurrency(result.monthlyOwnerCost)} in mortgage + tax + insurance + maintenance,
              and invest the {formatCurrency(result.monthlySavings)} monthly savings plus any renovation costs you avoid.
              Portfolio grows at the selected return rate, compounded monthly.
              {afterTax && ' After-tax view accounts for mortgage interest deduction, property tax deduction (SALT-limited), capital gains exclusion on home sale, and investment tax drag.'}
              <button onClick={() => setShowHow(false)} className="text-primary hover:underline ml-1">Got it</button>
            </div>
          )}

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-[55%_45%]">
            {/* Owner column */}
            <div className="pr-3 space-y-0.5">
              <p className="text-[12px] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5">
                You (homeowner){afterTax ? ' — after tax' : ''}
              </p>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-0">Home equity</p>
                <span className="text-[18px] font-medium text-success leading-tight">
                  <HelpTip plain="If you sold today and paid off the mortgage, this is roughly what you'd pocket (before selling costs)" math={`Home value (${formatCurrency(d.currentHomeValue)}) − mortgage balance (${formatCurrency(d.currentBalance)}) = ${formatCurrency(d.wealthBuilt)}`}>
                    {formatCurrency(d.wealthBuilt)}
                  </HelpTip>
                  <ScenarioDelta scenarioVal={d.wealthBuilt} baseVal={b.wealthBuilt} active={scenarioActive} />
                </span>
              </div>
              {afterTax && (
                <div>
                  <p className="text-[11px] text-muted-foreground leading-none mb-0">Tax benefits</p>
                  <HelpPopover content={
                    <div className="space-y-2">
                      <p className="font-medium text-[13px]">Real money you got back from the IRS because you own a home</p>
                      <div className="border-t border-border pt-1.5 space-y-1 text-muted-foreground">
                        <p>Mortgage interest deduction: +{formatCurrency(taxAdj.owner.interestDeductionSavings)}</p>
                        <p className="text-[10px]">Deducted {formatCurrency(d.interestPaid)} interest at {(tax.federalRate + tax.stateRate).toFixed(1)}% rate</p>
                        <p>Property tax deduction: +{formatCurrency(taxAdj.owner.propertyTaxDeductionSavings)}</p>
                        <p className="text-[10px]">Deducted ${(Math.min(d.totalPropertyTax / Math.max(d.yearsOwned, 1), tax.saltCap)).toLocaleString()}/yr (SALT cap) at {(tax.federalRate + tax.stateRate).toFixed(1)}% rate</p>
                        <div className="border-t border-border pt-1 mt-1">
                          <p>Cap gains exclusion at sale: +{formatCurrency(taxAdj.owner.capGainsExclusionBenefit)}</p>
                          <p className="text-[10px]">Up to ${tax.filingStatus === 'Single' ? '250' : '500'}K profit tax-free. Your appreciation (~{formatCurrency(d.marketAppreciation + d.totalRenoValueAdded)}) × stock tax rate (~{(tax.capitalGainsRate + tax.stateCapGainsRate).toFixed(1)}%) = ~{formatCurrency(taxAdj.owner.capGainsExclusionBenefit)} saved</p>
                        </div>
                      </div>
                    </div>
                  }>
                    <span className="text-[13px] text-success/80 leading-tight">
                      +{formatCurrency(taxAdj.owner.totalTaxSavingsRealized)} realized · +{formatCurrency(taxAdj.owner.capGainsExclusionBenefit)} at sale
                    </span>
                  </HelpPopover>
                </div>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-0">{afterTax ? 'After-tax sunk cost' : 'Sunk cost'}</p>
                <HelpTip plain="Total money spent that you can never recover, reduced by tax savings from deductions" math={afterTax ? `Pre-tax sunk (${formatCurrency(d.sunkCost)}) − tax savings (${formatCurrency(taxAdj.owner.totalTaxSavingsRealized)}) = ${formatCurrency(taxAdj.owner.afterTaxSunkCost)}` : `Interest + property tax + net reno cost + insurance + maintenance`}>
                  <span className="text-[13px] text-destructive/70 leading-tight">{formatCurrency(afterTax ? taxAdj.owner.afterTaxSunkCost : d.sunkCost)}</span>
                </HelpTip>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-0">{afterTax ? 'Effective net wealth' : 'Net wealth'}</p>
                <HelpTip plain={afterTax ? "Your net wealth from this home including tax benefits already received" : `Your total wealth from this home built over ${d.monthsOwned} months of ownership`}>
                  <span className="text-[13px] font-medium leading-tight">{formatCurrency(afterTax ? taxAdj.owner.effectiveNetWealth : d.wealthBuilt)}</span>
                </HelpTip>
                <ScenarioDelta scenarioVal={afterTax ? taxAdj.owner.effectiveNetWealth : d.wealthBuilt} baseVal={afterTax ? baseTaxAdj.owner.effectiveNetWealth : b.wealthBuilt} active={scenarioActive} />
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                <HelpTip plain="Home equity is locked up until you sell or take a HELOC. But up to $500K in profit is tax-free for married couples when you sell.">
                  <span>Illiquid · tax-advantaged</span>
                </HelpTip>
                {afterTax && <span className="text-success/60"> — Interest: +{formatCurrency(taxAdj.owner.interestDeductionSavings)} | Prop tax: +{formatCurrency(taxAdj.owner.propertyTaxDeductionSavings)} | Cap gains: +{formatCurrency(taxAdj.owner.capGainsExclusionBenefit)}</span>}
              </p>
            </div>

            {/* Renter column */}
            <div className="pl-3 border-l border-border/50 space-y-0.5 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0">
              <p className="text-[12px] font-semibold tracking-wide uppercase text-muted-foreground mb-0.5">
                If you rented + invested at {activeRate}%{afterTax ? ' — after tax' : ''}
              </p>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-0">Portfolio value{afterTax ? ' (pre-tax)' : ''}</p>
                <span className={`text-[18px] font-medium text-primary leading-tight ${afterTax ? 'line-through opacity-50' : ''}`}>
                  <HelpTip plain={`If you invested your ${formatCurrency(d.downPayment)} down payment plus saved ${formatCurrency(result.monthlySavings)} every month at ${activeRate}% return`} math={`${formatCurrency(d.downPayment)} initial + ${formatCurrency(result.monthlySavings)}/mo × ${d.monthsOwned} months, compounded at ${activeRate}%`}>
                    {formatCurrency(result.portfolioValue)}
                  </HelpTip>
                </span>
              </div>
              {afterTax && (
                <>
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-none mb-0">Tax drag</p>
                    <HelpTip plain="If the renter sold stocks today, they'd owe this in capital gains tax plus annual dividend tax drag" math={`Cap gains (${formatCurrency(taxAdj.renter.capitalGainsTax)}) + dividends (${formatCurrency(taxAdj.renter.dividendTaxDrag)}) = ${formatCurrency(taxAdj.renter.capitalGainsTax + taxAdj.renter.dividendTaxDrag)}`}>
                      <span className="text-[13px] text-destructive/70 leading-tight">
                        -{formatCurrency(taxAdj.renter.capitalGainsTax + taxAdj.renter.dividendTaxDrag)} total
                        <span className="text-[10px] text-muted-foreground ml-1">(cap gains -{formatCurrency(taxAdj.renter.capitalGainsTax)} + dividends -{formatCurrency(taxAdj.renter.dividendTaxDrag)})</span>
                      </span>
                    </HelpTip>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground leading-none mb-0">After-tax portfolio</p>
                    <span className="text-[18px] font-medium text-primary leading-tight">{formatCurrency(taxAdj.renter.afterTaxPortfolio)}</span>
                  </div>
                </>
              )}
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-0">Rent paid (sunk)</p>
                <HelpTip plain={`Total rent over ${d.monthsOwned} months. Every dollar is sunk — you own nothing at the end.`} math={`${formatCurrency(result.monthlyRent)}/mo × ${d.monthsOwned} months`}>
                  <span className="text-[13px] text-destructive/70 leading-tight">{formatCurrency(result.totalRentPaid)}</span>
                </HelpTip>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground leading-none mb-0">{afterTax ? 'After-tax net wealth' : 'Net wealth'}</p>
                <HelpTip plain={afterTax ? "Renter-investor's total wealth — all in stocks, reduced by capital gains and dividend taxes" : "Renter-investor's total wealth — all in stocks, fully liquid but subject to capital gains taxes when sold"}>
                  <span className="text-[13px] font-medium leading-tight">{formatCurrency(afterTax ? taxAdj.renter.afterTaxNetWealth : result.portfolioValue)}</span>
                </HelpTip>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                <HelpTip plain="Stocks can be sold anytime, but you pay 15-28% tax on profits. No tax-free exclusion like home sales get.">
                  <span>Liquid · taxable gains</span>
                </HelpTip>
                {afterTax && <span className="text-destructive/60"> — Cap gains: −{formatCurrency(taxAdj.renter.capitalGainsTax)} | Dividends: −{formatCurrency(taxAdj.renter.dividendTaxDrag)}</span>}
              </p>
            </div>
          </div>

          {/* Verdict */}
          <div className={`rounded-lg px-4 py-2.5 text-center ${owningWins ? 'bg-success/10' : 'bg-warning/10'}`}>
            <HelpPopover content={
              <div className="space-y-2">
                <p className="font-medium text-[13px]">
                  {owningWins
                    ? `After accounting for all costs${afterTax ? ', taxes,' : ''} and wealth built — owning put you ${formatCurrency(margin)} ahead`
                    : `At ${activeRate}% return, a disciplined renter-investor would have ${formatCurrency(margin)} more total wealth`}
                </p>
                <div className="border-t border-border pt-1.5 space-y-0.5 text-muted-foreground">
                  <p>Your wealth{afterTax ? ' (after tax)' : ''}: {formatCurrency(afterTax ? taxAdj.owner.effectiveNetWealth : d.wealthBuilt)}</p>
                  <p>Renter wealth{afterTax ? ' (after tax)' : ''}: {formatCurrency(afterTax ? taxAdj.renter.afterTaxNetWealth : result.portfolioValue)}</p>
                  <p className="font-medium text-foreground">Difference: {owningWins ? '+' : '-'}{formatCurrency(margin)} {owningWins ? 'in your favor' : 'for the renter'}</p>
                </div>
                {afterTax && owningWins && (
                  <div className="bg-success/10 rounded p-1.5 text-[11px]">
                    <p className="font-medium text-foreground">Why owning wins after taxes:</p>
                    <p className="text-muted-foreground">You saved ~{formatCurrency(taxAdj.owner.totalTaxSavingsRealized)} in tax deductions, and your {formatCurrency(d.marketAppreciation + d.totalRenoValueAdded)} in appreciation is tax-free. The renter would owe ~{formatCurrency(taxAdj.renter.capitalGainsTax)} in capital gains tax.</p>
                  </div>
                )}
              </div>
            }>
              <p className={`text-[18px] font-medium ${owningWins ? 'text-success' : 'text-warning'}`}>
                {afterTax ? 'After taxes, ' : ''}{owningWins ? `Owning wins by +${formatCurrency(margin)}` : `Renting + investing wins by +${formatCurrency(margin)} at ${activeRate}%`}
                {scenarioActive && <ScenarioDelta scenarioVal={currentMargin} baseVal={afterTax ? baseTaxAdj.afterTaxMargin : baseResult.ownershipMargin} active={scenarioActive} />}
              </p>
            </HelpPopover>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {owningWins
                ? (afterTax ? 'Tax advantages make homeownership significantly more competitive' : 'Your home equity exceeds what a disciplined renter-investor would have built')
                : 'However, home equity is tax-advantaged and builds forced savings discipline'}
            </p>
          </div>

          {/* Sensitivity table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Return</th>
                  <th className="text-right py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Renter{afterTax ? ' (pre)' : ''}</th>
                  {afterTax && <th className="text-right py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Renter (after)</th>}
                  <th className="text-right py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Your equity{afterTax ? ' (after)' : ''}</th>
                  <th className="text-center py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Winner</th>
                  <th className="text-right py-1 px-1.5 text-[11px] font-medium uppercase text-muted-foreground">Margin</th>
                </tr>
              </thead>
              <tbody>
                {sensitivity.map(row => {
                  const isActive = row.rate === activeRate;
                  const rowMargin = afterTax ? row.afterTax.afterTaxMargin : row.preTax.ownershipMargin;
                  const wins = rowMargin >= 0;
                  const ownerWealth = afterTax ? row.afterTax.owner.effectiveNetWealth : d.wealthBuilt;
                  return (
                    <tr key={row.rate} className={`border-b border-border/30 h-7 ${isActive ? 'border-l-[3px] border-l-primary font-semibold' : ''}`}>
                      <td className="py-0.5 px-1.5">{row.rate}%</td>
                      <td className="py-0.5 px-1.5 text-right">{formatCurrency(row.preTax.portfolioValue)}</td>
                      {afterTax && <td className="py-0.5 px-1.5 text-right">{formatCurrency(row.afterTax.renter.afterTaxPortfolio)}</td>}
                      <td className="py-0.5 px-1.5 text-right">
                        {formatCurrency(ownerWealth)}
                        {scenarioActive && <ScenarioDelta scenarioVal={ownerWealth} baseVal={afterTax ? baseTaxAdj.owner.effectiveNetWealth : b.wealthBuilt} active={scenarioActive} />}
                      </td>
                      <td className="py-0.5 px-1.5 text-center">
                        <HelpTip plain={wins ? "At this return rate, your home equity exceeds what the renter-investor would have." : "At this rate, a perfectly disciplined renter-investor would have more. But this assumes investing every saved dollar — most people don't."}>
                          <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${wins ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                            {wins ? 'Own' : 'Rent'}
                          </span>
                        </HelpTip>
                      </td>
                      <td className={`py-0.5 px-1.5 text-right ${wins ? 'text-success' : 'text-warning'}`}>
                        <HelpTip plain={wins ? "You're ahead by this amount at this return rate." : "Renter-investor ahead, but home equity is tax-advantaged and rent increases over time."}>
                          +{formatCurrency(Math.abs(rowMargin))}
                        </HelpTip>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Breakeven Timeline */}
          <div className="border-t border-border/50 pt-2.5">
            <p className="text-[13px] font-medium text-foreground mb-2">Ownership breakeven timeline</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={breakeven.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} width={55} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={l => `Year ${l}`} />
                  <Area type="monotone" dataKey="owner" name="Homeowner (after-tax)" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.1} strokeWidth={2} />
                  <Area type="monotone" dataKey="renter" name="Renter-investor (after-tax)" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                  {Math.floor(d.yearsOwned) > 0 && Math.floor(d.yearsOwned) <= 15 && (
                    <ReferenceLine x={Math.floor(d.yearsOwned)} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: 'Today', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  )}
                  {breakeven.crossoverYear && breakeven.crossoverYear <= 15 && (
                    <ReferenceLine x={breakeven.crossoverYear} stroke="hsl(var(--success))" strokeDasharray="2 2" label={{ value: `Breakeven Yr ${breakeven.crossoverYear}`, fontSize: 10, fill: 'hsl(var(--success))' }} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className={`text-[12px] mt-1 ${breakeven.crossoverYear && breakeven.crossoverYear <= Math.ceil(d.yearsOwned) ? 'text-success' : breakeven.crossoverYear ? 'text-primary' : 'text-warning'}`}>
              <HelpTip plain={
                breakeven.crossoverYear && breakeven.crossoverYear <= Math.ceil(d.yearsOwned)
                  ? "Already past breakeven — every additional year widens your advantage."
                  : breakeven.crossoverYear
                    ? "Not yet crossed, but amortization works in your favor — more principal, less interest each year."
                    : `At ${activeRate}% return, renting + investing stays ahead through Year 15.`
              }>
                {breakeven.crossoverYear
                  ? (breakeven.crossoverYear <= Math.ceil(d.yearsOwned)
                    ? `Owning has been winning since Year ${breakeven.crossoverYear}. After 15 years, the ownership advantage grows to +${formatCurrency(Math.abs(breakeven.yearlyData[14]?.margin || 0))}`
                    : `Owning catches up in Year ${breakeven.crossoverYear}. Keep holding — the amortization shift and tax advantages accelerate from here.`)
                  : `At ${activeRate}% market return, renting + investing remains ahead through Year 15.`}
              </HelpTip>
            </p>
          </div>

          {/* Year-by-year table */}
          <Collapsible open={showYearlyTable} onOpenChange={setShowYearlyTable}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors w-full">
                Show year-by-year projection
                {showYearlyTable ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto mt-1">
                <table className="w-full text-[12px]">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border/50">
                      <th className="text-left py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Yr</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Owner equity</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Tax savings</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Owner wealth</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Renter portfolio</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Tax drag</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Renter wealth</th>
                      <th className="text-center py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Winner</th>
                      <th className="text-right py-1 px-1 text-[10px] font-medium uppercase text-muted-foreground">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakeven.yearlyData.map(row => {
                      const isCurrent = row.year === Math.ceil(d.yearsOwned);
                      const isCrossover = row.year === breakeven.crossoverYear;
                      return (
                        <tr key={row.year}
                          className={`h-6 border-b border-border/20 ${row.year % 2 === 0 ? 'bg-muted/20' : ''} ${isCrossover ? 'border-l-[3px] border-l-success font-semibold' : ''} ${isCurrent ? 'border-l-[3px] border-l-primary font-semibold' : ''}`}>
                          <td className="py-0.5 px-1">{row.year}</td>
                          <td className="py-0.5 px-1 text-right">{formatCurrency(row.ownerEquity)}</td>
                          <td className="py-0.5 px-1 text-right text-success/70">{formatCurrency(row.ownerTaxSavings)}</td>
                          <td className="py-0.5 px-1 text-right">{formatCurrency(row.ownerAfterTaxWealth)}</td>
                          <td className="py-0.5 px-1 text-right">{formatCurrency(row.renterPortfolio)}</td>
                          <td className="py-0.5 px-1 text-right text-destructive/70">{formatCurrency(row.renterTaxDrag)}</td>
                          <td className="py-0.5 px-1 text-right">{formatCurrency(row.renterAfterTaxWealth)}</td>
                          <td className="py-0.5 px-1 text-center">
                            <span className={`inline-block text-[10px] px-1.5 rounded-full ${row.winner === 'Own' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                              {row.winner}
                            </span>
                          </td>
                          <td className={`py-0.5 px-1 text-right ${row.margin >= 0 ? 'text-success' : 'text-warning'}`}>
                            {row.margin >= 0 ? '+' : ''}{formatCurrency(Math.abs(row.margin))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Caveats */}
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
                <li>Up to ${(tax.filingStatus === 'Single' ? '250' : '500')}K in home capital gains excluded. Investment gains taxed at {tax.capitalGainsRate + tax.stateCapGainsRate}%.</li>
                <li>Model assumes renter-investor invests every saved dollar monthly. Lifestyle inflation typically erodes this discipline.</li>
                <li>Rent assumed flat at {formatCurrency(homePLConfig.estimatedMonthlyRent)}/mo for historical; forward projection uses {tax.annualRentIncrease}% annual increase.</li>
                <li>Mortgage forces savings through mandatory payments. Investing requires active monthly discipline.</li>
                {afterTax && <li>Tax calculations use simplified assumptions. Actual tax liability depends on total income, deductions, AMT, and other factors.</li>}
              </ol>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
