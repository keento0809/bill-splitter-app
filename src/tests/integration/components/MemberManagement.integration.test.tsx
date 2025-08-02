import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Group from '../../../pages/Group';
import type { Group as GroupType } from '../../../types/index.d.ts';

// storage_service のモック
vi.mock('../../../services/storage', () => ({
  storage_service: {
    get_group: vi.fn(),
    update_group: vi.fn(),
    save_group: vi.fn()
  }
}));

// react-router-dom のモック
const mockNavigate = vi.fn();
const mockParams = { groupId: 'test-group-123' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  };
});

describe('Member Management Integration Tests', () => {
  const mockGroup: GroupType = {
    id: 'test-group-123',
    name: 'テストグループ',
    members: [
      { id: '1', name: 'Alice', isActive: true, createdAt: new Date('2023-01-01') },
      { id: '2', name: 'Bob', isActive: true, createdAt: new Date('2023-01-01') },
      { id: '3', name: 'Charlie', isActive: false, createdAt: new Date('2023-01-01') }
    ],
    payments: [
      {
        id: 'payment-1',
        payerId: '1',
        amount: 3000,
        description: 'ホテル代',
        participants: ['1', '2'],
        excludedMembers: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      }
    ],
    settings: {
      roundingUnit: 100,
      includeTax: false,
      taxRate: 0.1
    },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { storage_service } = await import('../../../services/storage');
    vi.mocked(storage_service.get_group).mockResolvedValue(mockGroup);
    vi.mocked(storage_service.update_group).mockResolvedValue(undefined);
  });

  describe('基本的なレンダリング', () => {
    it('グループページが正しく読み込まれる', async () => {
      render(
        <MemoryRouter>
          <Group />
        </MemoryRouter>
      );

      // ページの読み込み待機
      await waitFor(() => {
        expect(screen.getByTestId('group-name')).toBeInTheDocument();
      });

      // メンバーセクションが表示される
      expect(screen.getByText(/メンバー/)).toBeInTheDocument();
      
      // 支払いセクションが表示される（より具体的なセレクター）
      expect(screen.getByTestId('add-payment-button')).toBeInTheDocument();

      // 計算セクションが表示される
      expect(screen.getByText(/清算結果/)).toBeInTheDocument();
    });

    it('メンバーセクションの基本機能確認', async () => {
      render(
        <MemoryRouter>
          <Group />
        </MemoryRouter>
      );

      // ページの読み込み待機
      await waitFor(() => {
        expect(screen.getByTestId('group-name')).toBeInTheDocument();
      });

      // メンバー追加フォームが表示される
      expect(screen.getByTestId('add-member-input')).toBeInTheDocument();
      expect(screen.getByTestId('add-member-button')).toBeInTheDocument();

      // 既存メンバーが表示される（実際に表示されているものをテスト）
      const memberItems = screen.getAllByTestId(/member-item-/);
      expect(memberItems.length).toBeGreaterThan(0);
    });
  });
});