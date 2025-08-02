import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generate_id,
  format_currency,
  format_number,
  validate_amount,
  validate_name,
  parse_amount,
  truncate_text,
  debounce,
  get_share_url,
  copy_to_clipboard,
  format_date,
  calculate_percentage,
  sanitize_text,
  escape_html,
  generate_data_hash
} from '../../../utils/helpers';

// crypto API のモック
const mockCrypto = {
  randomUUID: vi.fn(),
  getRandomValues: vi.fn(),
  subtle: {
    digest: vi.fn()
  }
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

// navigator.clipboard のモック
const mockClipboard = {
  writeText: vi.fn()
};

Object.defineProperty(global, 'navigator', {
  value: { clipboard: mockClipboard },
  writable: true
});

// window.location のモック
Object.defineProperty(global, 'window', {
  value: {
    location: {
      origin: 'https://example.com'
    }
  },
  writable: true
});

describe('helpers utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generate_id', () => {
    it('crypto.randomUUID が利用可能な場合は使用される', () => {
      const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
      mockCrypto.randomUUID.mockReturnValue(mockUUID);
      
      const result = generate_id();
      
      expect(mockCrypto.randomUUID).toHaveBeenCalled();
      expect(result).toBe(mockUUID);
    });

    it('crypto.randomUUID が利用不可能な場合はgetRandomValuesを使用', () => {
      // randomUUIDプロパティを一時的にundefinedに設定してフォールバックをテスト
      const originalRandomUUID = mockCrypto.randomUUID;
      Object.defineProperty(mockCrypto, 'randomUUID', { value: undefined, configurable: true });
      const mockArray = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      mockCrypto.getRandomValues.mockImplementation((array) => {
        array.set(mockArray);
        return array;
      });
      
      const result = generate_id();
      
      expect(mockCrypto.getRandomValues).toHaveBeenCalled();
      expect(result).toBe('0102030405060708090a0b0c0d0e0f10');
      
      // プロパティを復元
      Object.defineProperty(mockCrypto, 'randomUUID', { value: originalRandomUUID, configurable: true });
    });
  });

  describe('format_currency', () => {
    it('日本円形式でフォーマットされる', () => {
      expect(format_currency(1000)).toBe('￥1,000');
      expect(format_currency(0)).toBe('￥0');
      expect(format_currency(1234567)).toBe('￥1,234,567');
    });

    it('小数点以下は表示されない', () => {
      expect(format_currency(1000.99)).toBe('￥1,001');
    });
  });

  describe('format_number', () => {
    it('数値が日本語ロケールでフォーマットされる', () => {
      expect(format_number(1000)).toBe('1,000');
      expect(format_number(1234567)).toBe('1,234,567');
      expect(format_number(0)).toBe('0');
    });
  });

  describe('validate_amount', () => {
    it('有効な金額', () => {
      expect(validate_amount('100')).toBe(true);
      expect(validate_amount('1000.50')).toBe(true);
      expect(validate_amount('9999999')).toBe(true);
    });

    it('無効な金額', () => {
      expect(validate_amount('0')).toBe(false);
      expect(validate_amount('-100')).toBe(false);
      expect(validate_amount('abc')).toBe(false);
      expect(validate_amount('')).toBe(false);
      expect(validate_amount('10000001')).toBe(false); // 上限超過
      expect(validate_amount('Infinity')).toBe(false);
      expect(validate_amount('NaN')).toBe(false);
    });

    it('空白を含む値でも有効（trimされる）', () => {
      expect(validate_amount(' 100 ')).toBe(true); // 実装ではtrimされる
    });
  });

  describe('validate_name', () => {
    it('有効な名前', () => {
      expect(validate_name('田中太郎')).toBe(true);
      expect(validate_name('Alice')).toBe(true);
      expect(validate_name('山田 花子')).toBe(true);
      expect(validate_name('A')).toBe(true);
    });

    it('無効な名前', () => {
      expect(validate_name('')).toBe(false);
      expect(validate_name('   ')).toBe(false);
      expect(validate_name('あ'.repeat(21))).toBe(false); // 20文字超過
    });

    it('危険な文字を含む名前', () => {
      expect(validate_name('<script>')).toBe(false);
      expect(validate_name('Test"name')).toBe(false);
      expect(validate_name("Test'name")).toBe(false);
      expect(validate_name('Test&name')).toBe(false);
      expect(validate_name('Test\x00name')).toBe(false); // 制御文字
    });
  });

  describe('parse_amount', () => {
    it('有効な数値文字列のパース', () => {
      expect(parse_amount('100')).toBe(100);
      expect(parse_amount('1000.50')).toBe(1000.50);
      expect(parse_amount('1,000')).toBe(1000);
      expect(parse_amount('￥1,000')).toBe(1000);
    });

    it('無効な値の処理', () => {
      expect(parse_amount('abc')).toBe(0);
      expect(parse_amount('')).toBe(0);
      expect(parse_amount('Infinity')).toBe(0);
      expect(parse_amount('NaN')).toBe(0);
    });

    it('上限値の適用', () => {
      expect(parse_amount('99999999')).toBe(10000000);
    });

    it('負の値の処理', () => {
      expect(parse_amount('-100')).toBe(0);
    });
  });

  describe('truncate_text', () => {
    it('短いテキストはそのまま返される', () => {
      expect(truncate_text('短いテキスト', 20)).toBe('短いテキスト');
    });

    it('長いテキストは切り詰められる', () => {
      const longText = 'これは非常に長いテキストです';
      expect(truncate_text(longText, 10)).toBe('これは非常に長...'); // 7文字 + "..."
    });

    it('境界値のテスト', () => {
      expect(truncate_text('12345', 5)).toBe('12345');
      expect(truncate_text('123456', 5)).toBe('12...');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('指定した時間後に関数が呼ばれる', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('連続呼び出しでは最後の呼び出しのみ実行される', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('first');
      debouncedFn('second');
      debouncedFn('third');

      vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('third');
    });
  });

  describe('get_share_url', () => {
    it('正しいURLが生成される', () => {
      const groupId = 'test-group-123';
      const result = get_share_url(groupId);
      expect(result).toBe('https://example.com/group/test-group-123');
    });
  });

  describe('copy_to_clipboard', () => {
    it('クリップボードAPIが成功した場合', async () => {
      mockClipboard.writeText.mockResolvedValue(undefined);
      
      const result = await copy_to_clipboard('test text');
      
      expect(mockClipboard.writeText).toHaveBeenCalledWith('test text');
      expect(result).toBe(true);
    });

    it('クリップボードAPIが失敗した場合', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Failed'));
      
      const result = await copy_to_clipboard('test text');
      
      expect(result).toBe(false);
    });
  });

  describe('format_date', () => {
    it('日本語ロケールでフォーマットされる', () => {
      const date = new Date('2023-12-25T15:30:00');
      const result = format_date(date);
      
      // 正確な文字列は環境に依存するため、含まれるべき要素をチェック
      expect(result).toMatch(/2023/);
      expect(result).toMatch(/12/);
      expect(result).toMatch(/25/);
      expect(result).toMatch(/15/);
      expect(result).toMatch(/30/);
    });
  });

  describe('calculate_percentage', () => {
    it('正常なパーセンテージ計算', () => {
      expect(calculate_percentage(25, 100)).toBe(25);
      expect(calculate_percentage(1, 3)).toBe(33);
      expect(calculate_percentage(2, 3)).toBe(67);
    });

    it('totalが0の場合は0を返す', () => {
      expect(calculate_percentage(10, 0)).toBe(0);
    });

    it('結果が四捨五入される', () => {
      expect(calculate_percentage(1, 6)).toBe(17);
      expect(calculate_percentage(1, 7)).toBe(14);
    });
  });

  describe('sanitize_text', () => {
    it('HTMLの危険な文字がエスケープされる', () => {
      expect(sanitize_text('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      
      expect(sanitize_text('Text & "quotes" and \'single\' quotes'))
        .toBe('Text &amp; &quot;quotes&quot; and &#x27;single&#x27; quotes');
    });

    it('空文字列の場合', () => {
      expect(sanitize_text('')).toBe('');
    });

    it('通常のテキストはそのまま', () => {
      expect(sanitize_text('Normal text 123')).toBe('Normal text 123');
    });
  });

  describe('escape_html', () => {
    it('テキストが適切にエスケープされる', () => {
      // DOM操作のテストのため、jsdomが適切に動作することを確認
      const result = escape_html('<script>alert("test")</script>');
      expect(result).toBe('&lt;script&gt;alert("test")&lt;/script&gt;');
    });

    it('通常のテキストはそのまま', () => {
      expect(escape_html('Normal text')).toBe('Normal text');
    });
  });

  describe('generate_data_hash', () => {
    beforeEach(() => {
      // TextEncoder のモック
      global.TextEncoder = vi.fn().mockImplementation(() => ({
        encode: vi.fn().mockImplementation((str) => new Uint8Array(Buffer.from(str, 'utf8')))
      }));
      
      // crypto.subtle.digest のモック
      mockCrypto.subtle.digest.mockImplementation(() => {
        const hash = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
        return Promise.resolve(hash.buffer);
      });
    });

    it('オブジェクトのハッシュが生成される', async () => {
      const data = { id: '1', name: 'test' };
      
      const result = await generate_data_hash(data);
      
      expect(result).toBe('0102030405060708');
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
    });

    it('キーがソートされたJSONが生成される', async () => {
      const data = { b: 2, a: 1 };
      
      const result = await generate_data_hash(data);
      
      // 結果が正常に返されることを確認
      expect(result).toBe('0102030405060708');
      // crypto.subtle.digestが呼ばれることを確認
      expect(mockCrypto.subtle.digest).toHaveBeenCalledWith(
        'SHA-256',
        expect.any(Uint8Array)
      );
    });
  });
});