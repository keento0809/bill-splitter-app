import { useState } from 'react';
import Button from './Button';
import Input from './Input';
import Modal from './Modal';
import { generate_id, validate_name } from '../../utils/helpers';
import type { Member } from '../../types/index.d.ts';

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onMembersChange: (members: Member[]) => void;
}

const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose,
  members,
  onMembersChange,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberName, setEditMemberName] = useState('');
  const [error, setError] = useState('');

  const add_member = () => {
    if (!validate_name(newMemberName)) {
      setError('メンバー名は1文字以上20文字以下で入力してください');
      return;
    }

    if (members.some(m => m.name === newMemberName.trim())) {
      setError('同じ名前のメンバーが既に存在します');
      return;
    }

    const newMember: Member = {
      id: generate_id(),
      name: newMemberName.trim(),
      isActive: true,
      createdAt: new Date()
    };

    onMembersChange([...members, newMember]);
    setNewMemberName('');
    setError('');
  };

  const start_editing = (member: Member) => {
    setEditingMember(member);
    setEditMemberName(member.name);
    setError('');
  };

  const save_edit = () => {
    if (!editingMember) return;

    if (!validate_name(editMemberName)) {
      setError('メンバー名は1文字以上20文字以下で入力してください');
      return;
    }

    if (members.some(m => m.id !== editingMember.id && m.name === editMemberName.trim())) {
      setError('同じ名前のメンバーが既に存在します');
      return;
    }

    const updatedMembers = members.map(m =>
      m.id === editingMember.id
        ? { ...m, name: editMemberName.trim() }
        : m
    );

    onMembersChange(updatedMembers);
    setEditingMember(null);
    setEditMemberName('');
    setError('');
  };

  const cancel_edit = () => {
    setEditingMember(null);
    setEditMemberName('');
    setError('');
  };

  const toggle_member_active = (memberId: string) => {
    const updatedMembers = members.map(m =>
      m.id === memberId ? { ...m, isActive: !m.isActive } : m
    );
    onMembersChange(updatedMembers);
  };

  const remove_member = (memberId: string) => {
    const updatedMembers = members.filter(m => m.id !== memberId);
    onMembersChange(updatedMembers);
  };

  const handle_new_member_submit = (e: React.FormEvent) => {
    e.preventDefault();
    add_member();
  };

  const handle_edit_submit = (e: React.FormEvent) => {
    e.preventDefault();
    save_edit();
  };

  const handle_close = () => {
    setEditingMember(null);
    setEditMemberName('');
    setError('');
    setNewMemberName('');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handle_close}
        title={`メンバー管理 (${members.filter(m => m.isActive).length}人)`}
        size="lg"
        data-testid="member-management-modal"
      >
        <div className="space-y-6">
          {/* メンバー追加フォーム */}
          <form onSubmit={handle_new_member_submit} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">メンバー追加</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={newMemberName}
                  onChange={setNewMemberName}
                  placeholder="メンバー名を入力"
                  data-testid="add-member-input"
                />
              </div>
              <Button
                type="submit"
                disabled={!newMemberName.trim()}
                data-testid="add-member-button"
              >
                追加
              </Button>
            </div>
            {error && !editingMember && (
              <p className="text-sm text-red-600" data-testid="member-error">
                {error}
              </p>
            )}
          </form>

          {/* メンバー一覧 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">メンバー一覧</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-4" data-testid="no-members-message">
                  まだメンバーが登録されていません
                </p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      member.isActive 
                        ? 'border-gray-200 bg-white' 
                        : 'border-gray-100 bg-gray-50'
                    }`}
                    data-testid={`member-item-${member.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-base ${
                          member.isActive ? 'text-gray-900' : 'text-gray-400 line-through'
                        }`}
                      >
                        {member.name}
                      </span>
                      {!member.isActive && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          無効
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => start_editing(member)}
                        data-testid={`edit-member-${member.id}`}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        title="編集"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => toggle_member_active(member.id)}
                        data-testid={`toggle-member-${member.id}`}
                        className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          member.isActive 
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 focus:ring-amber-500' 
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50 focus:ring-green-500'
                        }`}
                        title={member.isActive ? '無効化' : '有効化'}
                      >
                        {member.isActive ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => remove_member(member.id)}
                        data-testid={`remove-member-${member.id}`}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        title="削除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* メンバー編集モーダル */}
      <Modal
        isOpen={!!editingMember}
        onClose={cancel_edit}
        title="メンバー名を編集"
        data-testid="edit-member-modal"
      >
        <form onSubmit={handle_edit_submit} className="space-y-4">
          <Input
            label="メンバー名"
            value={editMemberName}
            onChange={setEditMemberName}
            placeholder="メンバー名を入力"
            required
            data-testid="edit-member-name-input"
          />
          {error && editingMember && (
            <p className="text-sm text-red-600" data-testid="edit-member-error">
              {error}
            </p>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={cancel_edit}
              data-testid="cancel-edit-button"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={!editMemberName.trim()}
              data-testid="save-edit-button"
            >
              保存
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default MemberManagementModal;