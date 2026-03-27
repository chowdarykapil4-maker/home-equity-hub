import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { getEstimatedValueAdded } from '@/types';
import { formatCurrency } from '@/lib/format';
import { PropertyProfile as PropertyType, ValueSource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

const VALUE_SOURCES: ValueSource[] = ['Zillow', 'Redfin', 'Appraisal', 'Manual'];
const REFRESH_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: 'Manual only', value: 0 },
];

export default function PropertyProfilePage() {
  const { property, setProperty, projects } = useAppContext();
  const [rentcastKey, setRentcastKey] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [apiCallsThisMonth, setApiCallsThisMonth] = useState(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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
      }
      setSettingsLoaded(true);
    } catch {
      setSettingsLoaded(true);
    }
  }

  async function saveRefreshSettings() {
    await supabase
      .from('auto_refresh_settings')
      .update({
        rentcast_api_key: rentcastKey || null,
        refresh_interval_days: refreshInterval,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'default');
  }

  const totalRenovationSpend = projects.filter(p => p.status === 'Complete').reduce((s, p) => s + p.actualCost, 0);
  const totalCostBasis = property.purchasePrice + property.closingCosts + totalRenovationSpend;
  const currentEquity = property.currentEstimatedValue - property.mortgageBalance;
  const unrealizedGainLoss = property.currentEstimatedValue - totalCostBasis;

  const update = (partial: Partial<PropertyType>) => setProperty({ ...property, ...partial });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold">Property Profile</h2>

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
            <div><Label>Mortgage Balance</Label><Input type="number" value={property.mortgageBalance || ''} onChange={e => update({ mortgageBalance: +e.target.value })} /></div>
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

      {/* Auto-refresh settings */}
      {settingsLoaded && (
        <Card>
          <CardHeader><CardTitle>Auto-Refresh Settings</CardTitle></CardHeader>
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

      {/* Calculated metrics */}
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
