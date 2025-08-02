import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import HamburgerMenu from '../components/common/HamburgerMenu';
import MemberManagementModal from '../components/common/MemberManagementModal';
import PaymentSection from '../components/sections/PaymentSection';
import CalculationSection from '../components/sections/CalculationSection';
import { storage_service } from '../services/storage';
import { calculate_optimal_settlements } from '../utils/calculation';
import { copy_to_clipboard, get_share_url } from '../utils/helpers';
import type { Group, Member, Payment } from '../types/index.d.ts';

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);

  useEffect(() => {
    if (!groupId) {
      navigate('/');
      return;
    }

    const load_group = async () => {
      try {
        const loaded_group = await storage_service.get_group(groupId);
        if (!loaded_group) {
          setError('指定されたグループが見つかりません');
          return;
        }
        setGroup(loaded_group);
      } catch {
        setError('グループの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    load_group();
  }, [groupId, navigate]);

  const calculation_result = useMemo(() => {
    if (!group) return null;
    return calculate_optimal_settlements(group.members, group.payments, group.settings);
  }, [group]);

  const update_group = useCallback(async (updates: Partial<Group>) => {
    if (!group) return;
    
    const updated_group = { ...group, ...updates, updatedAt: new Date() };
    setGroup(updated_group);
    await storage_service.save_group(updated_group);
  }, [group]);

  const handle_members_change = useCallback((members: Member[]) => {
    update_group({ members });
  }, [update_group]);

  const handle_payments_change = useCallback((payments: Payment[]) => {
    update_group({ payments });
  }, [update_group]);

  const handle_share = async () => {
    if (!groupId) return;

    const url = get_share_url(groupId);
    const success = await copy_to_clipboard(url);
    
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handle_open_member_modal = () => {
    setIsMemberModalOpen(true);
  };

  const handle_close_member_modal = () => {
    setIsMemberModalOpen(false);
  };

  const handle_open_payment_form = () => {
    setIsPaymentFormOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="グループを読み込み中..." data-testid="group-loading" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              エラー
            </h1>
            <p className="text-gray-600 mb-4" data-testid="group-error">
              {error || 'グループが見つかりません'}
            </p>
            <Button onClick={() => navigate('/')} data-testid="back-to-home-button">
              ホームに戻る
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate" data-testid="group-name">
                {group.name}
              </h1>
            </div>
            
            {/* デスクトップ表示: 通常のボタン */}
            <div className="hidden md:flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handle_open_member_modal}
                data-testid="desktop-members-button"
              >
                メンバー ({group.members.filter(m => m.isActive).length}人)
              </Button>
              <Button
                variant="outline"
                onClick={handle_share}
                data-testid="share-group-button"
              >
                {copySuccess ? 'コピー済み!' : 'シェア'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                data-testid="back-to-home-button"
              >
                ホーム
              </Button>
            </div>

            {/* モバイル表示: ハンバーガーメニュー */}
            <div className="md:hidden">
              <HamburgerMenu
                groupId={groupId}
                onShare={handle_share}
                shareText={copySuccess ? 'コピー済み!' : 'シェア'}
                members={group.members}
                onMembersClick={handle_open_member_modal}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 md:py-8">
        {/* 支払い追加ボタン - ヘッダー直下 */}
        <div className="mb-4 md:mb-8">
          <Button
            onClick={handle_open_payment_form}
            disabled={group.members.filter(m => m.isActive).length === 0}
            data-testid="add-payment-button"
            className="w-full md:w-auto"
            size="lg"
          >
            支払い追加
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* 左側: 清算結果（最初に表示、常に開いた状態） */}
          <div className="space-y-4 md:space-y-8">
            <CalculationSection
              result={calculation_result}
              members={group.members}
            />
          </div>
          
          {/* 右側: 支払い履歴 */}
          <div className="space-y-4 md:space-y-8">
            <PaymentSection
              payments={group.payments}
              members={group.members}
              onPaymentsChange={handle_payments_change}
              isFormOpen={isPaymentFormOpen}
              onFormOpenChange={setIsPaymentFormOpen}
            />
          </div>
        </div>
      </main>

      {/* メンバー管理モーダル */}
      <MemberManagementModal
        isOpen={isMemberModalOpen}
        onClose={handle_close_member_modal}
        members={group.members}
        onMembersChange={handle_members_change}
      />
    </div>
  );
};

export default GroupPage;