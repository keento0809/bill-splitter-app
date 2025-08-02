import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  isInitiallyOpen?: boolean;
  icon?: ReactNode;
  className?: string;
  'data-testid'?: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  isInitiallyOpen = true,
  icon,
  className = '',
  'data-testid': testId
}) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} data-testid={testId}>
      {/* ヘッダー部分 - クリック可能 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
        data-testid={`${testId}-toggle`}
      >
        <div className="flex items-center space-x-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <h2 className="text-lg font-semibold text-gray-900 text-left">
            {title}
          </h2>
        </div>
        
        {/* 折りたたみアイコン */}
        <div className="flex-shrink-0">
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* コンテンツ部分 - 折りたたみ可能 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
        data-testid={`${testId}-content`}
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleSection;