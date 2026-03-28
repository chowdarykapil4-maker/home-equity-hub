

## Plan: Add "Renovation ROI Ranker" Collapsible Section

### What we're building
A collapsible section after "Extra payment impact" that ranks all Planned + Wishlist renovation projects by ROI, showing a sortable table, summary stats, and a "best next move" recommendation.

### Files to create/edit

**1. Create `src/components/homepl/RenovationROIRanker.tsx`** (~150 lines)

- Pulls `projects` from `useAppContext()`
- Filters to `status === 'Planned ...' || status === 'Wishlist'` (any status containing "Planned" or equal to "Wishlist")
- For each project: uses existing `getROIPercentage()`, `getEstimateMidpoint()`, `getEstimatedValueAdded()` from `@/types`
- Derives `netCost = cost - valueAdded`, ROI tier coloring (green >70%, amber 40-70%, coral <40%)

**Collapsed:** "Renovation ROI ranker" left, "X projects ranked by return →" right, chevron.

**Section A — Ranked table:** Projects sorted by ROI% descending. Columns: rank # with colored dot, name, cost (midpoint), ROI% with tiny inline bar, value added (green), net cost (coral), status pill. Alternating row backgrounds. Empty state links to Renovations page.

**Section B — Summary line:** Total planned cost → total value added (avg ROI%).

**Section C — Best next move:** Highlights highest-ROI planned project with cost and value added.

**Tooltips** via `HelpTip` on: ROI, value added, net cost, best next project.

**2. Edit `src/pages/HomePL.tsx`**
- Import `RenovationROIRanker`
- Add after ExtraPaymentImpact, before AnnualReport:
```tsx
<div className="mt-5">
  <RenovationROIRanker />
</div>
```

### Technical details
- All calculation functions already exist in `@/types/index.ts` — no new math needed
- Cost uses `getEstimateMidpoint()` for non-complete projects
- ROI tier thresholds: >70% green, 40-70% amber, <40% coral
- Status matching: includes all statuses starting with "Planned" (e.g. "Planned 2026", "Planned 2027") plus "Wishlist"

