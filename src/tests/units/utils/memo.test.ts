import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculation_memoizer } from '../../../utils/memo';
import type { Member, Payment, GroupSettings, CalculationResult } from '../../../types/index.d.ts';

describe('calculation memoizer', () => {
  const mockMembers: Member[] = [
    { id: '1', name: 'Alice', isActive: true, createdAt: new Date('2023-01-01') },
    { id: '2', name: 'Bob', isActive: true, createdAt: new Date('2023-01-01') },
    { id: '3', name: 'Charlie', isActive: false, createdAt: new Date('2023-01-01') }
  ];

  const mockPayments: Payment[] = [
    {
      id: '1',
      payerId: '1',
      amount: 1000,
      description: 'Test payment',
      participants: ['1', '2'],
      excludedMembers: [],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01')
    }
  ];

  const mockSettings: GroupSettings = {
    roundingUnit: 100,
    includeTax: false,
    taxRate: 0.1
  };

  const mockResult: CalculationResult = {
    settlements: [{ from: '2', to: '1', amount: 500 }],
    totalAmount: 1000,
    perPersonAmount: 500,
    balances: { '1': 500, '2': -500 }
  };

  beforeEach(() => {
    calculation_memoizer.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基本的なメモ化機能', () => {
    it('キャッシュが空の場合はnullを返す', () => {
      const result = calculation_memoizer.get(mockMembers, mockPayments, mockSettings);
      expect(result).toBeNull();
    });

    it('値を設定して取得できる', () => {
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const result = calculation_memoizer.get(mockMembers, mockPayments, mockSettings);
      expect(result).toEqual(mockResult);
    });

    it('異なるデータでは異なるキャッシュエントリーになる', () => {
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const differentMembers = [
        { id: '3', name: 'Charlie', isActive: true, createdAt: new Date('2023-01-01') }
      ];
      
      const result = calculation_memoizer.get(differentMembers, mockPayments, mockSettings);
      expect(result).toBeNull();
    });
  });

  describe('キー生成ロジック', () => {
    it('メンバーの順序が異なっても同じキーが生成される', () => {
      const members1 = [mockMembers[0], mockMembers[1]];
      const members2 = [mockMembers[1], mockMembers[0]];
      
      calculation_memoizer.set(members1, mockPayments, mockSettings, mockResult);
      
      const result = calculation_memoizer.get(members2, mockPayments, mockSettings);
      expect(result).toEqual(mockResult);
    });

    it('支払いの順序が異なっても同じキーが生成される', () => {
      const payment2: Payment = {
        id: '2',
        payerId: '2',
        amount: 500,
        description: 'Another payment',
        participants: ['1', '2'],
        excludedMembers: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };

      const payments1 = [mockPayments[0], payment2];
      const payments2 = [payment2, mockPayments[0]];
      
      calculation_memoizer.set(mockMembers, payments1, mockSettings, mockResult);
      
      const result = calculation_memoizer.get(mockMembers, payments2, mockSettings);
      expect(result).toEqual(mockResult);
    });

    it('メンバーのisActiveが変わると異なるキーになる', () => {
      const modifiedMembers = mockMembers.map(m => 
        m.id === '3' ? { ...m, isActive: true } : m
      );
      
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const result = calculation_memoizer.get(modifiedMembers, mockPayments, mockSettings);
      expect(result).toBeNull();
    });

    it('設定が変わると異なるキーになる', () => {
      const differentSettings: GroupSettings = {
        ...mockSettings,
        roundingUnit: 10
      };
      
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const result = calculation_memoizer.get(mockMembers, mockPayments, differentSettings);
      expect(result).toBeNull();
    });
  });

  describe('TTL（Time To Live）機能', () => {
    it('TTL期限内では値が取得できる', () => {
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      // 4分経過（TTLは5分）
      vi.advanceTimersByTime(4 * 60 * 1000);
      
      const result = calculation_memoizer.get(mockMembers, mockPayments, mockSettings);
      expect(result).toEqual(mockResult);
    });

    it('TTL期限切れで値が削除される', () => {
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      // 6分経過（TTLは5分）
      vi.advanceTimersByTime(6 * 60 * 1000);
      
      const result = calculation_memoizer.get(mockMembers, mockPayments, mockSettings);
      expect(result).toBeNull();
    });

    it('TTL期限切れの項目がキャッシュから削除される', () => {
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const statsBefore = calculation_memoizer.get_cache_stats();
      expect(statsBefore.size).toBe(1);
      
      vi.advanceTimersByTime(6 * 60 * 1000);
      calculation_memoizer.get(mockMembers, mockPayments, mockSettings);
      
      const statsAfter = calculation_memoizer.get_cache_stats();
      expect(statsAfter.size).toBe(0);
    });
  });

  describe('キャッシュサイズ制限', () => {
    it('キャッシュサイズが上限に達すると古いエントリーが削除される', () => {
      // キャッシュサイズの上限は50
      const maxSize = 50;
      
      // 上限を超えるまでエントリーを追加
      for (let i = 0; i <= maxSize; i++) {
        const uniqueMembers = [
          { id: `${i}`, name: `User${i}`, isActive: true, createdAt: new Date() }
        ];
        calculation_memoizer.set(uniqueMembers, mockPayments, mockSettings, mockResult);
      }
      
      const stats = calculation_memoizer.get_cache_stats();
      expect(stats.size).toBe(maxSize);
    });

    it('新しいエントリーが追加されると最も古いエントリーが削除される', () => {
      const maxSize = 50;
      
      // 最初のエントリー
      const firstMembers = [
        { id: 'first', name: 'First User', isActive: true, createdAt: new Date() }
      ];
      calculation_memoizer.set(firstMembers, mockPayments, mockSettings, mockResult);
      
      // 上限まで埋める
      for (let i = 1; i < maxSize; i++) {
        const uniqueMembers = [
          { id: `${i}`, name: `User${i}`, isActive: true, createdAt: new Date() }
        ];
        calculation_memoizer.set(uniqueMembers, mockPayments, mockSettings, mockResult);
      }
      
      // 最初のエントリーがまだ存在することを確認
      expect(calculation_memoizer.get(firstMembers, mockPayments, mockSettings)).toEqual(mockResult);
      
      // 新しいエントリーを追加（これで上限を超える）
      const newMembers = [
        { id: 'new', name: 'New User', isActive: true, createdAt: new Date() }
      ];
      calculation_memoizer.set(newMembers, mockPayments, mockSettings, mockResult);
      
      // 最初のエントリーが削除されていることを確認
      expect(calculation_memoizer.get(firstMembers, mockPayments, mockSettings)).toBeNull();
      
      // 新しいエントリーは存在することを確認
      expect(calculation_memoizer.get(newMembers, mockPayments, mockSettings)).toEqual(mockResult);
    });
  });

  describe('clear機能', () => {
    it('clearでキャッシュが空になる', () => {
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const statsBefore = calculation_memoizer.get_cache_stats();
      expect(statsBefore.size).toBe(1);
      
      calculation_memoizer.clear();
      
      const statsAfter = calculation_memoizer.get_cache_stats();
      expect(statsAfter.size).toBe(0);
      
      const result = calculation_memoizer.get(mockMembers, mockPayments, mockSettings);
      expect(result).toBeNull();
    });
  });

  describe('get_cache_stats機能', () => {
    it('正しい統計情報が返される', () => {
      const stats = calculation_memoizer.get_cache_stats();
      
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(50);
      expect(stats.ttl).toBe(5 * 60 * 1000); // 5分
    });

    it('エントリー追加後の統計情報', () => {
      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const stats = calculation_memoizer.get_cache_stats();
      expect(stats.size).toBe(1);
    });
  });

  describe('複雑なデータでのメモ化', () => {
    it('参加者リストと除外メンバーリストがソートされる', () => {
      const payment1: Payment = {
        ...mockPayments[0],
        participants: ['2', '1', '3'],
        excludedMembers: ['4', '5']
      };

      const payment2: Payment = {
        ...mockPayments[0],
        participants: ['1', '2', '3'],
        excludedMembers: ['5', '4']
      };

      calculation_memoizer.set(mockMembers, [payment1], mockSettings, mockResult);
      
      const result = calculation_memoizer.get(mockMembers, [payment2], mockSettings);
      expect(result).toEqual(mockResult);
    });

    it('税率設定の変更が検出される', () => {
      const settingsWithTax: GroupSettings = {
        ...mockSettings,
        includeTax: true,
        taxRate: 0.08
      };

      calculation_memoizer.set(mockMembers, mockPayments, mockSettings, mockResult);
      
      const result = calculation_memoizer.get(mockMembers, mockPayments, settingsWithTax);
      expect(result).toBeNull();
    });
  });
});