export function generate_id(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
  const num = parseFloat(value);
  return !isNaN(num) && num > 0 && num <= 10000000;
}

export function validate_name(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 20;
}

export function parse_amount(value: string): number {
  const num = parseFloat(value.replace(/[^\d.-]/g, ''));
  return isNaN(num) ? 0 : Math.max(0, num);
}

export function truncate_text(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
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