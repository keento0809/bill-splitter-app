import { useState, useEffect } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import CollapsibleSection from '../common/CollapsibleSection';
import { generate_id, validate_amount, parse_amount, format_currency, format_date } from '../../utils/helpers';
import type { Payment, Member, PaymentFormData } from '../../types/index.d.ts';

interface PaymentSectionProps {
  payments: Payment[];
  members: Member[];
  onPaymentsChange: (payments: Payment[]) => void;
  isFormOpen?: boolean;
  onFormOpenChange?: (isOpen: boolean) => void;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  payments,
  members,
  onPaymentsChange,
  isFormOpen: externalIsFormOpen = false,
  onFormOpenChange,
}) => {
  const [internalIsFormOpen, setInternalIsFormOpen] = useState(false);
  
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    description: '',
    payerId: '',
    participants: [],
    excludedMembers: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeMembers = members.filter(m => m.isActive);

  // 外部制御がある場合はそれを使用、ない場合は内部状態を使用
  const isFormOpen = onFormOpenChange ? externalIsFormOpen : internalIsFormOpen;
  const setIsFormOpen = onFormOpenChange || setInternalIsFormOpen;

  const reset_form = () => {
    setFormData({
      amount: '',
      description: '',
      payerId: '',
      participants: [],
      excludedMembers: []
    });
    setErrors({});
  };


  // 外部から制御される場合、externalIsFormOpenがtrueに変更されたときにフォームを開く
  useEffect(() => {
    if (onFormOpenChange && externalIsFormOpen) {
      reset_form();
      setEditingPayment(null);
    }
  }, [externalIsFormOpen, onFormOpenChange]);

  const open_edit_form = (payment: Payment) => {
    setFormData({
      amount: payment.amount.toString(),
      description: payment.description,
      payerId: payment.payerId,
      participants: payment.participants,
      excludedMembers: payment.excludedMembers
    });
    setEditingPayment(payment);
    setErrors({});
    setIsFormOpen(true);
  };

  const close_form = () => {
    setIsFormOpen(false);
    setEditingPayment(null);
    reset_form();
  };

  const validate_form = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validate_amount(formData.amount)) {
      newErrors.amount = '正しい金額を入力してください（1円以上1000万円以下）';
    }

    if (!formData.description.trim()) {
      newErrors.description = '支払い内容を入力してください';
    }

    if (!formData.payerId) {
      newErrors.payerId = '支払者を選択してください';
    }

    if (formData.participants.length === 0) {
      newErrors.participants = '参加者を最低1人選択してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handle_submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate_form()) return;

    const amount = parse_amount(formData.amount);
    const now = new Date();

    if (editingPayment) {
      const updatedPayments = payments.map(p =>
        p.id === editingPayment.id
          ? {
              ...p,
              amount,
              description: formData.description.trim(),
              payerId: formData.payerId,
              participants: formData.participants,
              excludedMembers: formData.excludedMembers,
              updatedAt: now
            }
          : p
      );
      onPaymentsChange(updatedPayments);
    } else {
      const newPayment: Payment = {
        id: generate_id(),
        amount,
        description: formData.description.trim(),
        payerId: formData.payerId,
        participants: formData.participants,
        excludedMembers: formData.excludedMembers,
        createdAt: now,
        updatedAt: now
      };
      onPaymentsChange([...payments, newPayment]);
    }

    close_form();
  };

  const remove_payment = (paymentId: string) => {
    const updatedPayments = payments.filter(p => p.id !== paymentId);
    onPaymentsChange(updatedPayments);
  };

  const handle_participant_toggle = (memberId: string) => {
    const isSelected = formData.participants.includes(memberId);
    const newParticipants = isSelected
      ? formData.participants.filter(id => id !== memberId)
      : [...formData.participants, memberId];

    setFormData(prev => ({
      ...prev,
      participants: newParticipants
    }));
  };

  const select_all_participants = () => {
    setFormData(prev => ({
      ...prev,
      participants: activeMembers.map(m => m.id)
    }));
  };

  const clear_all_participants = () => {
    setFormData(prev => ({
      ...prev,
      participants: []
    }));
  };

  const get_member_name = (memberId: string): string => {
    return members.find(m => m.id === memberId)?.name || '不明';
  };

  const payment_icon = (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  return (
    <CollapsibleSection
      title={`支払い履歴 (${payments.length}件)`}
      icon={payment_icon}
      data-testid="payment-section"
    >

      <div className="space-y-3">
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8" data-testid="no-payments-message">
            まだ支払い記録がありません
          </p>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
              data-testid={`payment-item-${payment.id}`}
            >
              <div className="space-y-3">
                {/* タイトルと金額 */}
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">
                    {payment.description}
                  </h3>
                  <span className="text-lg font-semibold text-primary">
                    {format_currency(payment.amount)}
                  </span>
                </div>
                
                {/* 詳細情報 */}
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    支払者: {get_member_name(payment.payerId)}
                  </p>
                  <p className="text-sm text-gray-600">
                    参加者: {payment.participants.map(id => get_member_name(id)).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format_date(payment.createdAt)}
                  </p>
                </div>

                {/* アクションボタン */}
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => open_edit_form(payment)}
                    data-testid={`edit-payment-${payment.id}`}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    title="編集"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => remove_payment(payment.id)}
                    data-testid={`remove-payment-${payment.id}`}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    title="削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={close_form}
        title={editingPayment ? '支払いを編集' : '支払いを追加'}
        size="lg"
        data-testid="payment-form-modal"
      >
        <form onSubmit={handle_submit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="金額"
              type="number"
              value={formData.amount}
              onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
              placeholder="1000"
              required
              min={1}
              max={10000000}
              error={errors.amount}
              data-testid="payment-amount-input"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                支払者 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.payerId}
                onChange={(e) => setFormData(prev => ({ ...prev, payerId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
                data-testid="payment-payer-select"
              >
                <option value="">選択してください</option>
                {activeMembers.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {errors.payerId && (
                <p className="mt-1 text-sm text-red-600">{errors.payerId}</p>
              )}
            </div>
          </div>

          <Input
            label="支払い内容"
            value={formData.description}
            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            placeholder="例: 夕食代、交通費"
            required
            error={errors.description}
            data-testid="payment-description-input"
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                参加者 <span className="text-red-500">*</span>
              </label>
              <div className="space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={select_all_participants}
                  data-testid="select-all-participants"
                >
                  全選択
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clear_all_participants}
                  data-testid="clear-all-participants"
                >
                  全解除
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-200 rounded-lg">
              {activeMembers.map(member => (
                <label
                  key={member.id}
                  className="flex items-center space-x-2 cursor-pointer"
                  data-testid={`participant-${member.id}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.participants.includes(member.id)}
                    onChange={() => handle_participant_toggle(member.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{member.name}</span>
                </label>
              ))}
            </div>
            {errors.participants && (
              <p className="mt-1 text-sm text-red-600">{errors.participants}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={close_form}
              data-testid="cancel-payment-button"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              data-testid="save-payment-button"
            >
              {editingPayment ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </Modal>
    </CollapsibleSection>
  );
};

export default PaymentSection;