import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Member } from '../../types/index.d.ts';

interface HamburgerMenuProps {
  groupId?: string;
  onShare?: () => void;
  shareText?: string;
  members?: Member[];
  onMembersClick?: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  groupId,
  onShare,
  shareText = 'シェア',
  members = [],
  onMembersClick
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handle_click_outside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handle_click_outside);
      return () => document.removeEventListener('mousedown', handle_click_outside);
    }
  }, [isOpen]);

  const handle_home_click = () => {
    setIsOpen(false);
    navigate('/');
  };

  const handle_share_click = () => {
    setIsOpen(false);
    if (onShare) {
      onShare();
    }
  };

  const handle_members_click = () => {
    setIsOpen(false);
    if (onMembersClick) {
      onMembersClick();
    }
  };

  const active_members_count = members.filter(m => m.isActive).length;

  return (
    <div className="relative" ref={menuRef} data-testid="hamburger-menu">
      {/* ハンバーガーボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
        aria-label="メニューを開く"
        data-testid="hamburger-button"
      >
        <div className="w-6 h-6 flex flex-col justify-center space-y-1">
          <span
            className={`block h-0.5 w-6 bg-gray-600 transform transition-transform duration-200 ${
              isOpen ? 'rotate-45 translate-y-1.5' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-gray-600 transition-opacity duration-200 ${
              isOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-gray-600 transform transition-transform duration-200 ${
              isOpen ? '-rotate-45 -translate-y-1.5' : ''
            }`}
          />
        </div>
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          data-testid="hamburger-dropdown"
        >
          {/* メンバー管理 */}
          {onMembersClick && (
            <button
              onClick={handle_members_click}
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              data-testid="menu-members-button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <span>メンバー ({active_members_count}人)</span>
            </button>
          )}

          <button
            onClick={handle_home_click}
            className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            data-testid="menu-home-button"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>ホーム</span>
          </button>

          {groupId && onShare && (
            <button
              onClick={handle_share_click}
              className="w-full px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
              data-testid="menu-share-button"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                />
              </svg>
              <span>{shareText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;