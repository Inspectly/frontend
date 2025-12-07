import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

export interface Achievement {
  id: string;
  label: string;
  value: string | number;
  subValue?: string;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
  type?: 'currency' | 'rating' | 'number' | 'percentage';
}

export interface ProgressGoal {
  title: string;
  description: string;
  progress: number; // 0-100
  badgeText?: string;
}

interface AchievementsProps {
  achievements: Achievement[];
  progressGoal?: ProgressGoal;
  title?: string;
  subtitle?: string;
  statusBadge?: {
    text: string;
    color: 'green' | 'red' | 'orange' | 'blue';
  };
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
}

const Achievements: React.FC<AchievementsProps> = ({
  achievements,
  progressGoal,
  title = "Your Achievements",
  subtitle = "Track your success",
  statusBadge,
  userType
}) => {
  // Don't render if no achievements
  if (!achievements || achievements.length === 0) {
    return null;
  }

  const getColorClasses = (color: Achievement['color']) => {
    switch (color) {
      case 'green':
        return {
          bg: 'border-green-200',
          text: 'text-green-600',
          sub: 'text-green-600'
        };
      case 'blue':
        return {
          bg: 'border-blue-200',
          text: 'text-blue-600',
          sub: 'text-blue-600'
        };
      case 'purple':
        return {
          bg: 'border-purple-200',
          text: 'text-purple-600',
          sub: 'text-purple-600'
        };
      case 'orange':
        return {
          bg: 'border-orange-200',
          text: 'text-orange-600',
          sub: 'text-orange-600'
        };
      default:
        return {
          bg: 'border-gray-200',
          text: 'text-gray-600',
          sub: 'text-gray-600'
        };
    }
  };

  const formatValue = (achievement: Achievement) => {
    if (achievement.type === 'currency') {
      return `$${achievement.value}`;
    }
    if (achievement.type === 'rating') {
      return (
        <span className="flex items-center gap-1">
          {achievement.value} <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
        </span>
      );
    }
    if (achievement.type === 'percentage') {
      return `${achievement.value}%`;
    }
    return achievement.value;
  };

  const getBadgeClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-700';
      case 'red':
        return 'bg-red-100 text-red-700';
      case 'orange':
        return 'bg-orange-100 text-orange-700';
      case 'blue':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
      <div className="border-b border-green-200 px-4 md:px-6 py-3 md:py-4 bg-white/50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
              {title}
            </h3>
            <p className="text-gray-600 text-xs md:text-sm">{subtitle}</p>
          </div>
          {statusBadge && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${getBadgeClasses(statusBadge.color)}`}>
              {statusBadge.text}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
          {achievements.map((achievement) => {
            const colors = getColorClasses(achievement.color);
            return (
              <div key={achievement.id} className={`bg-white rounded-lg p-3 md:p-4 text-center border ${colors.bg}`}>
                <div className={`text-xl md:text-2xl font-bold mb-1 ${colors.text}`}>
                  {formatValue(achievement)}
                </div>
                <div className="text-xs text-gray-600">{achievement.label}</div>
                {achievement.subValue && (
                  <div className={`text-xs font-medium ${colors.sub}`}>
                    {achievement.subValue}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {progressGoal && (
          <div className="bg-white rounded-lg p-3 md:p-4 border border-green-200">
            <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              {progressGoal.title}
            </h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs md:text-sm text-gray-600">{progressGoal.description}</span>
              <span className="text-xs md:text-sm font-bold text-green-600">{progressGoal.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
                style={{width: `${progressGoal.progress}%`}}
              ></div>
            </div>
            {progressGoal.badgeText && (
              <p className="text-xs text-gray-500 mt-2">{progressGoal.badgeText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;