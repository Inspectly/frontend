import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface SmartInsight {
  id: string;
  type: 'urgent' | 'savings' | 'opportunity' | 'info';
  title: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  icon: IconDefinition;
}

interface SmartInsightsProps {
  insights: SmartInsight[];
  title?: string;
  subtitle?: string;
  showActionBadge?: boolean;
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
}

const SmartInsights: React.FC<SmartInsightsProps> = ({
  insights,
  title = "Smart Insights & Recommendations",
  subtitle = "AI-powered recommendations based on your data",
  showActionBadge = true,
  userType: _userType
}) => {
  // Don't render if no insights
  if (!insights || insights.length === 0) {
    return null;
  }

  const getTypeConfig = (type: SmartInsight['type']) => {
    switch (type) {
      case 'urgent':
        return {
          bgColor: 'bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition',
          iconColor: 'text-red-500 text-lg',
          labelColor: 'font-bold text-red-700',
          label: 'URGENT',
          buttonColor: 'text-red-600 hover:text-red-700'
        };
      case 'savings':
        return {
          bgColor: 'bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition',
          iconColor: 'text-blue-500 text-lg',
          labelColor: 'font-bold text-blue-700',
          label: 'SAVINGS',
          buttonColor: 'text-blue-600 hover:text-blue-700'
        };
      case 'opportunity':
        return {
          bgColor: 'bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition',
          iconColor: 'text-green-500 text-lg',
          labelColor: 'font-bold text-green-700',
          label: 'OPPORTUNITY',
          buttonColor: 'text-green-600 hover:text-green-700'
        };
      default:
        return {
          bgColor: 'bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition',
          iconColor: 'text-gray-500 text-lg',
          labelColor: 'font-bold text-gray-700',
          label: 'INFO',
          buttonColor: 'text-gray-600 hover:text-gray-700'
        };
    }
  };

  const hasUrgentInsights = insights.some(insight => insight.type === 'urgent');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm">{subtitle}</p>
        </div>
        {showActionBadge && hasUrgentInsights && (
          <div className="bg-orange-100 px-3 py-1 rounded-full text-xs font-bold text-orange-700">
            ACTION NEEDED
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => {
          const config = getTypeConfig(insight.type);
          return (
            <div key={insight.id} className={config.bgColor}>
              <div className="flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={insight.icon} className={config.iconColor} />
                <span className={config.labelColor}>{config.label}</span>
              </div>
              <h4 className="font-semibold text-gray-800 mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
              <button 
                onClick={insight.ctaAction}
                className={`${config.buttonColor} text-sm font-medium`}
              >
                {insight.ctaText} →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartInsights;