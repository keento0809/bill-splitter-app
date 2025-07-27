export function generate_id(): string {
  // セキュリティ強化: crypto.randomUUID()を使用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // フォールバック: より強固なランダム生成
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function format_currency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0
  }).format(amount);
}

export function format_number(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

export function validate_amount(value: string): boolean {
  // セキュリティ強化: より厳密な数値検証
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 10000000 && Number.isFinite(num) && num === Number(value.trim());
}

export function validate_name(name: string): boolean {
  // セキュリティ強化: XSS対策として危険な文字を除外
  const trimmed = name.trim();
  const dangerousChars = /[<>"'&\x00-\x1f\x7f-\x9f]/;
  return trimmed.length > 0 && 
         trimmed.length <= 20 && 
         !dangerousChars.test(trimmed);
}

export function parse_amount(value: string): number {
  // セキュリティ強化: より安全な数値パース
  const sanitized = value.replace(/[^\d.-]/g, '');
  const num = parseFloat(sanitized);
  if (isNaN(num) || !Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(num, 10000000)); // 上限も適用
}

export function truncate_text(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function get_share_url(groupId: string): string {
  return `${window.location.origin}/group/${groupId}`;
}

export function copy_to_clipboard(text: string): Promise<boolean> {
  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
}

export function format_date(date: Date): string {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function calculate_percentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

// セキュリティ強化: XSS対策のためのテキストサニタイゼーション
export function sanitize_text(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// セキュリティ強化: 安全なHTMLエスケープ解除（必要な場合のみ）
export function escape_html(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// セキュリティ強化: データ整合性チェック用のハッシュ生成
export async function generate_data_hash(data: object): Promise<string> {
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}