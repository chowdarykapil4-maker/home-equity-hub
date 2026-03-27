import { MortgageProfile, MortgagePayment, calculateMonthlyInterest } from '@/types';

export interface AmortizationRow {
  paymentNumber: number;
  date: string; // YYYY-MM
  monthlyPayment: number;
  principalPortion: number;
  interestPortion: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  remainingBalance: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isActual: boolean; // true if backed by an actual payment entry
}

export interface AmortizationSummary {
  totalPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
}

export function generateAmortizationSchedule(
  mortgage: MortgageProfile,
  actualPayments: MortgagePayment[]
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  const rate = mortgage.interestRate;
  const monthlyRate = rate / 100 / 12;
  const totalMonths = mortgage.loanTermYears * 12;
  const basePayment = mortgage.monthlyPayment;

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Build a map of actual payments by year-month
  const actualMap = new Map<string, MortgagePayment>();
  const sorted = [...actualPayments].sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  sorted.forEach(p => {
    const ym = p.paymentDate.substring(0, 7);
    actualMap.set(ym, p);
  });

  const startDate = new Date(mortgage.loanStartDate);
  let balance = mortgage.originalLoanAmount;
  let cumPrincipal = 0;
  let cumInterest = 0;

  for (let i = 0; i < totalMonths && balance > 0; i++) {
    const paymentMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1 + i, 1);
    const ym = `${paymentMonth.getFullYear()}-${String(paymentMonth.getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = ym === currentYM;
    const isPast = paymentMonth <= now;

    const actual = actualMap.get(ym);

    let interest: number;
    let principal: number;
    let payment: number;
    let extra = 0;

    if (actual) {
      interest = actual.interestPortion;
      principal = actual.principalPortion;
      extra = actual.extraPrincipal;
      payment = actual.paymentAmount;
      balance = actual.remainingBalance;
    } else {
      interest = Math.round(calculateMonthlyInterest(balance, rate) * 100) / 100;
      principal = Math.round((basePayment - interest) * 100) / 100;
      if (principal + interest > balance + interest) {
        principal = balance;
        payment = principal + interest;
      } else {
        payment = basePayment;
      }
      balance = Math.max(0, Math.round((balance - principal) * 100) / 100);
    }

    cumPrincipal += principal + extra;
    cumInterest += interest;

    rows.push({
      paymentNumber: i + 1,
      date: ym,
      monthlyPayment: payment + extra,
      principalPortion: principal + extra,
      interestPortion: interest,
      cumulativePrincipal: Math.round(cumPrincipal * 100) / 100,
      cumulativeInterest: Math.round(cumInterest * 100) / 100,
      remainingBalance: Math.round(balance * 100) / 100,
      isCurrentMonth,
      isPast: isPast && !isCurrentMonth,
      isActual: !!actual,
    });
  }

  return rows;
}

export function getAmortizationSummary(rows: AmortizationRow[]): AmortizationSummary {
  if (rows.length === 0) return { totalPayments: 0, totalPrincipal: 0, totalInterest: 0, totalAmount: 0 };
  const last = rows[rows.length - 1];
  return {
    totalPayments: rows.length,
    totalPrincipal: last.cumulativePrincipal,
    totalInterest: last.cumulativeInterest,
    totalAmount: Math.round((last.cumulativePrincipal + last.cumulativeInterest) * 100) / 100,
  };
}

export interface ExtraPaymentResult {
  originalPayoffDate: string;
  newPayoffDate: string;
  monthsSaved: number;
  interestSaved: number;
  originalTotalInterest: number;
  newTotalInterest: number;
}

export function calculateExtraPaymentImpact(
  mortgage: MortgageProfile,
  currentBalance: number,
  extraMonthly: number
): ExtraPaymentResult {
  const rate = mortgage.interestRate / 100 / 12;
  const basePayment = mortgage.monthlyPayment;
  const now = new Date();

  // Standard schedule from current balance
  let balStd = currentBalance;
  let stdMonths = 0;
  let stdInterest = 0;
  while (balStd > 0.01 && stdMonths < 600) {
    const int = balStd * rate;
    const prin = Math.min(basePayment - int, balStd);
    stdInterest += int;
    balStd -= prin;
    stdMonths++;
  }

  // With extra payment
  let balExtra = currentBalance;
  let extraMonths = 0;
  let extraInterest = 0;
  while (balExtra > 0.01 && extraMonths < 600) {
    const int = balExtra * rate;
    const prin = Math.min(basePayment + extraMonthly - int, balExtra);
    extraInterest += int;
    balExtra -= prin;
    extraMonths++;
  }

  const stdPayoff = new Date(now.getFullYear(), now.getMonth() + stdMonths, 1);
  const extraPayoff = new Date(now.getFullYear(), now.getMonth() + extraMonths, 1);

  return {
    originalPayoffDate: stdPayoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    newPayoffDate: extraPayoff.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    monthsSaved: stdMonths - extraMonths,
    interestSaved: Math.round(stdInterest - extraInterest),
    originalTotalInterest: Math.round(stdInterest),
    newTotalInterest: Math.round(extraInterest),
  };
}

// Generate scheduled (no-extra) balance curve for comparison
export function generateScheduledBalanceCurve(mortgage: MortgageProfile): { date: string; balance: number }[] {
  const rate = mortgage.interestRate / 100 / 12;
  const totalMonths = mortgage.loanTermYears * 12;
  const basePayment = mortgage.monthlyPayment;
  const startDate = new Date(mortgage.loanStartDate);
  let balance = mortgage.originalLoanAmount;
  const points: { date: string; balance: number }[] = [];

  for (let i = 0; i < totalMonths && balance > 0; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + 1 + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const interest = balance * rate;
    const principal = Math.min(basePayment - interest, balance);
    balance = Math.max(0, balance - principal);
    points.push({ date: ym, balance: Math.round(balance) });
  }
  return points;
}
