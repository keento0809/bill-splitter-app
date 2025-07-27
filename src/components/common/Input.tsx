import type { InputType } from '../../types/index.d.ts';
import { escape_html, generate_id } from '../../utils/helpers';

interface InputProps {
  id?: string;
  type?: InputType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  'data-testid'?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
  step,
  'data-testid': testId,
}) => {
  // セキュリティ強化: 安全なID生成
  const inputId = id || `input-${generate_id().substring(0, 8)}`;

  const baseClasses = 'w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:bg-gray-100 disabled:cursor-not-allowed';
  
  const errorClasses = error 
    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
    : 'border-gray-300 focus:border-primary focus:ring-blue-200';

  const classes = `${baseClasses} ${errorClasses} ${className}`.trim();

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {/* セキュリティ強化: ラベルのHTMLエスケープ */}
          <span dangerouslySetInnerHTML={{__html: escape_html(label)}} />
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={classes}
        min={min}
        max={max}
        step={step}
        data-testid={testId}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {/* セキュリティ強化: エラーメッセージのHTMLエスケープ */}
          <span dangerouslySetInnerHTML={{__html: escape_html(error)}} />
        </p>
      )}
    </div>
  );
};

export default Input;