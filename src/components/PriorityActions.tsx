import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition, faToolbox } from '@fortawesome/free-solid-svg-icons';

export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  savings?: number;
  offersCount?: number;
  icon: IconDefinition;
  iconColor: string;
  ctaText: string;
  ctaLink: string;
  metadata?: string;
  reasons?: string[];
}

interface PriorityActionsProps {
  actions: PriorityAction[];
  title?: string;
  subtitle?: string;
  emptyStateConfig?: {
    title: string;
    description: string;
    ctaText: string;
    ctaAction: () => void;
  };
  maxItems?: number;
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
  isLoading?: boolean;
}

const PriorityActions: React.FC<PriorityActionsProps> = ({
  actions,
  title = "Priority Actions",
  subtitle = "Time-sensitive opportunities",
  emptyStateConfig,
  maxItems = 3,
  userType: _userType,
  isLoading = false
}) => {
  // Don't render if no actions and no empty state
  if ((!actions || actions.length === 0) && !emptyStateConfig) {
    return isLoading ? (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
        <div className="border-b border-blue-200 px-6 py-4 bg-white/50 rounded-t-xl">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
        </div>
        <div className="p-6 space-y-3">
          {[0,1,2].map((i) => (
            <div key={i} className="border rounded-lg p-4 bg-white/70">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" />
              </div>
              <div className="h-4 w-3/5 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-3 w-4/5 bg-gray-100 rounded mb-3 animate-pulse" />
              <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ) : null;
  }

  const getUrgencyConfig = (level: PriorityAction['urgencyLevel']) => {
    switch (level) {
      case 'HIGH':
        return {
          bgColor: 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200',
          badgeColor: 'bg-red-100 text-red-700',
          label: 'URGENT'
        };
      case 'MEDIUM':
        return {
          bgColor: 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200',
          badgeColor: 'bg-orange-100 text-orange-700',
          label: 'HOT DEAL'
        };
      default:
        return {
          bgColor: 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200',
          badgeColor: 'bg-green-100 text-green-700',
          label: 'SAVE'
        };
    }
  };

  const hasUrgentActions = actions?.some(action => action.urgencyLevel === 'HIGH');

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
      <div className="border-b border-blue-200 px-6 py-4 bg-white/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              {title}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm">{subtitle}</p>
          </div>
          {hasUrgentActions && (
            <div className="bg-red-100 px-2 py-1 rounded-full text-xs font-bold text-red-700 animate-pulse">
              URGENT
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        {actions && actions.length > 0 ? (
          <div className="space-y-3">
            {actions.slice(0, maxItems).map((action) => {
              const urgencyConfig = getUrgencyConfig(action.urgencyLevel);
              
              return (
                <div
                  key={action.id}
                  className={`${urgencyConfig.bgColor} border rounded-lg p-4 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${action.iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <FontAwesomeIcon
                          icon={action.icon}
                          className="text-white text-xs"
                        />
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${urgencyConfig.badgeColor}`}>
                        {urgencyConfig.label}
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <h4 className="font-bold text-gray-800 text-xs md:text-sm mb-1">
                      {action.title}
                    </h4>
                    <p className="text-gray-600 text-[11px] md:text-xs mb-2 line-clamp-2">
                      {action.description}
                    </p>
                    {action.reasons && action.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {action.reasons.slice(0,3).map((reason, idx) => (
                          <span key={idx} className="text-[10px] md:text-[11px] px-2 py-0.5 rounded-full bg-white/70 border border-blue-200 text-blue-700 whitespace-nowrap">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      {action.savings && (
                        <p className="text-green-600 text-[11px] md:text-xs font-bold">
                          ${action.savings?.toLocaleString()}
                        </p>
                      )}
                      {action.metadata && (
                        <p className="text-blue-600 text-[11px] md:text-xs font-medium">
                          {action.metadata}
                        </p>
                      )}
                    </div>
                  </div>
                  <Link
                    to={action.ctaLink}
                    className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition font-bold text-xs md:text-sm"
                  >
                    {action.ctaText}
                  </Link>
                </div>
              );
            })}
            {actions.length > maxItems && (
              <Link
                to="/actions" // or appropriate route
                className="text-blue-600 hover:text-blue-700 text-sm font-medium block text-center mt-4"
              >
                View All Actions →
              </Link>
            )}
          </div>
        ) : emptyStateConfig ? (
          <div className="text-center py-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-blue-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faToolbox} className="text-blue-600 text-2xl" />
            </div>
            <h4 className="font-bold text-gray-800 mb-2">{emptyStateConfig.title}</h4>
            <p className="text-gray-600 text-sm mb-4">{emptyStateConfig.description}</p>
            <button 
              onClick={emptyStateConfig.ctaAction}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition transform hover:scale-105"
            >
              {emptyStateConfig.ctaText}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PriorityActions;