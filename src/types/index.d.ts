export interface Member {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Payment {
  id: string;
  payerId: string;
  amount: number;
  description: string;
  participants: string[];
  excludedMembers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupSettings {
  roundingUnit: 10 | 100 | 1000;
  includeTax: boolean;
  taxRate: number;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  payments: Payment[];
  settings: GroupSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface CalculationResult {
  settlements: Settlement[];
  totalAmount: number;
  perPersonAmount: number;
  balances: Record<string, number>;
}

export interface PaymentFormData {
  amount: string;
  description: string;
  payerId: string;
  participants: string[];
  excludedMembers: string[];
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  paid: number;
  owes: number;
  balance: number;
}

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'number' | 'email';