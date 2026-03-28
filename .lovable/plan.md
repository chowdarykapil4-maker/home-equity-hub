

## Plan: Add "Refinance Analyzer" Collapsible Section

### What we're building
A new collapsible section after "If you sold today" that lets the user model refinancing scenarios — comparing current loan vs a new rate/term, showing monthly savings, total interest saved, breakeven timeline, and P/I impact.

### Files to create/edit

**1. Create `src/components/homepl/RefinanceAnalyzer.tsx`** (~220 lines)

- Props: `d: HomePLData`
- Pulls `mortgage`, `mortgagePayments` from `useAppContext()`
- Local state: `newRate` (default 4.5), `closingCosts` (default 8000), `newTermYears` (default 30)

**Collapsed state:** Banner with "Refinance analyzer" left, "See savings at lower rates →" right, chevron.

**Expanded — Section A (Inputs):**
- Compact row: rate input (60px) with "%" suffix, quick-select pills (4.0/4.5/5.0/current dimmed), closing costs input, term dropdown (30/20/15yr)

**Expanded — Section B (Side-by-side):**
- Two columns with vertical divider
- Left "Current loan": rate, monthly payment, remaining balance, remaining interest (summed from amortization schedule future rows), ARM reset date
- Right "After refinance": new rate, new monthly payment (standard amortization formula), same balance, new total interest (iterate new schedule), monthly savings
- Uses `generateAmortizationSchedule` for current remaining interest; computes new schedule inline with standard formula: `P × r(1+r)^n / ((1+r)^n - 1)`

**Expanded — Section C (Verdict):**
- Monthly savings (18px green), total interest saved (14px), breakeven months = ceil(closingCosts / monthlySavings)
- Breakeven color: <24mo green "Strong candidate", 24-48 amber "Worth considering", >48 red "Weak"

**Expanded — Section D (P&L Impact):**
- Current vs new first-month principal percentage
- Wealth creation boost = new first-month principal - current first-month principal

**Tooltips** via `HelpTip` on: remaining interest, breakeven, ARM resets, monthly savings, P/I split.

**2. Edit `src/pages/HomePL.tsx`**
- Import `RefinanceAnalyzer`
- Add between `IfYouSoldToday` and `AnnualReport`:
```tsx
<div className="mt-5">
  <RefinanceAnalyzer d={scenario} />
</div>
```

### Technical details
- Current remaining interest: filter amortization schedule rows where `!isPast && !isCurrentMonth`, sum `interestPortion`
- New amortization: iterate month-by-month from current balance at new rate/term, sum all interest
- Current balance: last actual payment's `remainingBalance`, or fallback to `d.currentMortgageBalance`
- All calculations client-side in `useMemo`, instant updates on input change

