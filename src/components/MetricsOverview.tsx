import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface Metric {
  id: string;
  label: string;
  value: string | number;
  icon: IconDefinition;
  iconColor: string;
  dotColor: string;
  valueColor?: string;
}

interface MetricsOverviewProps {
  userName: string;
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
  metrics: Metric[];
  quickActions?: Array<{
    label: string;
    href: string;
    variant: 'primary' | 'secondary';
  }>;
}

const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  userName,
  userType,
  metrics,
  quickActions = []
}) => {
  const getGreeting = () => {
    switch (userType) {
      case 'vendor':
        return `Welcome back, ${userName}!`;
      case 'admin':
        return `Admin Dashboard - ${userName}`;
      case 'realtor':
        return `Hello ${userName}!`;
      default:
        return `Welcome back, ${userName}!`;
    }
  };

  // Loading skeleton when metrics are empty
  if (!metrics || metrics.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex flex-wrap gap-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-200 rounded-full" />
              <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 md:mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            {getGreeting()}
          </h1>
          <div className="flex flex-wrap items-center gap-4 md:gap-6">
            {metrics.map((metric) => (
              <div key={metric.id} className="flex items-center gap-2">
                <div className={`w-2 h-2 ${metric.dotColor} rounded-full`}></div>
                <span className="text-gray-700 font-medium flex items-center">
                  <FontAwesomeIcon 
                    icon={metric.icon} 
                    className={`${metric.iconColor} mr-2`} 
                  />
                  {metric.label}: 
                  <span className={`font-bold ml-1 ${metric.valueColor || 'text-blue-600'}`}>
                    {metric.value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
        {quickActions.length > 0 && (
          <div className="flex gap-3 mt-4 sm:mt-0">
            {quickActions.map((action, index) => (
              <a
                key={index}
                href={action.href}
                className={`px-4 py-2 rounded-lg transition ${
                  action.variant === 'primary'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-blue-600 border border-blue-600 hover:bg-blue-50'
                }`}
              >
                {action.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsOverview;