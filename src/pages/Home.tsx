import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { storage_service } from '../services/storage';
import { generate_id } from '../utils/helpers';
import type { Group, GroupSettings } from '../types/index.d.ts';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const create_group = async () => {
    if (!groupName.trim()) {
      setError('グループ名を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const groupId = generate_id();
      const defaultSettings: GroupSettings = {
        roundingUnit: 100,
        includeTax: false,
        taxRate: 0.1
      };

      const newGroup: Group = {
        id: groupId,
        name: groupName.trim(),
        members: [],
        payments: [],
        settings: defaultSettings,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await storage_service.save_group(newGroup);
      navigate(`/group/${groupId}`);
    } catch {
      setError('グループの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };


  const handle_group_name_change = (value: string) => {
    setGroupName(value);
    if (error) setError('');
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            割り勘アプリ
          </h1>
          <p className="text-gray-600">
            旅行やイベントの費用を簡単に清算
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              新しいグループを作成
            </h2>
            <div className="space-y-4">
              <Input
                label="グループ名"
                value={groupName}
                onChange={handle_group_name_change}
                placeholder="例: 沖縄旅行2024"
                required
                data-testid="create-group-name-input"
              />
              <Button
                onClick={create_group}
                loading={loading}
                disabled={!groupName.trim()}
                className="w-full"
                data-testid="create-group-button"
              >
                グループを作成
              </Button>
            </div>
          </div>


          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm" data-testid="error-message">
                {error}
              </p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>作成したグループのURLを共有して、メンバーを招待できます</p>
        </div>
      </div>
    </div>
  );
};

export default Home;