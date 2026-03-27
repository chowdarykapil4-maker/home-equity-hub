import { useState } from 'react';
import { useAppContext, HomePLConfig, FilingStatus } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings2 } from 'lucide-react';

export default function AssumptionsEditor() {
  const { homePLConfig, setHomePLConfig } = useAppContext();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<HomePLConfig>(homePLConfig);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(homePLConfig);
    setOpen(isOpen);
  };

  const save = () => {
    setHomePLConfig(draft);
    setOpen(false);
  };

  const setTax = (partial: Partial<HomePLConfig['tax']>) =>
    setDraft({ ...draft, tax: { ...draft.tax, ...partial } });

  const combinedRate = (draft.tax.federalRate + draft.tax.stateRate).toFixed(1);
  const exclusion = draft.tax.filingStatus === 'Single' ? '$250,000' : '$500,000';

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          <Settings2 className="h-3 w-3" /> Edit assumptions
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Cost Assumptions</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div><Label className="text-[11px]">Annual property tax</Label><Input type="number" value={draft.annualPropertyTax} onChange={e => setDraft({ ...draft, annualPropertyTax: +e.target.value })} /></div>
          <div><Label className="text-[11px]">Monthly insurance</Label><Input type="number" value={draft.monthlyInsurance} onChange={e => setDraft({ ...draft, monthlyInsurance: +e.target.value })} /></div>
          <div><Label className="text-[11px]">Monthly HOA</Label><Input type="number" value={draft.monthlyHOA} onChange={e => setDraft({ ...draft, monthlyHOA: +e.target.value })} /></div>
          <div><Label className="text-[11px]">Comparable rent/mo</Label><Input type="number" value={draft.estimatedMonthlyRent} onChange={e => setDraft({ ...draft, estimatedMonthlyRent: +e.target.value })} /></div>
          <div className="col-span-2"><Label className="text-[11px]">Annual maintenance</Label><Input type="number" value={draft.annualMaintenance} onChange={e => setDraft({ ...draft, annualMaintenance: +e.target.value })} /></div>
        </div>

        {/* Tax Profile */}
        <div className="border-t border-border mt-3 pt-3">
          <p className="text-[13px] font-medium text-foreground mb-2">Tax profile</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Federal marginal rate %</Label>
              <Input type="number" step="0.1" value={draft.tax.federalRate} onChange={e => setTax({ federalRate: +e.target.value })} />
            </div>
            <div>
              <Label className="text-[11px]">State marginal rate %</Label>
              <Input type="number" step="0.1" value={draft.tax.stateRate} onChange={e => setTax({ stateRate: +e.target.value })} />
            </div>
            <div>
              <Label className="text-[11px]">Combined marginal rate</Label>
              <Input type="text" readOnly value={`${combinedRate}%`} className="bg-muted text-muted-foreground" />
            </div>
            <div>
              <Label className="text-[11px]">Filing status</Label>
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
            <div>
              <Label className="text-[11px]">Capital gains rate %</Label>
              <Input type="number" step="0.1" value={draft.tax.capitalGainsRate} onChange={e => setTax({ capitalGainsRate: +e.target.value })} />
            </div>
            <div>
              <Label className="text-[11px]">State capital gains rate %</Label>
              <Input type="number" step="0.1" value={draft.tax.stateCapGainsRate} onChange={e => setTax({ stateCapGainsRate: +e.target.value })} />
            </div>
            <div>
              <Label className="text-[11px]">SALT cap</Label>
              <Input type="number" value={draft.tax.saltCap} onChange={e => setTax({ saltCap: +e.target.value })} />
            </div>
            <div>
              <Label className="text-[11px]">Home sale exclusion</Label>
              <Input type="text" readOnly value={`Up to ${exclusion}`} className="bg-muted text-muted-foreground" />
            </div>
          </div>

          {/* Forward projection assumptions */}
          <p className="text-[13px] font-medium text-foreground mt-3 mb-2">Forward projections</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px]">Annual home appreciation %</Label>
              <Input type="number" step="0.1" value={draft.tax.annualAppreciation} onChange={e => setTax({ annualAppreciation: +e.target.value })} />
            </div>
            <div>
              <Label className="text-[11px]">Annual rent increase %</Label>
              <Input type="number" step="0.1" value={draft.tax.annualRentIncrease} onChange={e => setTax({ annualRentIncrease: +e.target.value })} />
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground mt-2">These rates are used to calculate tax-adjusted comparisons. Consult a tax professional for your specific situation.</p>
        </div>

        <div className="flex justify-end gap-2 mt-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
