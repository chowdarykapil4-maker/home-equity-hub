import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency, formatPercent } from '@/lib/format';
import {
  MortgageProfile as MortgageProfileType, MortgagePayment, LoanType,
  isARM, calculatePaymentSplit, calculateMonthsRemaining,
} from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Zap, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const LOAN_TYPES: LoanType[] = ['30yr Fixed', '15yr Fixed', '10yr ARM', '7yr ARM', '5yr ARM'];

export default function MortgagePage() {
  const { property, mortgage, setMortgage, mortgagePayments, addMortgagePayment, updateMortgagePayment, deleteMortgagePayment } = useAppContext();

  const update = (partial: Partial<MortgageProfileType>) => setMortgage({ ...mortgage, ...partial });

  // Sort payments by date ascending for calculations
  const sortedPayments = [...mortgagePayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  const displayPayments = [...sortedPayments].reverse(); // newest first for display

  // Computed metrics
  const currentBalance = sortedPayments.length > 0
    ? sortedPayments[sortedPayments.length - 1].remainingBalance
    : mortgage.originalLoanAmount;
  const totalPrincipalPaid = sortedPayments.reduce((s, p) => s + p.principalPortion + p.extraPrincipal, 0);
  const totalInterestPaid = sortedPayments.reduce((s, p) => s + p.interestPortion, 0);
  const principalPaidPct = mortgage.originalLoanAmount > 0 ? (totalPrincipalPaid / mortgage.originalLoanAmount) * 100 : 0;
  const ltv = property.currentEstimatedValue > 0 ? (currentBalance / property.currentEstimatedValue) * 100 : 0;
  const equityFromPaydown = mortgage.originalLoanAmount - currentBalance;
  const monthsRemaining = calculateMonthsRemaining(currentBalance, mortgage.interestRate, mortgage.monthlyPayment);

  // ARM alert
  const armResetDate = new Date(mortgage.armResetDate);
  const now = new Date();
  const monthsUntilReset = (armResetDate.getFullYear() - now.getFullYear()) * 12 + (armResetDate.getMonth() - now.getMonth());
  const showArmAlert = isARM(mortgage.loanType);

  // Estimated payment at new rate
  const estimatedNewPayment = (() => {
    if (!showArmAlert || mortgage.estimatedMarketRate <= 0) return 0;
    const r = mortgage.estimatedMarketRate / 100 / 12;
    const n = monthsRemaining;
    if (r === 0 || n <= 0) return 0;
    return (currentBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  })();

  // Quick add payment
  const handleQuickAdd = () => {
    const prevBalance = currentBalance;
    const { interest, principal, newBalance } = calculatePaymentSplit(prevBalance, mortgage.interestRate, mortgage.monthlyPayment, 0);
    const payment: MortgagePayment = {
      id: crypto.randomUUID(),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentAmount: mortgage.monthlyPayment,
      principalPortion: principal,
      interestPortion: interest,
      extraPrincipal: 0,
      remainingBalance: newBalance,
      notes: '',
    };
    addMortgagePayment(payment);
  };

  // Chart data
  const areaData = sortedPayments.map(p => ({
    date: p.paymentDate,
    Principal: p.principalPortion + p.extraPrincipal,
    Interest: p.interestPortion,
  }));
  const balanceData = sortedPayments.map(p => ({
    date: p.paymentDate,
    balance: p.remainingBalance,
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground">Mortgage</h2>

      {/* ARM Reset Alert */}
      {showArmAlert && (
        <Card className={monthsUntilReset <= 12 ? 'border-warning bg-warning/5' : ''}>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className={`h-5 w-5 ${monthsUntilReset <= 12 ? 'text-warning' : 'text-muted-foreground'}`} />
            <CardTitle className="text-base">ARM Reset Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Reset Date</p><p className="font-semibold">{armResetDate.toLocaleDateString()}</p></div>
              <div><p className="text-muted-foreground">Months Until Reset</p><p className="font-semibold">{monthsUntilReset}</p></div>
              <div><p className="text-muted-foreground">Current → Est. Rate</p><p className="font-semibold">{mortgage.interestRate}% → {mortgage.estimatedMarketRate}%</p></div>
              <div><p className="text-muted-foreground">Est. Payment Change</p><p className="font-semibold">{formatCurrency(estimatedNewPayment - mortgage.monthlyPayment)}/mo</p></div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Label className="text-xs">Est. Market Rate at Reset</Label>
              <Input type="number" step="0.1" className="w-24 h-8 text-sm" value={mortgage.estimatedMarketRate || ''} onChange={e => update({ estimatedMarketRate: +e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mortgage Profile */}
      <Card>
        <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
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
              <div />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Loan Term (years)</Label><Input type="number" value={mortgage.loanTermYears || ''} onChange={e => update({ loanTermYears: +e.target.value })} /></div>
            <div><Label>Monthly Payment (P&I)</Label><Input type="number" value={mortgage.monthlyPayment || ''} onChange={e => update({ monthlyPayment: +e.target.value })} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Current Balance</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatCurrency(currentBalance)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Principal Paid</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-success">{formatCurrency(totalPrincipalPaid)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Interest Paid</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-destructive">{formatCurrency(totalInterestPaid)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Principal Paid %</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatPercent(principalPaidPct)}</p>
            <Progress value={principalPaidPct} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">LTV Ratio</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{formatPercent(ltv)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Equity from Paydown</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold text-success">{formatCurrency(equityFromPaydown)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Months Remaining</CardTitle></CardHeader>
          <CardContent><p className="text-xl font-bold">{monthsRemaining === Infinity ? '∞' : monthsRemaining}</p></CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Payment History</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleQuickAdd}>
              <Zap className="h-4 w-4 mr-1" /> Quick Add
            </Button>
            <PaymentDialog mortgage={mortgage} currentBalance={currentBalance} onSave={addMortgagePayment} />
          </div>
        </CardHeader>
        <CardContent>
          {sortedPayments.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div><span className="text-muted-foreground">Total Payments:</span> <span className="font-semibold">{formatCurrency(sortedPayments.reduce((s, p) => s + p.paymentAmount + p.extraPrincipal, 0))}</span></div>
              <div><span className="text-muted-foreground">To Principal:</span> <span className="font-semibold text-success">{formatCurrency(totalPrincipalPaid)}</span></div>
              <div><span className="text-muted-foreground">To Interest:</span> <span className="font-semibold text-destructive">{formatCurrency(totalInterestPaid)}</span></div>
            </div>
          )}
          <div className="rounded-md border overflow-auto max-h-96">
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
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No payments logged yet. Use "Quick Add" or add a manual entry.</TableCell></TableRow>
                ) : displayPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{p.paymentDate}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.paymentAmount)}</TableCell>
                    <TableCell className="text-right text-success">{formatCurrency(p.principalPortion)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(p.interestPortion)}</TableCell>
                    <TableCell className="text-right">{p.extraPrincipal > 0 ? formatCurrency(p.extraPrincipal) : '—'}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(p.remainingBalance)}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Amortization Charts */}
      {sortedPayments.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Principal vs Interest Over Time</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="Principal" stackId="1" fill="hsl(var(--success))" stroke="hsl(var(--success))" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="Interest" stackId="1" fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Balance Over Time</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Payment add/edit dialog
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
