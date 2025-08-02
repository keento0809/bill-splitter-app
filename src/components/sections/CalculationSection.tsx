import CollapsibleSection from '../common/CollapsibleSection';
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
  const get_member_name = (memberId: string): string => {
    return members.find(m => m.id === memberId)?.name || '不明';
  };

  const calculation_icon = (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );


  if (!result) {
    return (
      <CollapsibleSection
        title="清算結果"
        icon={calculation_icon}
        isInitiallyOpen={true}
        data-testid="calculation-section"
      >
        <p className="text-gray-500 text-center py-8">
          支払い記録を追加すると清算結果が表示されます
        </p>
      </CollapsibleSection>
    );
  }

  const has_settlements = result.settlements.length > 0;

  return (
    <CollapsibleSection
      title="清算結果"
      icon={calculation_icon}
      isInitiallyOpen={true}
      data-testid="calculation-section"
    >

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-blue-50 rounded-lg p-3 md:p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-blue-900">
                総支出額
              </h3>
              <p className="text-xl md:text-2xl font-bold text-blue-900" data-testid="total-amount">
                {format_currency(result.totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex-1 bg-green-50 rounded-lg p-3 md:p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-green-900">
                一人当たり
              </h3>
              <p className="text-xl md:text-2xl font-bold text-green-900" data-testid="per-person-amount">
                {format_currency(result.perPersonAmount)}
              </p>
            </div>
          </div>
        </div>

        {has_settlements && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base md:text-lg font-medium text-gray-900">
                清算方法
              </h3>
              <span className="text-sm text-gray-600">
                {result.settlements.length}回の取引
              </span>
            </div>
            <div className="space-y-2">
              {result.settlements.map((settlement, index) => (
                <div
                  key={`${settlement.from}-${settlement.to}-${index}`}
                  className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`settlement-${index}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 text-sm md:text-base">
                      {get_member_name(settlement.from)}
                    </span>
                    <span className="text-gray-600">→</span>
                    <span className="font-medium text-gray-900 text-sm md:text-base">
                      {get_member_name(settlement.to)}
                    </span>
                  </div>
                  <span className="text-base md:text-lg font-semibold text-red-600">
                    {format_currency(settlement.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
    </CollapsibleSection>
  );
};

export default CalculationSection;