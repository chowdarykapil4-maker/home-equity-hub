import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatPercent } from '@/lib/format';
import { HomePLData } from '@/hooks/useHomePL';
import { HelpTip } from './HelpTip';
import { useAppContext } from '@/context/AppContext';

interface Props {
  d: HomePLData;
  scenarioPercent: number;
  defaultOpen?: boolean;
}

interface HoldRow {
  label: string;
  years: number;
  homeValue: number;
  mortgageBalance: number;
  netProceeds: number;
  returnPct: number;
}

export default function IfYouSoldToday({ d, scenarioPercent }: Props) {
  const { mortgage, mortgagePayments, homePLConfig } = useAppContext();
  const [open, setOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);

  // Sale price slider: -10% to +20%, default to scenario % clamped into that range
  const defaultSalePct = Math.max(-10, Math.min(20, scenarioPercent));
  const [salePct, setSalePct] = useState(defaultSalePct);

  // Editable cost inputs
  const [commissionPct, setCommissionPct] = useState(5);
  const [closingPct, setClosingPct] = useState(1.5);
  const [transferPct, setTransferPct] = useState(0.68);
  const [helocBalance, setHelocBalance] = useState(0);

  const appreciationRate = homePLConfig.tax?.annualAppreciation || 3;
  const taxConfig = homePLConfig.tax;

  const salePrice = Math.round(d.currentHomeValue * (1 + salePct / 100));

  const calc = useMemo(() => {
    const mortgagePayoff = d.currentBalance;
    const commission = Math.round(salePrice * (commissionPct / 100));
    const closing = Math.round(salePrice * (closingPct / 100));
    const transfer = Math.round(salePrice * (transferPct / 100));

    // Capital gains
    const gain = salePrice - d.purchasePrice - d.totalRenoSpend;
    const exclusionLimit = taxConfig?.filingStatus === 'Single' ? 250000
      : taxConfig?.filingStatus === 'Head of Household' ? 250000
      : 500000;
    const taxableGain = Math.max(0, gain - exclusionLimit);
    const capGainsRate = ((taxConfig?.capitalGainsRate || 15) + (taxConfig?.stateCapGainsRate || 9.3)) / 100;
    const capGainsTax = Math.round(taxableGain * capGainsRate);

    const totalDeductions = mortgagePayoff + commission + closing + transfer + capGainsTax + helocBalance;
    const netProceeds = salePrice - totalDeductions;
    const returnPct = d.totalCashOut > 0 ? ((netProceeds - d.totalCashOut) / d.totalCashOut) * 100 : 0;

    return {
      mortgagePayoff, commission, closing, transfer,
      gain, exclusionLimit, taxableGain, capGainsTax,
      netProceeds, returnPct, totalDeductions,
    };
  }, [salePrice, commissionPct, closingPct, transferPct, helocBalance, d, taxConfig]);

  // Hold timeline
  const holdRows = useMemo((): HoldRow[] => {
    const rate = mortgage.interestRate / 100 / 12;
    const sorted = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
    const lastPayment = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const currentMonthlyPayment = lastPayment
      ? lastPayment.principalPortion + lastPayment.interestPortion + lastPayment.extraPrincipal
      : 0;

    const periods = [
      { label: 'Sell today', years: 0 },
      { label: 'Hold 2 more yr', years: 2 },
      { label: 'Hold 5 more yr', years: 5 },
      { label: 'Hold 10 more yr', years: 10 },
    ];

    return periods.map(({ label, years }) => {
      const futureValue = Math.round(d.currentHomeValue * Math.pow(1 + appreciationRate / 100, years));

      // Project mortgage balance forward
      let bal = d.currentBalance;
      for (let m = 0; m < years * 12; m++) {
        const interest = bal * rate;
        const principal = Math.max(0, currentMonthlyPayment - interest);
        bal = Math.max(0, bal - principal);
      }

      const comm = Math.round(futureValue * (commissionPct / 100));
      const close = Math.round(futureValue * (closingPct / 100));
      const trans = Math.round(futureValue * (transferPct / 100));

      // Cap gains for future
      const futureGain = futureValue - d.purchasePrice - d.totalRenoSpend;
      const exclusion = taxConfig?.filingStatus === 'Single' ? 250000 : 500000;
      const taxable = Math.max(0, futureGain - exclusion);
      const capRate = ((taxConfig?.capitalGainsRate || 15) + (taxConfig?.stateCapGainsRate || 9.3)) / 100;
      const tax = Math.round(taxable * capRate);

      const net = futureValue - bal - comm - close - trans - tax - helocBalance;
      const ret = d.totalCashOut > 0 ? ((net - d.totalCashOut) / d.totalCashOut) * 100 : 0;

      return { label, years, homeValue: futureValue, mortgageBalance: bal, netProceeds: net, returnPct: ret };
    });
  }, [d, mortgage, mortgagePayments, appreciationRate, commissionPct, closingPct, transferPct, helocBalance, taxConfig]);

  const pills = [
    { label: 'Conservative -5%', value: -5 },
    { label: 'Market value', value: 0 },
    { label: 'Aggressive +10%', value: 10 },
  ];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
          <span className="text-[14px] font-medium text-foreground">If you sold today</span>
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-muted-foreground">
              Net proceeds: <span className={calc.netProceeds >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
                {formatCurrency(calc.netProceeds)}
              </span> after all costs
            </span>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg px-4 py-3 space-y-4">
          {/* Section A — Sale price slider */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-4">
              <span className="text-[12px] text-muted-foreground shrink-0">Sale price:</span>
              <div className="flex-1">
                <Slider
                  value={[salePct]}
                  onValueChange={([v]) => setSalePct(v)}
                  min={-10}
                  max={20}
                  step={1}
                />
              </div>
              <span className="text-[18px] font-medium text-foreground shrink-0 min-w-[140px] text-right">
                {formatCurrency(salePrice)}
              </span>
            </div>
            <div className="flex gap-1.5 ml-[72px]">
              {pills.map(p => (
                <button
                  key={p.value}
                  onClick={(e) => { e.stopPropagation(); setSalePct(p.value); }}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    salePct === p.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section B — Sale cost breakdown */}
          <div className="space-y-1">
            <LedgerRow label="Sale price" value={salePrice} positive
              tooltip="The price you'd list/sell the home for." />
            <LedgerRow label="Mortgage payoff" value={-calc.mortgagePayoff} negative
              tooltip="Remaining loan balance paid to your lender at closing." />
            <LedgerRow
              label={
                <span className="flex items-center gap-1.5">
                  Agent commission
                  <span className="flex gap-0.5">
                    {[4, 5, 6].map(v => (
                      <button key={v} onClick={() => setCommissionPct(v)}
                        className={`text-[9px] px-1 py-0 rounded border ${commissionPct === v ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'}`}>
                        {v}%
                      </button>
                    ))}
                  </span>
                  <EditablePct value={commissionPct} onChange={setCommissionPct} />
                </span>
              }
              value={-calc.commission} negative
              tooltip="Split between buyer's and seller's agents. Typically 5-6%, negotiable."
            />
            <LedgerRow
              label={<span className="flex items-center gap-1.5">Closing costs <EditablePct value={closingPct} onChange={setClosingPct} /></span>}
              value={-calc.closing} negative
              tooltip="Title insurance, escrow, recording fees, prorated taxes. Typically 1-2% for sellers."
            />
            <LedgerRow
              label={<span className="flex items-center gap-1.5">Transfer tax <EditablePct value={transferPct} onChange={setTransferPct} step={0.01} /></span>}
              value={-calc.transfer} negative
              tooltip="Alameda County documentary transfer tax at $0.55 per $500 of value."
            />
            <LedgerRow
              label="Capital gains tax"
              value={-calc.capGainsTax} negative
              tooltip={`Your gain (${formatCurrency(calc.gain)}) is calculated as sale price minus purchase price (${formatCurrency(d.purchasePrice)}) minus renovation costs (${formatCurrency(d.totalRenoSpend)}). ${calc.taxableGain > 0 ? `${formatCurrency(calc.taxableGain)} exceeds the ${formatCurrency(calc.exclusionLimit)} exclusion and is taxed.` : `Since it's under the ${formatCurrency(calc.exclusionLimit)} exclusion for ${taxConfig?.filingStatus === 'Single' ? 'single filers' : 'married couples'}, you pay $0 in capital gains tax.`}`}
            />
            <LedgerRow
              label={<span className="flex items-center gap-1.5">Outstanding HELOC <EditableDollar value={helocBalance} onChange={setHelocBalance} /></span>}
              value={-helocBalance} negative
              tooltip="Any outstanding HELOC balance that must be repaid at closing."
            />

            {/* Divider */}
            <div className="border-t-2 border-foreground/20 my-1" />

            {/* Net proceeds */}
            <div className="flex justify-between items-center">
              <HelpTip plain="The actual check you walk away with after everyone else is paid."
                math={`${formatCurrency(salePrice)} sale − ${formatCurrency(calc.totalDeductions)} total deductions = ${formatCurrency(calc.netProceeds)}`}>
                <span className="text-[13px] font-semibold text-foreground">Net proceeds to you</span>
              </HelpTip>
              <span className={`text-[18px] font-semibold ${calc.netProceeds >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(calc.netProceeds)}
              </span>
            </div>
          </div>

          {/* Section C — Insight line */}
          <p className="text-[12px] text-muted-foreground">
            You invested {formatCurrency(d.totalCashOut)} total. Net proceeds of {formatCurrency(calc.netProceeds)} represent a{' '}
            <span className={calc.returnPct >= 0 ? 'text-success' : 'text-destructive'}>{formatPercent(calc.returnPct)}</span> return over {d.monthsOwned} months.
          </p>

          {/* Section D — Hold timeline */}
          <Collapsible open={holdOpen} onOpenChange={setHoldOpen}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {holdOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span>{holdOpen ? 'Hide' : 'Show'} hold timeline</span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded border overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="text-left px-3 py-1.5 font-medium">Hold period</th>
                      <th className="text-right px-3 py-1.5 font-medium">Est. home value</th>
                      <th className="text-right px-3 py-1.5 font-medium">Net proceeds</th>
                      <th className="text-right px-3 py-1.5 font-medium">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdRows.map((row, i) => (
                      <tr key={row.label} className={`${i % 2 === 1 ? 'bg-muted/20' : ''} ${row.returnPct > 20 ? 'bg-success/5' : ''}`}
                        style={{ height: '28px' }}>
                        <td className="px-3 py-1 text-foreground">{row.label}</td>
                        <td className="px-3 py-1 text-right text-foreground">{formatCurrency(row.homeValue)}</td>
                        <td className={`px-3 py-1 text-right font-medium ${row.netProceeds >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(row.netProceeds)}
                        </td>
                        <td className={`px-3 py-1 text-right ${row.returnPct >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatPercent(row.returnPct)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Based on {appreciationRate}% annual appreciation. Future mortgage balances projected from current amortization schedule.
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ---- Helper sub-components ---- */

function LedgerRow({ label, value, positive, negative, tooltip }: {
  label: React.ReactNode;
  value: number;
  positive?: boolean;
  negative?: boolean;
  tooltip: string;
}) {
  const color = value > 0 ? 'text-foreground' : value < 0 ? 'text-destructive/80' : 'text-muted-foreground';
  return (
    <div className="flex justify-between items-center py-0.5">
      <HelpTip plain={tooltip}>
        <span className="text-[13px] text-foreground">{label}</span>
      </HelpTip>
      <span className={`text-[13px] tabular-nums ${color}`}>
        {value < 0 ? `−${formatCurrency(Math.abs(value))}` : formatCurrency(value)}
      </span>
    </div>
  );
}

function EditablePct({ value, onChange, step = 0.1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <Input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      step={step}
      className="h-5 w-14 text-[10px] px-1 py-0 inline-flex"
      onClick={e => e.stopPropagation()}
    />
  );
}

function EditableDollar({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <Input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      step={1000}
      className="h-5 w-20 text-[10px] px-1 py-0 inline-flex"
      onClick={e => e.stopPropagation()}
    />
  );
}
