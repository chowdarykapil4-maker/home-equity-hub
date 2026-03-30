import { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency, formatPercent } from '@/lib/format';
import {
  MortgageProfile as MortgageProfileType, MortgagePayment, LoanType,
  isARM, calculatePaymentSplit, calculateMonthsRemaining,
} from '@/types';
import { generateAmortizationSchedule, getAmortizationSummary } from '@/lib/amortization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Trash2, Pencil, AlertTriangle, Bot } from 'lucide-react';

import MortgageSummaryMetrics from '@/components/mortgage/MortgageSummaryMetrics';
import AmortizationCharts from '@/components/mortgage/AmortizationCharts';
import AmortizationSchedule from '@/components/mortgage/AmortizationSchedule';
import ExtraPaymentCalculator from '@/components/mortgage/ExtraPaymentCalculator';
import FinancingTab from '@/components/mortgage/FinancingTab';

const LOAN_TYPES: LoanType[] = ['30yr Fixed', '15yr Fixed', '10yr ARM', '7yr ARM', '5yr ARM'];

type TabId = 'payments' | 'amortization' | 'extra-payments' | 'financing' | 'loan-settings';

function getHashTab(): TabId {
  const hash = window.location.hash.replace('#', '') as TabId;
  if (['payments', 'amortization', 'extra-payments', 'financing', 'loan-settings'].includes(hash)) return hash;
  return 'payments';
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'payments', label: 'Payments' },
  { id: 'amortization', label: 'Amortization' },
  { id: 'extra-payments', label: 'Extra Payments' },
  { id: 'financing', label: 'Financing' },
  { id: 'loan-settings', label: 'Loan Settings' },
];

