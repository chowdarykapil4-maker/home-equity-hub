

## Plan: Add "Extra Payment Impact" Collapsible Section

### What we're building
A new collapsible section after the Refinance Analyzer that models the impact of extra monthly principal payments — showing interest saved, time saved, a timeline bar, and a sensitivity table.

### Files to create/edit

**1. Create `src/components/homepl/ExtraPaymentImpact.tsx`** (~200 lines)

Props: `d: HomePLData`. Pulls `mortgage`, `mortgagePayments` from `useAppContext()`.

Local state: `extra` (default 500), `open` (default false).

**Collapsed state:** Banner with "Extra payment impact" left, pre-calculated "$500/mo extra saves $XXX,XXX in interest" in green right, chevron.

**Section A — Slider:** Range 0–3000, step 100. Quick-select pills: $250, $500, $1,000, $2,000. Live "$X/mo extra" display.

**Section B — Impact comparison:** Two columns (without/with extra). Shows payment, payoff date, total remaining interest. Centered delta highlights: years/months saved + interest saved in green bold.

Calculation: month-by-month loop from `d.currentBalance` at `mortgage.interestRate`, comparing baseline vs with-extra. Sum interest in each path, record when balance hits zero.

**Section C — Timeline bar:** Two horizontal bars — gray full-width for current remaining term, green shorter bar for with-extra term. Gap labeled "X years saved."

**Section D — Sensitivity table:** 4 rows ($250/$500/$1k/$2k), columns: Extra/mo, Interest saved, Years saved, Monthly equity boost. Highlight row matching current slider with green left border. All computed via the same amortization loop in `useMemo`.

**Tooltips** via `HelpTip` on: interest saved, years saved, extra payment slider, monthly equity boost.

**2. Edit `src/pages/HomePL.tsx`**
- Import `ExtraPaymentImpact`
- Add after RefinanceAnalyzer (line 78), before AnnualReport:
```tsx
<div className="mt-5">
  <ExtraPaymentImpact d={scenario} />
</div>
```

### Technical details
- Reuses same amortization loop pattern as `calculateExtraPaymentImpact` in `lib/amortization.ts` but done inline in `useMemo` for the sensitivity table (4 scenarios at once)
- Current balance from `d.currentBalance`, rate from `mortgage.interestRate`, payment from `mortgage.monthlyPayment`
- Timeline bar widths: proportional — baseline months = 100%, extra months = (extraMonths/baselineMonths × 100)%
- Collapsed preview uses a pre-computed $500 result from the same `useMemo`

