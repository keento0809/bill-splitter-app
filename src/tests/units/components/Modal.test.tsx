import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../../../components/common/Modal';

describe('Modal component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // body overflow 初期化
    document.body.style.overflow = 'unset';
  });

  afterEach(() => {
    // クリーンアップ
    document.body.style.overflow = 'unset';
  });

  it('isOpen=falseの時は何も表示されない', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    
    expect(screen.queryByText('モーダルコンテンツ')).not.toBeInTheDocument();
  });

  it('isOpen=trueの時にモーダルが表示される', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>モーダルコンテンツ</p>
      </Modal>
    );
    
    expect(screen.getByText('モーダルコンテンツ')).toBeInTheDocument();
  });

  it('タイトルが表示される', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="テストタイトル">
        <p>コンテンツ</p>
      </Modal>
    );
    
    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('テストタイトル');
  });

  it('タイトルなしの場合はヘッダーが表示されない', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>コンテンツ</p>
      </Modal>
    );
    
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument();
  });

  it('閉じるボタンのクリック', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="テスト">
        <p>コンテンツ</p>
      </Modal>
    );
    
    const closeButton = screen.getByTestId('modal-close-button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('バックドロップクリックで閉じる', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} data-testid="modal-backdrop">
        <p>コンテンツ</p>
      </Modal>
    );
    
    const backdrop = screen.getByTestId('modal-backdrop');
    fireEvent.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('モーダルコンテンツクリックでは閉じない', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>コンテンツ</p>
      </Modal>
    );
    
    const content = screen.getByText('コンテンツ');
    fireEvent.click(content);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('Escapeキーで閉じる', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>コンテンツ</p>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('Escape以外のキーでは閉じない', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>コンテンツ</p>
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Space' });
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('モーダルが開いているときにbody overflowが無効化される', () => {
    const { unmount } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>コンテンツ</p>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('サイズクラスの適用', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        <p>小</p>
      </Modal>
    );
    
    let modalContent = screen.getByText('小').closest('.bg-white');
    expect(modalContent).toHaveClass('max-w-md');

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="md">
        <p>中</p>
      </Modal>
    );
    modalContent = screen.getByText('中').closest('.bg-white');
    expect(modalContent).toHaveClass('max-w-lg');

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        <p>大</p>
      </Modal>
    );
    modalContent = screen.getByText('大').closest('.bg-white');
    expect(modalContent).toHaveClass('max-w-2xl');

    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="xl">
        <p>特大</p>
      </Modal>
    );
    modalContent = screen.getByText('特大').closest('.bg-white');
    expect(modalContent).toHaveClass('max-w-4xl');
  });

  it('デフォルトサイズはmd', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>デフォルト</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('デフォルト').closest('.bg-white');
    expect(modalContent).toHaveClass('max-w-lg');
  });

  it('カスタムクラス名の適用', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} className="custom-modal-class">
        <p>カスタム</p>
      </Modal>
    );
    
    const modalContent = screen.getByText('カスタム').closest('.bg-white');
    expect(modalContent).toHaveClass('custom-modal-class');
  });

  it('data-testidの設定', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} data-testid="test-modal">
        <p>テスト</p>
      </Modal>
    );
    
    expect(screen.getByTestId('test-modal')).toBeInTheDocument();
  });

  it('モーダルの基本構造', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="構造テスト">
        <p>構造確認</p>
      </Modal>
    );
    
    // バックドロップの存在確認
    const backdrop = screen.getByText('構造確認').closest('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('bg-black', 'bg-opacity-50', 'z-50');
    
    // モーダルコンテンツの存在確認
    const modalContent = screen.getByText('構造確認').closest('.bg-white');
    expect(modalContent).toHaveClass('rounded-lg', 'shadow-xl', 'animate-fade-in');
  });

  it('イベントリスナーのクリーンアップ', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>クリーンアップテスト</p>
      </Modal>
    );
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  it('複数のモーダルの重複時のoverflow管理', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <p>モーダル1</p>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('unset');
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>モーダル1</p>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <Modal isOpen={false} onClose={mockOnClose}>
        <p>モーダル1</p>
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('unset');
  });
});