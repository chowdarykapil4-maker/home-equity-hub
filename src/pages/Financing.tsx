import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/format';
import { FinancingEntry, FinancingType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, CreditCard, Landmark, Banknote } from 'lucide-react';

const FINANCING_TYPES: FinancingType[] = ['0% Promo', 'HELOC Draw', 'Cash'];

export default function FinancingPage() {
  const { projects, financingEntries, addFinancingEntry, updateFinancingEntry, deleteFinancingEntry, helocConfig, setHelocConfig, cashBudget, setCashBudget } = useAppContext();

  const promos = financingEntries.filter(f => f.type === '0% Promo');
  const helocDraws = financingEntries.filter(f => f.type === 'HELOC Draw');
  const cashEntries = financingEntries.filter(f => f.type === 'Cash');

  const totalPromos = promos.reduce((s, f) => s + f.remainingBalance, 0);
  const totalPromoPayments = promos.reduce((s, f) => s + f.monthlyPayment, 0);
  const totalHelocDrawn = helocDraws.reduce((s, f) => s + f.remainingBalance, 0);
  const helocAvailable = helocConfig.totalCapacity - totalHelocDrawn;
  const totalCashSpent = cashEntries.reduce((s, f) => s + f.amount, 0);

  const totalMonthly = financingEntries.reduce((s, f) => s + f.monthlyPayment, 0);
  const sortedEntries = [...financingEntries].sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Renovation Financing</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm text-muted-foreground">0% Promos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalPromos)}</p>
            <p className="text-xs text-muted-foreground">{promos.length} active · {formatCurrency(totalPromoPayments)}/mo</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Landmark className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm text-muted-foreground">HELOC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-muted-foreground">Capacity:</p>
              <Input type="number" className="h-7 w-28 text-sm" value={helocConfig.totalCapacity || ''} onChange={e => setHelocConfig({ totalCapacity: +e.target.value })} />
            </div>
            <p className="text-sm">Drawn: <span className="font-bold">{formatCurrency(totalHelocDrawn)}</span></p>
            <p className="text-sm">Available: <span className="font-bold text-success">{formatCurrency(helocAvailable)}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Banknote className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm text-muted-foreground">Cash</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs text-muted-foreground">Budget:</p>
              <Input type="number" className="h-7 w-28 text-sm" value={cashBudget || ''} onChange={e => setCashBudget(+e.target.value)} />
            </div>
            <p className="text-sm">Spent: <span className="font-bold">{formatCurrency(totalCashSpent)}</span></p>
            <p className="text-sm">Remaining: <span className="font-bold text-success">{formatCurrency(Math.max(0, cashBudget - totalCashSpent))}</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Financing Entries */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Financing Entries</CardTitle>
          <FinancingDialog projects={projects} onSave={addFinancingEntry} />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Monthly</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Linked Reno</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No financing entries yet.</TableCell></TableRow>
                ) : sortedEntries.map(f => {
                  const linkedProject = projects.find(p => p.id === f.linkedRenovationId);
                  return (
                    <TableRow key={f.id}>
                      <TableCell><Badge variant="outline" className="text-xs">{f.type}</Badge></TableCell>
                      <TableCell className="text-sm">{f.sourceName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(f.amount)}</TableCell>
                      <TableCell className="text-right">{f.monthlyPayment > 0 ? formatCurrency(f.monthlyPayment) : '—'}</TableCell>
                      <TableCell className="text-right">{f.interestRate > 0 ? `${f.interestRate}%` : '0%'}</TableCell>
                      <TableCell className="text-sm">{f.startDate}</TableCell>
                      <TableCell className="text-sm">{f.endDate || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(f.remainingBalance)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[100px] truncate">{linkedProject?.projectName || '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <FinancingDialog entry={f} projects={projects} onSave={updateFinancingEntry} />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteFinancingEntry(f.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {sortedEntries.length > 0 && (
            <div className="mt-4 text-right">
              <p className="text-sm text-muted-foreground">Total Monthly Obligation: <span className="font-bold text-foreground">{formatCurrency(totalMonthly)}/mo</span></p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FinancingDialog({ entry, projects, onSave }: { entry?: FinancingEntry; projects: any[]; onSave: (f: FinancingEntry) => void }) {
  const isEdit = !!entry;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FinancingEntry>(() => entry || {
    id: '', type: '0% Promo' as FinancingType, sourceName: '', amount: 0, termMonths: 0, monthlyPayment: 0,
    interestRate: 0, startDate: new Date().toISOString().split('T')[0], endDate: '', remainingBalance: 0,
    linkedRenovationId: '', notes: '',
  });

  const handleOpen = (o: boolean) => {
    if (o && !isEdit) setForm({
      id: crypto.randomUUID(), type: '0% Promo', sourceName: '', amount: 0, termMonths: 0, monthlyPayment: 0,
      interestRate: 0, startDate: new Date().toISOString().split('T')[0], endDate: '', remainingBalance: 0,
      linkedRenovationId: '', notes: '',
    });
    setOpen(o);
  };

  const recalc = (amount: number, termMonths: number, type: FinancingType, startDate: string) => {
    const monthly = type !== 'Cash' && termMonths > 0 ? Math.round((amount / termMonths) * 100) / 100 : 0;
    let endDate = '';
    if (type !== 'Cash' && termMonths > 0 && startDate) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + termMonths);
      endDate = d.toISOString().split('T')[0];
    }
    setForm(f => ({ ...f, amount, termMonths, monthlyPayment: monthly, endDate, type, startDate, remainingBalance: f.remainingBalance || amount }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isEdit ? <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button> : <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Entry</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? 'Edit' : 'Add'} Financing Entry</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <Select value={form.type} onValueChange={v => recalc(form.amount, form.termMonths, v as FinancingType, form.startDate)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FINANCING_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Source / Vendor</Label><Input value={form.sourceName} onChange={e => setForm(f => ({ ...f, sourceName: e.target.value }))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount</Label><Input type="number" value={form.amount || ''} onChange={e => recalc(+e.target.value, form.termMonths, form.type, form.startDate)} /></div>
            <div><Label>Term (months)</Label><Input type="number" value={form.termMonths || ''} onChange={e => recalc(form.amount, +e.target.value, form.type, form.startDate)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={form.interestRate || ''} onChange={e => setForm(f => ({ ...f, interestRate: +e.target.value }))} /></div>
            <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => recalc(form.amount, form.termMonths, form.type, e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>End Date</Label><Input type="date" value={form.endDate} readOnly className="opacity-60" /></div>
            <div><Label>Monthly Payment</Label><Input type="number" value={form.monthlyPayment || ''} readOnly className="opacity-60" /></div>
          </div>
          <div><Label>Remaining Balance</Label><Input type="number" value={form.remainingBalance || ''} onChange={e => setForm(f => ({ ...f, remainingBalance: +e.target.value }))} /></div>
          <div><Label>Linked Renovation</Label>
            <Select value={form.linkedRenovationId || 'none'} onValueChange={v => setForm(f => ({ ...f, linkedRenovationId: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={() => { onSave(form); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
