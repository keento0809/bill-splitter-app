import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import CollapsibleSection from '../common/CollapsibleSection';
import { generate_id, validate_name } from '../../utils/helpers';
import type { Member } from '../../types/index.d.ts';

interface MemberSectionProps {
  members: Member[];
  onMembersChange: (members: Member[]) => void;
}

const MemberSection: React.FC<MemberSectionProps> = ({
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

  const member_icon = (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  return (
    <CollapsibleSection
      title={`メンバー (${members.filter(m => m.isActive).length}人)`}
      icon={member_icon}
      data-testid="member-section"
    >
      <form onSubmit={handle_new_member_submit} className="mb-6">
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
          <p className="mt-2 text-sm text-red-600" data-testid="member-error">
            {error}
          </p>
        )}
      </form>

      <div className="space-y-2">
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
              <div className="flex items-center space-x-1 md:space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => start_editing(member)}
                  data-testid={`edit-member-${member.id}`}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  編集
                </Button>
                <Button
                  size="sm"
                  variant={member.isActive ? 'outline' : 'secondary'}
                  onClick={() => toggle_member_active(member.id)}
                  data-testid={`toggle-member-${member.id}`}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  {member.isActive ? '無効化' : '有効化'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => remove_member(member.id)}
                  data-testid={`remove-member-${member.id}`}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  削除
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

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
    </CollapsibleSection>
  );
};

export default MemberSection;