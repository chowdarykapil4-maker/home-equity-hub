import { useState, useEffect } from 'react';
import { useHomePL } from '@/hooks/useHomePL';
import { applyScenario } from '@/lib/scenario';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LayoutDashboard, Scale, SlidersHorizontal, Hammer, Calendar } from 'lucide-react';
import { Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import RefreshStatus from '@/components/homepl/RefreshStatus';
import ScenarioBanner from '@/components/homepl/ScenarioBanner';
import ValueSensitivitySlider from '@/components/homepl/ValueSensitivitySlider';
import VerdictHero from '@/components/homepl/VerdictHero';
import FinancialFlow from '@/components/homepl/FinancialFlow';
import CostEquityChart from '@/components/homepl/CostEquityChart';
import UnifiedComparison from '@/components/homepl/UnifiedComparison';
import DetailedBreakdown from '@/components/homepl/DetailedBreakdown';
import MonthlySnapshot from '@/components/homepl/MonthlySnapshot';
import IfYouSoldToday from '@/components/homepl/IfYouSoldToday';
import AnnualReport from '@/components/homepl/AnnualReport';
import RefinanceAnalyzer from '@/components/homepl/RefinanceAnalyzer';
import ExtraPaymentImpact from '@/components/homepl/ExtraPaymentImpact';
import RenovationROIRanker from '@/components/homepl/RenovationROIRanker';

type TabId = 'snapshot' | 'compare' | 'scenarios' | 'renovations' | 'history';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'snapshot', label: 'Snapshot', icon: LayoutDashboard },
  { id: 'compare', label: 'Own vs rent', icon: Scale },
  { id: 'scenarios', label: 'Scenarios', icon: SlidersHorizontal },
  { id: 'renovations', label: 'Renovations', icon: Hammer },
  { id: 'history', label: 'History', icon: Calendar },
];

function getHashTab(): TabId {
  const hash = window.location.hash.replace('#', '') as TabId;
  return TABS.some(t => t.id === hash) ? hash : 'snapshot';
}

export default function HomePL() {
  const baseD = useHomePL();
  const [scenarioPercent, setScenarioPercent] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>(getHashTab);

  const scenario = applyScenario(baseD, scenarioPercent);
  const scenarioActive = scenarioPercent !== 0;

  // Sync hash to tab
  useEffect(() => {
    const onHash = () => setActiveTab(getHashTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    window.location.hash = id;
  };

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      switchTab(TABS[(idx + 1) % TABS.length].id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      switchTab(TABS[(idx - 1 + TABS.length) % TABS.length].id);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-5xl mx-auto">
        {/* Pinned header */}
        <div className="flex items-center justify-between mb-1 px-1">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-foreground">Home P&L</h2>
              <RefreshStatus />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {baseD.monthsOwned} months of ownership · {baseD.purchaseDate.substring(0, 7)} — present
            </p>
          </div>
          <Link to="/property#settings" className="text-xs text-primary hover:underline flex items-center gap-1">
            <Settings2 className="h-3 w-3" /> Edit assumptions
          </Link>
        </div>

        <div className="mb-2">
          <ScenarioBanner scenarioPercent={scenarioPercent} onReset={() => setScenarioPercent(0)} />
        </div>

        <ValueSensitivitySlider
          scenarioPercent={scenarioPercent}
          onChange={setScenarioPercent}
          modeledValue={scenario.currentHomeValue}
          baseValue={baseD.currentHomeValue}
        />

        {/* Tab bar */}
        <div
          className="flex items-center gap-1 border-b border-border px-1 mb-3 mt-4 overflow-x-auto"
          role="tablist"
          onKeyDown={handleTabKeyDown}
        >
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => switchTab(tab.id)}
                className={`inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-[13px] transition-colors cursor-pointer border-b-2 sm:px-3 px-2.5 ${
                  isActive
                    ? 'text-foreground font-medium border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'snapshot' && (
          <div className="space-y-2">
            {/* Block 1: Verdict + Financial Flow — one card */}
            <div className="rounded-xl border border-success/20 bg-success/[0.04]">
              <VerdictHero d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
              <FinancialFlow d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
            </div>

            {/* Block 2: Chart + Monthly metrics — one card */}
            <div className="rounded-xl border border-border bg-card">
              <CostEquityChart d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
              <MonthlySnapshot d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
            </div>

            {/* Block 3: Detailed breakdown — collapsible */}
            <DetailedBreakdown d={scenario} />
          </div>
        )}

        {activeTab === 'compare' && (
          <div>
            <UnifiedComparison d={scenario} baseD={baseD} scenarioActive={scenarioActive} />
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="space-y-3">
            <IfYouSoldToday d={scenario} scenarioPercent={scenarioPercent} defaultOpen />
            <RefinanceAnalyzer d={scenario} />
            <ExtraPaymentImpact d={scenario} />
          </div>
        )}

        {activeTab === 'renovations' && (
          <div>
            <RenovationROIRanker defaultOpen />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <AnnualReport d={scenario} defaultOpen />
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
