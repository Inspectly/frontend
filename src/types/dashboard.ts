import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

// Re-export all the interface types from components
export interface Metric {
  id: string;
  label: string;
  value: string | number;
  icon: IconDefinition;
  iconColor: string;
  dotColor: string;
  valueColor?: string;
}

export interface HeroBadge {
  icon: IconDefinition;
  label: string;
}

export interface HeroData {
  backgroundImage: string;
  socialProofText?: string;
  title: string;
  subtitle: string;
  badges: HeroBadge[];
  userInitials?: string[];
}

export interface SmartInsight {
  id: string;
  type: 'urgent' | 'savings' | 'opportunity' | 'info';
  title: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  icon: IconDefinition;
}

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
}

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
  progress: number;
  badgeText?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
  avatar?: string;
  metrics?: string;
}

export interface CommunityStat {
  id: string;
  value: string;
  label: string;
  color: 'indigo' | 'green' | 'purple' | 'orange';
}

export interface QuickAction {
  id: string;
  type: 'upload' | 'preview' | 'action';
  title: string;
  subtitle?: string;
  description?: string;
  ctaText: string;
  ctaAction: () => void;
  isLimitedTime?: boolean;
  icon?: IconDefinition;
  iconColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  borderColor?: string;
  features?: Array<{
    icon: IconDefinition;
    text: string;
    color: string;
  }>;
  stats?: string;
  image?: string;
}

// Main dashboard configuration interface
export interface DashboardConfig {
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
  metrics: Metric[];
  quickActions?: {
    label: string;
    href: string;
    variant: 'primary' | 'secondary';
  }[];
  heroData?: HeroData;
  quickActionCards?: QuickAction[];
  smartInsights?: SmartInsight[];
  priorityActions?: PriorityAction[];
  achievements?: Achievement[];
  progressGoal?: ProgressGoal;
  testimonials?: Testimonial[];
  communityStats?: CommunityStat[];
  emptyStateConfig?: {
    title: string;
    description: string;
    ctaText: string;
    ctaAction: () => void;
  };
}

// API response interfaces (what comes from backend)
export interface DashboardApiResponse {
  userType: 'client' | 'vendor' | 'admin' | 'realtor';
  metrics: Array<{
    id: string;
    label: string;
    value: string | number;
    iconType: string; // backend sends icon identifier
    iconColor: string;
    dotColor: string;
    valueColor?: string;
  }>;
  heroContent?: {
    backgroundImage: string;
    socialProofText?: string;
    title: string;
    subtitle: string;
    badges: Array<{
      iconType: string;
      label: string;
    }>;
    userInitials?: string[];
  };
  smartInsights?: Array<{
    id: string;
    type: 'urgent' | 'savings' | 'opportunity' | 'info';
    title: string;
    description: string;
    ctaText: string;
    ctaEndpoint: string; // backend provides API endpoint or route
    iconType: string;
  }>;
  priorityActions?: Array<{
    id: string;
    title: string;
    description: string;
    urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    savings?: number;
    offersCount?: number;
    iconType: string;
    iconColor: string;
    ctaText: string;
    ctaLink: string;
    metadata?: string;
  }>;
  achievements?: Array<{
    id: string;
    label: string;
    value: string | number;
    subValue?: string;
    color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
    type?: 'currency' | 'rating' | 'number' | 'percentage';
  }>;
  progressGoal?: {
    title: string;
    description: string;
    progress: number;
    badgeText?: string;
  };
  testimonials?: Array<{
    id: string;
    name: string;
    location: string;
    rating: number;
    text: string;
    avatar?: string;
    metrics?: string;
  }>;
  communityStats?: Array<{
    id: string;
    value: string;
    label: string;
    color: 'indigo' | 'green' | 'purple' | 'orange';
  }>;
  quickActionCards?: Array<{
    id: string;
    type: 'upload' | 'preview' | 'action';
    title: string;
    subtitle?: string;
    description?: string;
    ctaText: string;
    ctaEndpoint?: string;
    isLimitedTime?: boolean;
    iconType?: string;
    iconColor?: string;
    gradientFrom?: string;
    gradientTo?: string;
    borderColor?: string;
    features?: Array<{
      iconType: string;
      text: string;
      color: string;
    }>;
    stats?: string;
    image?: string;
  }>;
  emptyStateConfig?: {
    title: string;
    description: string;
    ctaText: string;
    ctaEndpoint: string;
  };
}