

## Plan: Add "Annual Report" Collapsible Section to Home P&L

### What we're building
A new collapsible section between "If you sold today" and "Detailed breakdown" that shows year-by-year financial performance with P/I ratio bars, trend lines, and a P/I crossover insight.

### Files to create/edit

**1. Create `src/components/homepl/AnnualReport.tsx`** (~250 lines)

New component that:
- Accepts `d: HomePLData` as prop, plus pulls `mortgagePayments`, `projects`, `homePLConfig`, `property`, `valueEntries` from `useAppContext()`
- Uses `useMemo` to compute per-year data:
  - Loop from purchase year to current year
  - For each year: filter mortgage payments by date prefix, sum principal/interest, compute P/I ratio
  - Filter completed renovation projects by `dateCompleted` year
  - Prorate fixed costs for partial years (purchase year, current year)
  - Interpolate home value at year-end using value entries or linear interpolation between purchase price and current value
  - Compute equity at year-end, equity gained vs prior year
- Uses `generateAmortizationSchedule` from `@/lib/amortization.ts` to find the P/I crossover year (month where `principalPortion > interestPortion`)

**Collapsed state** (~50px):
- Uses `Collapsible` from shadcn
- Banner shows "Annual report" left, most recent complete year's equity gained right, chevron

**Expanded state:**

*Section A — Year strips:*
- Each year rendered as a compact strip (~65px) with 4 rows:
  - Row 1: Year label + equity gained (green)
  - Row 2: Principal + Interest amounts + inline P/I bar (80px wide, 8px tall, green/coral proportional fill)
  - Row 3: Reno spend + sunk cost
  - Row 4: Year-end equity + home value
- Most recent first, alternating `bg-muted/20` backgrounds
- If >4 years, show 3 most recent + "Show all years" toggle

*Section B — Trend line* (~30px):
- Three inline trend indicators showing P/I ratio, sunk cost, and equity gained across years with directional arrows

*Section C — Insight* (~30px):
- Blue info-tinted banner showing P/I improvement and crossover year prediction

**Tooltips** using existing `HelpTip` component on:
- P/I ratio, equity gained, sunk cost, year-end equity, crossover year

**2. Edit `src/pages/HomePL.tsx`**
- Import `AnnualReport`
- Add it between `IfYouSoldToday` and `DetailedBreakdown` sections

### Technical details

- Year data calculation is pure client-side in `useMemo`
- Partial year detection: purchase year gets `12 - purchaseMonth + 1` months, current year gets `currentMonth` months
- Home value interpolation: check `valueEntries` for entries near year-end, fallback to linear interpolation `purchasePrice + (currentValue - purchasePrice) * (yearIndex / totalYears)`
- P/I crossover: iterate amortization schedule rows until `principalPortion > interestPortion`, report that year
- Equity at start of year 1 = down payment; subsequent years = prior year's year-end equity

