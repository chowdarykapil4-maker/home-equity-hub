import { useState } from 'react';
import { useAppContext, HomePLConfig } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-primary hover:underline flex items-center gap-1">
          <Settings2 className="h-3 w-3" /> Edit assumptions
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button size="sm" onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
