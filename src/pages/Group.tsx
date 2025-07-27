import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import MemberSection from '../components/sections/MemberSection';
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

  useEffect(() => {
    if (!groupId) {
      navigate('/');
      return;
    }

    const load_group = async () => {
      try {
        const loaded_group = storage_service.get_group(groupId);
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

  const update_group = useCallback((updates: Partial<Group>) => {
    if (!group) return;
    
    const updated_group = { ...group, ...updates, updatedAt: new Date() };
    setGroup(updated_group);
    storage_service.save_group(updated_group);
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900" data-testid="group-name">
                {group.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                グループID: {groupId}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handle_share}
                data-testid="share-group-button"
              >
                {copySuccess ? 'コピー済み!' : 'URLをシェア'}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                data-testid="back-to-home-button"
              >
                ホーム
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <MemberSection
              members={group.members}
              onMembersChange={handle_members_change}
            />
            <PaymentSection
              payments={group.payments}
              members={group.members}
              onPaymentsChange={handle_payments_change}
            />
          </div>
          <div>
            <CalculationSection
              result={calculation_result}
              members={group.members}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default GroupPage;