import { useState, useEffect, useMemo } from 'react';
import { useAppContext, HomePLConfig, FilingStatus } from '@/context/AppContext';
import { getEstimatedValueAdded, resolveHomeValue } from '@/types';
import { formatCurrency } from '@/lib/format';
import { PropertyProfile as PropertyType, ValueSource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import ValueHistoryTab from '@/components/property/ValueHistoryTab';

const VALUE_SOURCES: ValueSource[] = ['Zillow', 'Redfin', 'Appraisal', 'Manual'];
const REFRESH_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: 'Manual only', value: 0 },
];

type TabId = 'value-history' | 'details' | 'settings';

function getHashTab(): TabId {
  const hash = window.location.hash.replace('#', '') as TabId;
  if (['value-history', 'details', 'settings'].includes(hash)) return hash;
  return 'value-history';
}

export default function PropertyProfilePage() {
  const { property, setProperty, projects, mortgage, mortgagePayments, valueEntries, homePLConfig, setHomePLConfig } = useAppContext();
  const [activeTab, setActiveTab] = useState<TabId>(getHashTab);

  useEffect(() => {
    const onHash = () => setActiveTab(getHashTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    window.location.hash = id;
  };

  const homeValue = resolveHomeValue(valueEntries, property);
  const yearsOwned = useMemo(() => {
    const [pYear, pMonth] = property.purchaseDate.split('-').map(Number);
    const now = new Date();
    return ((now.getFullYear() - pYear) * 12 + (now.getMonth() + 1 - pMonth)) / 12;
  }, [property.purchaseDate]);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'value-history', label: 'Value History' },
    { id: 'details', label: 'Property Details' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">My Property</h2>

      {/* Summary strip */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{property.address}</span></div>
            <div><span className="text-muted-foreground">Purchase:</span> <span className="font-medium">{formatCurrency(property.purchasePrice)}</span></div>
            <div><span className="text-muted-foreground">Current Value:</span> <span className="font-medium">{formatCurrency(homeValue)}</span></div>
            <div><span className="text-muted-foreground">Years Owned:</span> <span className="font-medium">{yearsOwned.toFixed(1)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-border px-1 overflow-x-auto" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => switchTab(tab.id)}
            className={`whitespace-nowrap px-3 py-2 text-[13px] transition-colors cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? 'text-foreground font-medium border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'value-history' && <ValueHistoryTab />}
      {activeTab === 'details' && <PropertyDetailsTab />}
      {activeTab === 'settings' && <SettingsTab />}
    </div>
  );
}

function PropertyDetailsTab() {
  const { property, setProperty, projects, mortgage, mortgagePayments } = useAppContext();

  const sortedPayments = useMemo(() => [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate)), [mortgagePayments]);
  const currentBalance = sortedPayments.length > 0 ? sortedPayments[sortedPayments.length - 1].remainingBalance : mortgage.originalLoanAmount;

  const totalRenovationSpend = projects.filter(p => p.status === 'Complete').reduce((s, p) => s + p.actualCost, 0);
  const totalCostBasis = property.purchasePrice + property.closingCosts + totalRenovationSpend;
  const currentEquity = property.currentEstimatedValue - currentBalance;
  const unrealizedGainLoss = property.currentEstimatedValue - totalCostBasis;

  const update = (partial: Partial<PropertyType>) => setProperty({ ...property, ...partial });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Property Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div><Label>Address</Label><Input value={property.address} onChange={e => update({ address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Purchase Price</Label><Input type="number" value={property.purchasePrice || ''} onChange={e => update({ purchasePrice: +e.target.value })} /></div>
            <div><Label>Purchase Date</Label><Input type="date" value={property.purchaseDate} onChange={e => update({ purchaseDate: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Closing Costs</Label><Input type="number" value={property.closingCosts || ''} onChange={e => update({ closingCosts: +e.target.value })} /></div>
            <div>
              <Label>Mortgage Balance</Label>
              <p className="text-sm font-medium mt-2">{formatCurrency(currentBalance)} <span className="text-xs text-muted-foreground">(from payment history)</span></p>
              <Link to="/mortgage" className="text-xs text-primary hover:underline">Update in Mortgage & Debt →</Link>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Current Estimated Value</Label><Input type="number" value={property.currentEstimatedValue || ''} onChange={e => update({ currentEstimatedValue: +e.target.value })} /></div>
            <div><Label>Value Last Updated</Label><Input type="date" value={property.valueLastUpdated} onChange={e => update({ valueLastUpdated: e.target.value })} /></div>
          </div>
          <div><Label>Value Source</Label>
            <Select value={property.valueSource} onValueChange={v => update({ valueSource: v as ValueSource })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VALUE_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Year Built</Label><Input type="number" value={property.yearBuilt || ''} onChange={e => update({ yearBuilt: +e.target.value })} /></div>
            <div><Label>Square Footage</Label><Input type="number" value={property.squareFootage || ''} onChange={e => update({ squareFootage: +e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Cost Basis</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(totalCostBasis)}</p><p className="text-xs text-muted-foreground">Purchase + Closing + Renovations</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Current Equity</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(currentEquity)}</p><p className="text-xs text-muted-foreground">Value − Mortgage</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Unrealized Gain/Loss</CardTitle></CardHeader>
          <CardContent><p className={`text-xl font-bold ${unrealizedGainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(unrealizedGainLoss)}</p><p className="text-xs text-muted-foreground">Value − Total Cost Basis</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsTab() {
  const { homePLConfig, setHomePLConfig } = useAppContext();
  const [rentcastKey, setRentcastKey] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [apiCallsThisMonth, setApiCallsThisMonth] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [draft, setDraft] = useState<HomePLConfig>(homePLConfig);

  useEffect(() => {
    setDraft(homePLConfig);
  }, [homePLConfig]);

  useEffect(() => {
    loadRefreshSettings();
  }, []);

  async function loadRefreshSettings() {
    try {
      const { data } = await supabase
        .from('auto_refresh_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();
      if (data) {
        setRentcastKey(data.rentcast_api_key || '');
        setRefreshInterval(data.refresh_interval_days);
        setApiCallsThisMonth(data.api_calls_this_month);
      } else {
        await supabase
          .from('auto_refresh_settings')
          .insert({ id: 'default', rentcast_api_key: '', refresh_interval_days: 30, api_calls_this_month: 0 });
      }
      setSettingsLoaded(true);
    } catch {
      setSettingsLoaded(true);
    }
  }

  async function saveRefreshSettings() {
    await supabase
      .from('auto_refresh_settings')
      .upsert({
        id: 'default',
        rentcast_api_key: rentcastKey || null,
        refresh_interval_days: refreshInterval,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
  }

  const setTax = (partial: Partial<HomePLConfig['tax']>) =>
    setDraft({ ...draft, tax: { ...draft.tax, ...partial } });

  const combinedRate = (draft.tax.federalRate + draft.tax.stateRate).toFixed(1);
  const exclusion = draft.tax.filingStatus === 'Single' ? '$250,000' : '$500,000';

  const savePLConfig = () => setHomePLConfig(draft);

  return (
    <div className="space-y-6">
      {/* RentCast API Settings */}
      {settingsLoaded && (
        <Card>
          <CardHeader><CardTitle className="text-base">Auto-Refresh Settings</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label>RentCast API Key</Label>
              <Input
                type="password"
                placeholder="Enter your RentCast API key"
                value={rentcastKey}
                onChange={e => setRentcastKey(e.target.value)}
                onBlur={saveRefreshSettings}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Get your API key at <a href="https://www.rentcast.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">rentcast.io</a>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Auto-refresh home value every</Label>
                <Select
                  value={String(refreshInterval)}
                  onValueChange={v => {
                    setRefreshInterval(Number(v));
                    setTimeout(saveRefreshSettings, 100);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REFRESH_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>API calls this month</Label>
                <p className="text-sm font-medium mt-2">{apiCallsThisMonth} calls (3 per refresh)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Assumptions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cost Assumptions</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[11px]">Annual property tax</Label><Input type="number" value={draft.annualPropertyTax} onChange={e => setDraft({ ...draft, annualPropertyTax: +e.target.value })} /></div>
            <div><Label className="text-[11px]">Monthly insurance</Label><Input type="number" value={draft.monthlyInsurance} onChange={e => setDraft({ ...draft, monthlyInsurance: +e.target.value })} /></div>
            <div><Label className="text-[11px]">Monthly HOA</Label><Input type="number" value={draft.monthlyHOA} onChange={e => setDraft({ ...draft, monthlyHOA: +e.target.value })} /></div>
            <div><Label className="text-[11px]">Comparable rent/mo</Label><Input type="number" value={draft.estimatedMonthlyRent} onChange={e => setDraft({ ...draft, estimatedMonthlyRent: +e.target.value })} /></div>
            <div className="col-span-2"><Label className="text-[11px]">Annual maintenance</Label><Input type="number" value={draft.annualMaintenance} onChange={e => setDraft({ ...draft, annualMaintenance: +e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base">Tax Profile</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[11px]">Federal marginal rate %</Label><Input type="number" step="0.1" value={draft.tax.federalRate} onChange={e => setTax({ federalRate: +e.target.value })} /></div>
            <div><Label className="text-[11px]">State marginal rate %</Label><Input type="number" step="0.1" value={draft.tax.stateRate} onChange={e => setTax({ stateRate: +e.target.value })} /></div>
            <div><Label className="text-[11px]">Combined marginal rate</Label><Input type="text" readOnly value={`${combinedRate}%`} className="bg-muted text-muted-foreground" /></div>
            <div><Label className="text-[11px]">Filing status</Label>
              <Select value={draft.tax.filingStatus} onValueChange={(v) => setTax({ filingStatus: v as FilingStatus })}>
                <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Married Filing Jointly">Married Filing Jointly</SelectItem>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Head of Household">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <Label className="text-[11px]">Itemize deductions?</Label>
                <p className="text-[10px] text-muted-foreground">Most homeowners with mortgages over $750K benefit from itemizing</p>
              </div>
              <Switch checked={draft.tax.itemizeDeductions} onCheckedChange={v => setTax({ itemizeDeductions: v })} />
            </div>
            <div><Label className="text-[11px]">Capital gains rate %</Label><Input type="number" step="0.1" value={draft.tax.capitalGainsRate} onChange={e => setTax({ capitalGainsRate: +e.target.value })} /></div>
            <div><Label className="text-[11px]">State capital gains rate %</Label><Input type="number" step="0.1" value={draft.tax.stateCapGainsRate} onChange={e => setTax({ stateCapGainsRate: +e.target.value })} /></div>
            <div><Label className="text-[11px]">SALT cap</Label><Input type="number" value={draft.tax.saltCap} onChange={e => setTax({ saltCap: +e.target.value })} /></div>
            <div><Label className="text-[11px]">Home sale exclusion</Label><Input type="text" readOnly value={`Up to ${exclusion}`} className="bg-muted text-muted-foreground" /></div>
          </div>

          <p className="text-[13px] font-medium text-foreground mt-4 mb-2">Forward projections</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[11px]">Annual home appreciation %</Label><Input type="number" step="0.1" value={draft.tax.annualAppreciation} onChange={e => setTax({ annualAppreciation: +e.target.value })} /></div>
            <div><Label className="text-[11px]">Annual rent increase %</Label><Input type="number" step="0.1" value={draft.tax.annualRentIncrease} onChange={e => setTax({ annualRentIncrease: +e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={savePLConfig}>Save Assumptions</Button>
      </div>
    </div>
  );
}
