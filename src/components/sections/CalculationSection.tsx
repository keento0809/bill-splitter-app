import { format_currency } from '../../utils/helpers';
import type { CalculationResult, Member } from '../../types/index.d.ts';

interface CalculationSectionProps {
  result: CalculationResult | null;
  members: Member[];
}

const CalculationSection: React.FC<CalculationSectionProps> = ({
  result,
  members,
}) => {
  if (!result) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          清算結果
        </h2>
        <p className="text-gray-500 text-center py-8">
          支払い記録を追加すると清算結果が表示されます
        </p>
      </div>
    );
  }

  const get_member_name = (memberId: string): string => {
    return members.find(m => m.id === memberId)?.name || '不明';
  };

  const has_settlements = result.settlements.length > 0;

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          清算結果
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              総支出額
            </h3>
            <p className="text-2xl font-bold text-blue-900" data-testid="total-amount">
              {format_currency(result.totalAmount)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-900 mb-1">
              一人当たり
            </h3>
            <p className="text-2xl font-bold text-green-900" data-testid="per-person-amount">
              {format_currency(result.perPersonAmount)}
            </p>
          </div>
        </div>

        {has_settlements ? (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              清算方法（{result.settlements.length}回の取引）
            </h3>
            <div className="space-y-2">
              {result.settlements.map((settlement, index) => (
                <div
                  key={`${settlement.from}-${settlement.to}-${index}`}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`settlement-${index}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {get_member_name(settlement.from)}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="font-medium text-gray-900">
                      {get_member_name(settlement.to)}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-red-600">
                    {format_currency(settlement.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              清算完了！
            </h3>
            <p className="text-gray-600" data-testid="settlement-complete-message">
              全員の収支が均等になっています
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          個人収支
        </h3>
        <div className="space-y-2">
          {Object.entries(result.balances).map(([memberId, balance]) => {
            const member = members.find(m => m.id === memberId);
            if (!member || !member.isActive) return null;

            const balanceColor = balance > 0 
              ? 'text-green-600' 
              : balance < 0 
                ? 'text-red-600' 
                : 'text-gray-600';

            const balanceText = balance > 0 
              ? '受け取り予定' 
              : balance < 0 
                ? '支払い予定' 
                : '清算済み';

            return (
              <div
                key={memberId}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                data-testid={`balance-${memberId}`}
              >
                <span className="font-medium text-gray-900">
                  {member.name}
                </span>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${balanceColor}`}>
                    {balance === 0 ? '±0円' : format_currency(Math.abs(balance))}
                  </div>
                  <div className={`text-xs ${balanceColor}`}>
                    {balanceText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalculationSection;