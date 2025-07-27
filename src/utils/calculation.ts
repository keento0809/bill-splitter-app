import type { Member, Payment, GroupSettings, CalculationResult, Settlement } from '../types/index.d.ts';
import { calculation_memoizer } from './memo';

export function calculate_member_balances(
  members: Member[],
  payments: Payment[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  members.forEach(member => {
    balances[member.id] = 0;
  });

  payments.forEach(payment => {
    const participants = payment.participants.filter(id => 
      !payment.excludedMembers.includes(id) &&
      members.find(m => m.id === id)?.isActive
    );

    if (participants.length === 0) return;

    const amountPerPerson = payment.amount / participants.length;

    balances[payment.payerId] += payment.amount;

    participants.forEach(participantId => {
      balances[participantId] -= amountPerPerson;
    });
  });

  return balances;
}

export function apply_rounding(
  balances: Record<string, number>,
  roundingUnit: 10 | 100 | 1000
): Record<string, number> {
  const rounded: Record<string, number> = {};

  Object.entries(balances).forEach(([memberId, balance]) => {
    rounded[memberId] = Math.round(balance / roundingUnit) * roundingUnit;
  });

  return rounded;
}

export function minimize_transactions(balances: Record<string, number>): Settlement[] {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  Object.entries(balances).forEach(([memberId, balance]) => {
    if (balance > 0) {
      creditors.push({ id: memberId, amount: balance });
    } else if (balance < 0) {
      debtors.push({ id: memberId, amount: -balance });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0) {
      settlements.push({
        from: debtor.id,
        to: creditor.id,
        amount
      });

      creditor.amount -= amount;
      debtor.amount -= amount;

      if (creditor.amount === 0) {
        creditors.shift();
      }
      if (debtor.amount === 0) {
        debtors.shift();
      }
    } else {
      break;
    }
  }

  return settlements;
}

export function calculate_total_amount(payments: Payment[]): number {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}

export function calculate_per_person_amount(
  payments: Payment[],
  members: Member[]
): number {
  const activeMembers = members.filter(m => m.isActive);
  if (activeMembers.length === 0) return 0;

  const totalAmount = calculate_total_amount(payments);
  return totalAmount / activeMembers.length;
}

export function calculate_optimal_settlements(
  members: Member[],
  payments: Payment[],
  settings: GroupSettings
): CalculationResult {
  // メモ化された結果をチェック
  const cached_result = calculation_memoizer.get(members, payments, settings);
  if (cached_result) {
    return cached_result;
  }

  // 新規計算
  const balances = calculate_member_balances(members, payments);
  const rounded_balances = apply_rounding(balances, settings.roundingUnit);
  const settlements = minimize_transactions(rounded_balances);

  const result: CalculationResult = {
    settlements,
    totalAmount: calculate_total_amount(payments),
    perPersonAmount: calculate_per_person_amount(payments, members),
    balances: rounded_balances
  };

  // 結果をメモ化
  calculation_memoizer.set(members, payments, settings, result);

  return result;
}