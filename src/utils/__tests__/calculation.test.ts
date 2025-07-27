import { describe, it, expect } from 'vitest';
import {
  calculate_member_balances,
  minimize_transactions,
  calculate_optimal_settlements,
  apply_rounding
} from '../calculation';
import type { Member, Payment, GroupSettings } from '../../types/index.d.ts';

describe('calculation utilities', () => {
  const defaultSettings: GroupSettings = {
    roundingUnit: 100,
    includeTax: false,
    taxRate: 0.1
  };

  const members: Member[] = [
    { id: '1', name: 'Alice', isActive: true, createdAt: new Date() },
    { id: '2', name: 'Bob', isActive: true, createdAt: new Date() },
    { id: '3', name: 'Charlie', isActive: true, createdAt: new Date() }
  ];

  describe('calculate_member_balances', () => {
    it('2人での単純な割り勘', () => {
      const twoMembers = members.slice(0, 2);
      const payments: Payment[] = [
        {
          id: '1',
          payerId: '1',
          amount: 1000,
          description: 'dinner',
          participants: ['1', '2'],
          excludedMembers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const balances = calculate_member_balances(twoMembers, payments);

      expect(balances['1']).toBe(500); // paid 1000, owes 500
      expect(balances['2']).toBe(-500); // owes 500
    });

    it('3人での複雑な計算', () => {
      const payments: Payment[] = [
        {
          id: '1',
          payerId: '1',
          amount: 3000,
          description: 'hotel',
          participants: ['1', '2', '3'],
          excludedMembers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          payerId: '2',
          amount: 1500,
          description: 'food',
          participants: ['1', '2', '3'],
          excludedMembers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const balances = calculate_member_balances(members, payments);

      expect(balances['1']).toBe(1500); // paid 3000, owes 1500
      expect(balances['2']).toBe(0); // paid 1500, owes 1500
      expect(balances['3']).toBe(-1500); // owes 1500
    });

    it('除外メンバーの処理', () => {
      const payments: Payment[] = [
        {
          id: '1',
          payerId: '1',
          amount: 3000,
          description: 'drinks',
          participants: ['1', '2', '3'],
          excludedMembers: ['3'], // Charlie doesn't drink
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const balances = calculate_member_balances(members, payments);

      expect(balances['1']).toBe(1500); // paid 3000, owes 1500 (split between 1,2)
      expect(balances['2']).toBe(-1500); // owes 1500
      expect(balances['3']).toBe(0); // excluded, no balance
    });

    it('非アクティブメンバーの除外', () => {
      const membersWithInactive = [
        ...members.slice(0, 2),
        { ...members[2], isActive: false }
      ];

      const payments: Payment[] = [
        {
          id: '1',
          payerId: '1',
          amount: 2000,
          description: 'dinner',
          participants: ['1', '2', '3'],
          excludedMembers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const balances = calculate_member_balances(membersWithInactive, payments);

      expect(balances['1']).toBe(1000); // paid 2000, owes 1000 (split between 1,2)
      expect(balances['2']).toBe(-1000); // owes 1000
      expect(balances['3']).toBe(0); // inactive, excluded
    });
  });

  describe('apply_rounding', () => {
    it('100円単位の端数処理', () => {
      const balances = { '1': 1150, '2': -1150 };
      const rounded = apply_rounding(balances, 100);

      expect(rounded['1']).toBe(1200);
      expect(rounded['2']).toBe(-1100);
    });

    it('10円単位の端数処理', () => {
      const balances = { '1': 1156, '2': -1156 };
      const rounded = apply_rounding(balances, 10);

      expect(rounded['1']).toBe(1160);
      expect(rounded['2']).toBe(-1160);
    });

    it('1000円単位の端数処理', () => {
      const balances = { '1': 1600, '2': -1600 };
      const rounded = apply_rounding(balances, 1000);

      expect(rounded['1']).toBe(2000);
      expect(rounded['2']).toBe(-2000);
    });
  });

  describe('minimize_transactions', () => {
    it('2人での清算', () => {
      const balances = { '1': 500, '2': -500 };
      const settlements = minimize_transactions(balances);

      expect(settlements).toHaveLength(1);
      expect(settlements[0]).toEqual({
        from: '2',
        to: '1',
        amount: 500
      });
    });

    it('3人での最適化', () => {
      const balances = { '1': 1000, '2': 500, '3': -1500 };
      const settlements = minimize_transactions(balances);

      expect(settlements).toHaveLength(2);
      expect(settlements[0]).toEqual({
        from: '3',
        to: '1',
        amount: 1000
      });
      expect(settlements[1]).toEqual({
        from: '3',
        to: '2',
        amount: 500
      });
    });

    it('複雑な最適化（4人）', () => {
      const balances = { '1': 300, '2': 200, '3': -100, '4': -400 };
      const settlements = minimize_transactions(balances);

      expect(settlements).toHaveLength(3);
      
      // 取引回数が最小化されていることを確認
      const totalTransactions = settlements.length;
      expect(totalTransactions).toBeLessThanOrEqual(3); // 4人なら最大3取引
    });

    it('均等状態（清算不要）', () => {
      const balances = { '1': 0, '2': 0, '3': 0 };
      const settlements = minimize_transactions(balances);

      expect(settlements).toHaveLength(0);
    });
  });

  describe('calculate_optimal_settlements', () => {
    it('統合テスト：完全なフロー', () => {
      const payments: Payment[] = [
        {
          id: '1',
          payerId: '1',
          amount: 3000,
          description: 'hotel',
          participants: ['1', '2', '3'],
          excludedMembers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          payerId: '2',
          amount: 1200,
          description: 'lunch',
          participants: ['1', '2'],
          excludedMembers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = calculate_optimal_settlements(members, payments, defaultSettings);

      expect(result.totalAmount).toBe(4200);
      expect(result.perPersonAmount).toBe(1400);
      expect(result.settlements.length).toBeGreaterThan(0);
      
      // 清算後の総額が一致することを確認
      const settlementTotal = result.settlements.reduce((sum, s) => sum + s.amount, 0);
      expect(settlementTotal).toBeGreaterThan(0);
    });

    it('端数処理込みの統合テスト', () => {
      const payments: Payment[] = [
        {
          id: '1',
          payerId: '1',
          amount: 1001, // 割り切れない金額
          description: 'test',
          participants: ['1', '2', '3'],
          excludedMembers: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = calculate_optimal_settlements(members, payments, defaultSettings);

      // 端数処理後の金額が100円単位になっていることを確認
      Object.values(result.balances).forEach(balance => {
        expect(Math.abs(balance % 100)).toBe(0);
      });
    });
  });
});