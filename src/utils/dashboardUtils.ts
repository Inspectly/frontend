import { 
  faDollarSign,
  faExclamationTriangle,
  faBullseye,
  faTrophy,
  faChartLine,
  faBolt,
  faCheckCircle,
  faHouse,
  faToolbox,
  faHammer,
  faBroom,
  faWrench,
  faTint,
  faSnowflake,
  faWind,
  faLeaf,
  faPaintRoller,
  faBuilding,
  faStar,
  IconDefinition
} from '@fortawesome/free-solid-svg-icons';

import { DashboardApiResponse, DashboardConfig } from '../types/dashboard';

// Icon mapping from backend string identifiers to FontAwesome icons
const iconMap: Record<string, IconDefinition> = {
  'dollar-sign': faDollarSign,
  'exclamation-triangle': faExclamationTriangle,
  'bullseye': faBullseye,
  'trophy': faTrophy,
  'chart-line': faChartLine,
  'bolt': faBolt,
  'check-circle': faCheckCircle,
  'house': faHouse,
  'toolbox': faToolbox,
  'hammer': faHammer,
  'broom': faBroom,
  'wrench': faWrench,
  'tint': faTint,
  'snowflake': faSnowflake,
  'wind': faWind,
  'leaf': faLeaf,
  'paint-roller': faPaintRoller,
  'building': faBuilding,
  'star': faStar,
};

// Get FontAwesome icon from backend string identifier
export const getIconFromType = (iconType: string): IconDefinition => {
  return iconMap[iconType] || faToolbox; // fallback to toolbox icon
};

// Transform API response to frontend config
export const transformApiResponseToConfig = (
  apiResponse: DashboardApiResponse,
  navigationCallbacks: {
    onUpload?: () => void;
    onNavigate?: (path: string) => void;
    onApiCall?: (endpoint: string) => void;
  } = {}
): DashboardConfig => {
  const config: DashboardConfig = {
    userType: apiResponse.userType,
    metrics: apiResponse.metrics.map(metric => ({
      ...metric,
      icon: getIconFromType(metric.iconType)
    }))
  };

  // Transform hero data if present
  if (apiResponse.heroContent) {
    config.heroData = {
      ...apiResponse.heroContent,
      badges: apiResponse.heroContent.badges.map(badge => ({
        ...badge,
        icon: getIconFromType(badge.iconType)
      }))
    };
  }

  // Transform smart insights if present
  if (apiResponse.smartInsights) {
    config.smartInsights = apiResponse.smartInsights.map(insight => ({
      ...insight,
      icon: getIconFromType(insight.iconType),
      ctaAction: () => {
        if (navigationCallbacks.onApiCall) {
          navigationCallbacks.onApiCall(insight.ctaEndpoint);
        }
      }
    }));
  }

  // Transform priority actions if present
  if (apiResponse.priorityActions) {
    config.priorityActions = apiResponse.priorityActions.map(action => ({
      ...action,
      icon: getIconFromType(action.iconType),
      ctaAction: () => {
        console.log('Priority action clicked, navigating to:', action.ctaLink);
        if (navigationCallbacks.onNavigate) {
          navigationCallbacks.onNavigate(action.ctaLink);
        }
      }
    }));
  }

  // Transform achievements if present
  if (apiResponse.achievements) {
    config.achievements = apiResponse.achievements;
  }

  // Transform progress goal if present
  if (apiResponse.progressGoal) {
    config.progressGoal = apiResponse.progressGoal;
  }

  // Transform testimonials if present
  if (apiResponse.testimonials) {
    config.testimonials = apiResponse.testimonials;
  }

  // Transform community stats if present
  if (apiResponse.communityStats) {
    config.communityStats = apiResponse.communityStats;
  }

  // Transform quick action cards if present
  if (apiResponse.quickActionCards) {
    config.quickActionCards = apiResponse.quickActionCards.map(card => ({
      ...card,
      icon: card.iconType ? getIconFromType(card.iconType) : undefined,
      features: card.features?.map(feature => ({
        ...feature,
        icon: getIconFromType(feature.iconType)
      })),
      ctaAction: () => {
        console.log('Card clicked:', { id: card.id, type: card.type, ctaEndpoint: card.ctaEndpoint });
        
        if (card.type === 'upload' && card.id === 'upload' && navigationCallbacks.onUpload) {
          console.log('Using onUpload callback');
          navigationCallbacks.onUpload();
        } else if (card.id === 'hotProjects' && navigationCallbacks.onNavigate) {
          console.log('Navigating hotProjects to /marketplace');
          navigationCallbacks.onNavigate('/marketplace');
        } else if (card.id === 'recent' && navigationCallbacks.onNavigate) {
          console.log('Navigating recent to /listings');
          navigationCallbacks.onNavigate('/listings');
        } else if (card.ctaEndpoint && navigationCallbacks.onApiCall) {
          console.log('Using onApiCall with endpoint:', card.ctaEndpoint);
          navigationCallbacks.onApiCall(card.ctaEndpoint);
        } else {
          console.log('No matching navigation condition');
        }
      }
    }));
  }

  // Transform empty state config if present
  if (apiResponse.emptyStateConfig) {
    config.emptyStateConfig = {
      ...apiResponse.emptyStateConfig,
      ctaAction: () => {
        if (navigationCallbacks.onApiCall) {
          navigationCallbacks.onApiCall(apiResponse.emptyStateConfig!.ctaEndpoint);
        }
      }
    };
  }

  return config;
};