export default function MortgagePage() {
  const { property, mortgage, setMortgage, mortgagePayments, addMortgagePayment, updateMortgagePayment, deleteMortgagePayment } = useAppContext();
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

  const update = (partial: Partial<MortgageProfileType>) => setMortgage({ ...mortgage, ...partial });

  const sortedPayments = useMemo(() => [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate)), [mortgagePayments]);
  const displayPayments = useMemo(() => [...sortedPayments].reverse(), [sortedPayments]);

  const currentBalance = sortedPayments.length > 0
    ? sortedPayments[sortedPayments.length - 1].remainingBalance
    : mortgage.originalLoanAmount;

  const amortRows = useMemo(() => generateAmortizationSchedule(mortgage, sortedPayments), [mortgage, sortedPayments]);
  const amortSummary = useMemo(() => getAmortizationSummary(amortRows), [amortRows]);

  const showArmAlert = isARM(mortgage.loanType);
  const armResetDate = new Date(mortgage.armResetDate);
  const now = new Date();
  const monthsUntilReset = (armResetDate.getFullYear() - now.getFullYear()) * 12 + (armResetDate.getMonth() - now.getMonth());

  const handleQuickAdd = () => {
    const prevBalance = currentBalance;
    const piPayment = 6557.54;
    const totalPayment = mortgage.monthlyPayment;
    const extraPrincipal = Math.round((totalPayment - piPayment) * 100) / 100;
    const { interest, principal, newBalance } = calculatePaymentSplit(prevBalance, mortgage.interestRate, piPayment, extraPrincipal);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dateStr = lastDay.toISOString().split('T')[0];
    const payment: MortgagePayment = {
      id: crypto.randomUUID(),
      paymentDate: dateStr,
      paymentAmount: totalPayment,
      principalPortion: principal,
      interestPortion: interest,
      extraPrincipal,
      remainingBalance: newBalance,
      notes: '',
    };
    addMortgagePayment(payment);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Mortgage & Debt</h2>

      <MortgageSummaryMetrics mortgage={mortgage} payments={sortedPayments} currentValue={property.currentEstimatedValue} />

      {showArmAlert && monthsUntilReset <= 24 && (
        <Card className="border-warning">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-sm font-medium">ARM Reset in {monthsUntilReset} months</p>
              <p className="text-xs text-muted-foreground">Consider refinancing options before your rate adjusts.</p>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Payment History</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleQuickAdd}>
                <Zap className="h-4 w-4 mr-1" /> Quick Add
              </Button>
              <PaymentDialog mortgage={mortgage} currentBalance={currentBalance} onSave={addMortgagePayment} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Payment</TableHead>
                    <TableHead className="text-right">Principal</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Extra</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPayments.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No payments logged yet.</TableCell></TableRow>
                  ) : displayPayments.map(p => {
                    const isAuto = p.notes === 'Auto-generated' || p.id.startsWith('auto-');
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1.5">
                            {p.paymentDate}
                            {isAuto && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/40 text-primary">
                                <Bot className="h-2.5 w-2.5 mr-0.5" />Auto
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(p.paymentAmount)}</TableCell>
                        <TableCell className="text-right text-sm text-success">{formatCurrency(p.principalPortion)}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{formatCurrency(p.interestPortion)}</TableCell>
                        <TableCell className="text-right text-sm">{p.extraPrincipal > 0 ? formatCurrency(p.extraPrincipal) : '—'}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(p.remainingBalance)}</TableCell>
                        <TableCell className="max-w-[120px] truncate text-xs text-muted-foreground">{p.notes || '—'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <PaymentDialog mortgage={mortgage} currentBalance={currentBalance} payment={p} onSave={updateMortgagePayment} />
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteMortgagePayment(p.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amortization Tab */}
      {activeTab === 'amortization' && (
        <div className="space-y-4">
          <AmortizationCharts rows={amortRows} mortgage={mortgage} payments={sortedPayments} />
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Full Amortization Schedule</CardTitle></CardHeader>
            <CardContent><AmortizationSchedule rows={amortRows} summary={amortSummary} /></CardContent>
          </Card>
        </div>
      )}

      {/* Extra Payments Tab */}
      {activeTab === 'extra-payments' && (
        <ExtraPaymentCalculator mortgage={mortgage} currentBalance={currentBalance} />
      )}

      {/* Financing Tab */}
      {activeTab === 'financing' && <FinancingTab />}

      {/* Loan Settings Tab */}
      {activeTab === 'loan-settings' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Loan Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Original Loan Amount</Label><Input type="number" value={mortgage.originalLoanAmount || ''} onChange={e => update({ originalLoanAmount: +e.target.value })} /></div>
              <div><Label>Loan Start Date</Label><Input type="date" value={mortgage.loanStartDate} onChange={e => update({ loanStartDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Interest Rate (%)</Label><Input type="number" step="0.01" value={mortgage.interestRate || ''} onChange={e => update({ interestRate: +e.target.value })} /></div>
              <div><Label>Loan Type</Label>
                <Select value={mortgage.loanType} onValueChange={v => update({ loanType: v as LoanType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LOAN_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {isARM(mortgage.loanType) && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>ARM Reset Date</Label><Input type="date" value={mortgage.armResetDate} onChange={e => update({ armResetDate: e.target.value })} /></div>
                <div><Label>Est. Market Rate at Reset</Label><Input type="number" step="0.1" value={mortgage.estimatedMarketRate || ''} onChange={e => update({ estimatedMarketRate: +e.target.value })} /></div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Loan Term (years)</Label><Input type="number" value={mortgage.loanTermYears || ''} onChange={e => update({ loanTermYears: +e.target.value })} /></div>
              <div><Label>Monthly Payment (P&I)</Label><Input type="number" value={mortgage.monthlyPayment || ''} onChange={e => update({ monthlyPayment: +e.target.value })} /></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PaymentDialog({ mortgage, currentBalance, payment, onSave }: {
  mortgage: MortgageProfileType;
  currentBalance: number;
  payment?: MortgagePayment;
  onSave: (p: MortgagePayment) => void;
}) {
  const isEdit = !!payment;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MortgagePayment>(() => payment || {
    id: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentAmount: mortgage.monthlyPayment,
    principalPortion: 0,
    interestPortion: 0,
    extraPrincipal: 0,
    remainingBalance: 0,
    notes: '',
  });

  const recalc = (paymentAmount: number, extraPrincipal: number) => {
    const balance = isEdit ? (payment!.remainingBalance + payment!.principalPortion + payment!.extraPrincipal) : currentBalance;
    const { interest, principal, newBalance } = calculatePaymentSplit(balance, mortgage.interestRate, paymentAmount, extraPrincipal);
    setForm(f => ({ ...f, paymentAmount, extraPrincipal, principalPortion: principal, interestPortion: interest, remainingBalance: newBalance }));
  };

  const handleOpen = (o: boolean) => {
    if (o && !isEdit) {
      const { interest, principal, newBalance } = calculatePaymentSplit(currentBalance, mortgage.interestRate, mortgage.monthlyPayment, 0);
      setForm({
        id: crypto.randomUUID(),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentAmount: mortgage.monthlyPayment,
        principalPortion: principal,
        interestPortion: interest,
        extraPrincipal: 0,
        remainingBalance: newBalance,
        notes: '',
      });
    }
    setOpen(o);
  };

  const handleSave = () => {
    onSave(form);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button size="icon" variant="ghost" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
        ) : (
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Payment</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? 'Edit Payment' : 'Add Payment'}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div><Label>Payment Date</Label><Input type="date" value={form.paymentDate} onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Payment Amount</Label><Input type="number" value={form.paymentAmount || ''} onChange={e => recalc(+e.target.value, form.extraPrincipal)} /></div>
            <div><Label>Extra Principal</Label><Input type="number" value={form.extraPrincipal || ''} onChange={e => recalc(form.paymentAmount, +e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><Label className="text-xs text-muted-foreground">Principal</Label><p className="font-medium text-success">{formatCurrency(form.principalPortion)}</p></div>
            <div><Label className="text-xs text-muted-foreground">Interest</Label><p className="font-medium text-destructive">{formatCurrency(form.interestPortion)}</p></div>
            <div><Label className="text-xs text-muted-foreground">New Balance</Label><p className="font-medium">{formatCurrency(form.remainingBalance)}</p></div>
          </div>
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
