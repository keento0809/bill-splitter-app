import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storage_service } from '../../../services/storage';
import type { Group } from '../../../types/index.d.ts';

// localStorage のモック
const localStorageMock = (() => {
  let store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    get length() {
      return store.size;
    },
    key: vi.fn((index: number) => Array.from(store.keys())[index] || null)
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// console.warn と console.error のモック
const mockConsole = {
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {})
};

describe('storage_service', () => {
  const mockGroup: Group = {
    id: 'test-group-123',
    name: 'テストグループ',
    members: [
      { id: '1', name: 'Alice', isActive: true, createdAt: new Date('2023-01-01T00:00:00Z') },
      { id: '2', name: 'Bob', isActive: true, createdAt: new Date('2023-01-01T00:00:00Z') }
    ],
    payments: [
      {
        id: 'payment-1',
        payerId: '1',
        amount: 1000,
        description: 'テスト支払い',
        participants: ['1', '2'],
        excludedMembers: [],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      }
    ],
    settings: {
      roundingUnit: 100,
      includeTax: false,
      taxRate: 0.1
    },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T00:00:00Z')
  };

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    mockConsole.warn.mockClear();
    mockConsole.error.mockClear();
  });

  describe('get_group', () => {
    it('存在しないグループIDでnullを返す', async () => {
      const result = await storage_service.get_group('non-existent');
      expect(result).toBeNull();
    });

    it('無効なグループIDでnullを返す', async () => {
      expect(await storage_service.get_group('')).toBeNull();
      expect(await storage_service.get_group('a'.repeat(101))).toBeNull(); // 100文字超過
    });

    it('存在するグループを正常に取得', async () => {
      // グループデータを直接localStorageに保存
      localStorageMock.setItem(
        'bill_splitter_group_test-group-123',
        JSON.stringify(mockGroup)
      );

      const result = await storage_service.get_group('test-group-123');
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-group-123');
      expect(result?.name).toBe('テストグループ');
      expect(result?.members).toHaveLength(2);
      expect(result?.payments).toHaveLength(1);
    });

    it('日付の復元が正常に行われる', async () => {
      localStorageMock.setItem(
        'bill_splitter_group_test-group-123',
        JSON.stringify(mockGroup)
      );

      const result = await storage_service.get_group('test-group-123');
      
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
      expect(result?.members[0].createdAt).toBeInstanceOf(Date);
      expect(result?.payments[0].createdAt).toBeInstanceOf(Date);
      expect(result?.payments[0].updatedAt).toBeInstanceOf(Date);
    });

    it('不正なJSONデータでnullを返す', async () => {
      localStorageMock.setItem(
        'bill_splitter_group_test-group-123',
        'invalid json'
      );

      const result = await storage_service.get_group('test-group-123');
      expect(result).toBeNull();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('必須フィールドが欠けているデータでnullを返す', async () => {
      const invalidGroup = { id: 'test', name: '' }; // members, paymentsが欠如
      localStorageMock.setItem(
        'bill_splitter_group_test-group-123',
        JSON.stringify(invalidGroup)
      );

      const result = await storage_service.get_group('test-group-123');
      expect(result).toBeNull();
    });
  });

  describe('save_group', () => {
    it('有効なグループの保存', async () => {
      await storage_service.save_group(mockGroup);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bill_splitter_group_test-group-123',
        expect.stringContaining('"id":"test-group-123"')
      );
      
      // グループリストにも追加されることを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bill_splitter_groups_list',
        expect.stringContaining('test-group-123')
      );
    });

    it('無効なグループでエラーが発生', async () => {
      const invalidGroup = { id: '', name: '', members: [], payments: [], settings: mockGroup.settings, createdAt: new Date(), updatedAt: new Date() };
      
      await expect(storage_service.save_group(invalidGroup)).rejects.toThrow('無効なグループデータ');
    });

    it('整合性ハッシュが生成される', async () => {
      await storage_service.save_group(mockGroup);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bill_splitter_group_test-group-123_integrity',
        expect.any(String)
      );
    });

    it('既存のグループリストに追加される', async () => {
      // 既存のグループリストを設定
      localStorageMock.setItem('bill_splitter_groups_list', JSON.stringify(['existing-group']));
      
      await storage_service.save_group(mockGroup);

      const groupsListCalls = localStorageMock.setItem.mock.calls
        .filter(call => call[0] === 'bill_splitter_groups_list');
      
      const lastCall = groupsListCalls[groupsListCalls.length - 1];
      const groupsList = JSON.parse(lastCall[1]);
      
      expect(groupsList).toContain('existing-group');
      expect(groupsList).toContain('test-group-123');
    });

    it('重複グループIDは追加されない', async () => {
      localStorageMock.setItem('bill_splitter_groups_list', JSON.stringify(['test-group-123']));
      vi.clearAllMocks(); // 既存のsetItemをクリア
      
      await storage_service.save_group(mockGroup);

      const groupsListCalls = localStorageMock.setItem.mock.calls
        .filter(call => call[0] === 'bill_splitter_groups_list');
      
      // グループリストが更新されないことを確認（重複なので追加されない）
      expect(groupsListCalls).toHaveLength(0);
    });
  });

  describe('update_group', () => {
    it('存在するグループの更新', async () => {
      // 既存グループを保存
      await storage_service.save_group(mockGroup);
      vi.clearAllMocks();

      // 更新
      await storage_service.update_group('test-group-123', { name: '更新されたグループ' });

      // save_groupが呼ばれることを確認
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bill_splitter_group_test-group-123',
        expect.stringContaining('"name":"更新されたグループ"')
      );
    });

    it('存在しないグループの更新は何もしない', async () => {
      await storage_service.update_group('non-existent', { name: '更新' });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('updatedAtが更新される', async () => {
      await storage_service.save_group(mockGroup);
      
      const originalUpdatedAt = mockGroup.updatedAt;
      
      // 少し時間を進める
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);
      
      await storage_service.update_group('test-group-123', { name: '更新' });
      
      const updated = await storage_service.get_group('test-group-123');
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      
      vi.useRealTimers();
    });
  });

  describe('delete_group', () => {
    it('グループとハッシュが削除される', async () => {
      await storage_service.save_group(mockGroup);
      vi.clearAllMocks();

      await storage_service.delete_group('test-group-123');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('bill_splitter_group_test-group-123');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('bill_splitter_group_test-group-123_integrity');
    });

    it('グループリストからも削除される', async () => {
      localStorageMock.setItem('bill_splitter_groups_list', JSON.stringify(['test-group-123', 'other-group']));
      
      await storage_service.delete_group('test-group-123');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'bill_splitter_groups_list',
        JSON.stringify(['other-group'])
      );
    });

    it('無効なIDでは何もしない', async () => {
      await storage_service.delete_group('');

      expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('get_groups_list', () => {
    it('空のリストを返す（初期状態）', async () => {
      const result = await storage_service.get_groups_list();
      expect(result).toEqual([]);
    });

    it('保存されたグループリストを返す', async () => {
      localStorageMock.setItem('bill_splitter_groups_list', JSON.stringify(['group1', 'group2']));
      
      const result = await storage_service.get_groups_list();
      expect(result).toEqual(['group1', 'group2']);
    });

    it('不正なJSONでは空配列を返す', async () => {
      localStorageMock.setItem('bill_splitter_groups_list', 'invalid json');
      
      const result = await storage_service.get_groups_list();
      expect(result).toEqual([]);
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('配列でないデータでは空配列を返す', async () => {
      localStorageMock.setItem('bill_splitter_groups_list', JSON.stringify('not an array'));
      
      const result = await storage_service.get_groups_list();
      expect(result).toEqual([]);
    });

    it('無効な文字列をフィルタリング', async () => {
      const invalidList = ['valid-id', '', null, 'a'.repeat(101), 123];
      localStorageMock.setItem('bill_splitter_groups_list', JSON.stringify(invalidList));
      
      const result = await storage_service.get_groups_list();
      expect(result).toEqual(['valid-id']);
    });
  });

  describe('clear_all_data', () => {
    it('すべてのグループデータが削除される', async () => {
      // 複数のグループを保存
      await storage_service.save_group(mockGroup);
      await storage_service.save_group({ ...mockGroup, id: 'group2' });
      vi.clearAllMocks();

      await storage_service.clear_all_data();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('bill_splitter_group_test-group-123');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('bill_splitter_group_test-group-123_integrity');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('bill_splitter_group_group2');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('bill_splitter_group_group2_integrity');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('bill_splitter_groups_list');
    });

    it('エラーが発生してもクラッシュしない', async () => {
      localStorageMock.setItem('bill_splitter_groups_list', 'invalid json');
      
      await expect(storage_service.clear_all_data()).resolves.not.toThrow();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });

  describe('データ整合性チェック', () => {
    it('正常なハッシュで取得成功', async () => {
      await storage_service.save_group(mockGroup);
      
      const result = await storage_service.get_group('test-group-123');
      expect(result).not.toBeNull();
    });

    it('ハッシュが一致しない場合は警告してnullを返す', async () => {
      await storage_service.save_group(mockGroup);
      
      // ハッシュを意図的に変更
      localStorageMock.setItem('bill_splitter_group_test-group-123_integrity', 'invalid-hash');
      
      const result = await storage_service.get_group('test-group-123');
      expect(result).toBeNull();
      expect(mockConsole.warn).toHaveBeenCalledWith('データの整合性チェックに失敗しました');
    });

    it('ハッシュが存在しない場合は通常通り取得', async () => {
      localStorageMock.setItem(
        'bill_splitter_group_test-group-123',
        JSON.stringify(mockGroup)
      );
      // ハッシュは設定しない
      
      const result = await storage_service.get_group('test-group-123');
      expect(result).not.toBeNull();
    });
  });

  describe('エラーハンドリング', () => {
    it('localStorage.getItemがエラーの場合', async () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      const result = await storage_service.get_group('test-group-123');
      expect(result).toBeNull();
      expect(mockConsole.error).toHaveBeenCalled();
    });

    it('localStorage.setItemがエラーの場合', async () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      await expect(storage_service.save_group(mockGroup)).rejects.toThrow();
    });
  });
});