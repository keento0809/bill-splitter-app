import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../../../components/common/Input';

describe('Input component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('基本的なレンダリング', () => {
    render(<Input value="test value" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('test value');
  });

  it('ラベルの表示', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        label="テストラベル" 
      />
    );
    expect(screen.getByText('テストラベル')).toBeInTheDocument();
  });

  it('必須フィールドマーカーの表示', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        label="必須フィールド" 
        required 
      />
    );
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-red-500');
  });

  it('プレースホルダーの表示', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        placeholder="入力してください" 
      />
    );
    expect(screen.getByPlaceholderText('入力してください')).toBeInTheDocument();
  });

  it('onChange イベントの処理', () => {
    render(<Input value="" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(mockOnChange).toHaveBeenCalledWith('new value');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('disabled 状態', () => {
    render(<Input value="test" onChange={mockOnChange} disabled />);
    const input = screen.getByRole('textbox');
    
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-100', 'disabled:cursor-not-allowed');
  });

  it('エラー状態の表示', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        error="エラーメッセージ" 
      />
    );
    
    const errorMessage = screen.getByRole('alert');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent('エラーメッセージ');
    expect(errorMessage).toHaveClass('text-red-600');
  });

  it('エラー時のスタイル適用', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        error="エラー" 
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-200');
  });

  it('正常時のスタイル適用', () => {
    render(<Input value="" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-gray-300', 'focus:border-primary', 'focus:ring-blue-200');
  });

  it('カスタムクラス名の適用', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        className="custom-class" 
      />
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('数値入力タイプ', () => {
    render(
      <Input 
        value="123" 
        onChange={mockOnChange} 
        type="number"
        min={0}
        max={1000}
        step={1}
      />
    );
    
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '1000');
    expect(input).toHaveAttribute('step', '1');
  });

  it('data-testid の設定', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        data-testid="test-input" 
      />
    );
    expect(screen.getByTestId('test-input')).toBeInTheDocument();
  });

  it('IDの自動生成', () => {
    render(<Input value="" onChange={mockOnChange} label="テストラベル" />);
    const input = screen.getByLabelText('テストラベル');
    
    const inputId = input.getAttribute('id');
    
    expect(inputId).toBeTruthy();
    expect(inputId).toMatch(/^input-[a-f0-9]{8}$/);
  });

  it('カスタムIDの使用', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        id="custom-id" 
        label="テストラベル" 
      />
    );
    
    const input = screen.getByLabelText('テストラベル');
    
    expect(input).toHaveAttribute('id', 'custom-id');
  });

  it('HTMLエスケープの動作確認', () => {
    const maliciousLabel = '<script>alert("xss")</script>';
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        label={maliciousLabel}
      />
    );
    
    // ラベルがエスケープされて安全に表示されることを確認
    expect(screen.getByText(maliciousLabel)).toBeInTheDocument();
    // scriptタグが実行されないことを確認（textContentとして表示される）
    expect(document.querySelector('script')).toBeNull();
  });

  it('エラーメッセージのHTMLエスケープ', () => {
    const maliciousError = '<img src="x" onerror="alert(1)">';
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        error={maliciousError}
      />
    );
    
    // エラーメッセージがエスケープされて安全に表示されることを確認
    expect(screen.getByRole('alert')).toHaveTextContent(maliciousError);
    // imgタグが実行されないことを確認
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it('required属性の設定', () => {
    render(
      <Input 
        value="" 
        onChange={mockOnChange} 
        required 
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  it('異なる入力タイプの対応', () => {
    const { rerender } = render(
      <Input value="" onChange={mockOnChange} type="email" />
    );
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

    rerender(<Input value="" onChange={mockOnChange} type="number" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');

    rerender(<Input value="" onChange={mockOnChange} type="text" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });
});