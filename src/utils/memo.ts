// 計算結果のメモ化用ユーティリティ
import type { Member, Payment, GroupSettings, CalculationResult } from '../types/index.d.ts';

interface MemoizedCalculation {
  key: string;
  result: CalculationResult;
  timestamp: number;
}

const MEMO_CACHE_SIZE = 50;
const MEMO_CACHE_TTL = 5 * 60 * 1000; // 5分

class CalculationMemoizer {
  private cache = new Map<string, MemoizedCalculation>();

  private generate_key(
    members: Member[],
    payments: Payment[],
    settings: GroupSettings
  ): string {
    const membersHash = members
      .map(m => `${m.id}:${m.isActive}`)
      .sort()
      .join('|');
    
    const paymentsHash = payments
      .map(p => `${p.id}:${p.amount}:${p.payerId}:${p.participants.sort().join(',')}:${p.excludedMembers.sort().join(',')}`)
      .sort()
      .join('|');
    
    const settingsHash = `${settings.roundingUnit}:${settings.includeTax}:${settings.taxRate}`;
    
    return `${membersHash}##${paymentsHash}##${settingsHash}`;
  }

  get(
    members: Member[],
    payments: Payment[],
    settings: GroupSettings
  ): CalculationResult | null {
    const key = this.generate_key(members, payments, settings);
    const cached = this.cache.get(key);

    if (!cached) return null;

    // TTLチェック
    if (Date.now() - cached.timestamp > MEMO_CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  set(
    members: Member[],
    payments: Payment[],
    settings: GroupSettings,
    result: CalculationResult
  ): void {
    const key = this.generate_key(members, payments, settings);

    // キャッシュサイズ制限
    if (this.cache.size >= MEMO_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value as string;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      key,
      result,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  get_cache_stats() {
    return {
      size: this.cache.size,
      maxSize: MEMO_CACHE_SIZE,
      ttl: MEMO_CACHE_TTL
    };
  }
}

export const calculation_memoizer = new CalculationMemoizer();