// Generate sample configurations for different user types
export const generateSampleConfig = (
  userType: 'client' | 'vendor' | 'admin' | 'realtor',
  _userName: string
): DashboardConfig => {
  const baseConfig: DashboardConfig = {
    userType,
    metrics: []
  };

  switch (userType) {
    case 'client':
      return {
        ...baseConfig,
        metrics: [
          {
            id: 'health',
            label: 'Property Health Score',
            value: '8.7/10',
            icon: faCheckCircle,
            iconColor: 'text-green-600',
            dotColor: 'bg-green-500',
            valueColor: 'text-green-600'
          },
          {
            id: 'savings',
            label: 'Potential Savings',
            value: '$750',
            icon: faDollarSign,
            iconColor: 'text-green-600',
            dotColor: 'bg-blue-500'
          },
          {
            id: 'urgent',
            label: 'urgent items',
            value: 1,
            icon: faExclamationTriangle,
            iconColor: 'text-orange-500',
            dotColor: 'bg-orange-500'
          },
          {
            id: 'completion',
            label: '85% completion rate',
            value: '',
            icon: faBullseye,
            iconColor: 'text-blue-600',
            dotColor: 'bg-purple-500'
          }
        ]
      };

    case 'vendor':
      return {
        ...baseConfig,
        metrics: [
          {
            id: 'jobs',
            label: 'Active Jobs',
            value: 12,
            icon: faHammer,
            iconColor: 'text-blue-600',
            dotColor: 'bg-blue-500'
          },
          {
            id: 'revenue',
            label: 'Monthly Revenue',
            value: '$8,450',
            icon: faDollarSign,
            iconColor: 'text-green-600',
            dotColor: 'bg-green-500'
          },
          {
            id: 'rating',
            label: 'Avg Rating',
            value: '4.8/5',
            icon: faTrophy,
            iconColor: 'text-yellow-600',
            dotColor: 'bg-yellow-500'
          }
        ]
      };

    case 'admin':
      return {
        ...baseConfig,
        metrics: [
          {
            id: 'users',
            label: 'Total Users',
            value: '12,847',
            icon: faBuilding,
            iconColor: 'text-blue-600',
            dotColor: 'bg-blue-500'
          },
          {
            id: 'revenue',
            label: 'Platform Revenue',
            value: '$145K',
            icon: faDollarSign,
            iconColor: 'text-green-600',
            dotColor: 'bg-green-500'
          },
          {
            id: 'growth',
            label: 'Monthly Growth',
            value: '+23%',
            icon: faChartLine,
            iconColor: 'text-purple-600',
            dotColor: 'bg-purple-500'
          }
        ]
      };

    case 'realtor':
      return {
        ...baseConfig,
        metrics: [
          {
            id: 'listings',
            label: 'Active Listings',
            value: 24,
            icon: faHouse,
            iconColor: 'text-blue-600',
            dotColor: 'bg-blue-500'
          },
          {
            id: 'inspections',
            label: 'Inspections Scheduled',
            value: 8,
            icon: faCheckCircle,
            iconColor: 'text-green-600',
            dotColor: 'bg-green-500'
          },
          {
            id: 'commission',
            label: 'Est. Commission',
            value: '$15,200',
            icon: faDollarSign,
            iconColor: 'text-green-600',
            dotColor: 'bg-purple-500'
          }
        ]
      };

    default:
      return baseConfig;
  }
};

// Conditional rendering helper
export const shouldShowComponent = (data: any): boolean => {
  if (Array.isArray(data)) {
    return data.length > 0;
  }
  return !!data;
};