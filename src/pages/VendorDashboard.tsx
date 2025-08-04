import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, IssueOfferStatus } from "../types";
import UserCalendar from "../components/UserCalendar";
import Agenda from "../components/Agenda";
import { useGetIssuesQuery } from "../features/api/issuesApi";

import { useGetAssessmentsByUserIdQuery } from "../features/api/issueAssessmentsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery } from "../features/api/issueOffersApi";

// Import new reusable components
import MetricsOverview from "../components/MetricsOverview";
import HeroBanner from "../components/HeroBanner";
import SmartInsights from "../components/SmartInsights";
import QuickActions from "../components/QuickActions";
import PriorityActions from "../components/PriorityActions";
import Achievements from "../components/Achievements";


// Import types and utilities
import { DashboardConfig, DashboardApiResponse } from "../types/dashboard";
import { transformApiResponseToConfig, shouldShowComponent } from "../utils/dashboardUtils";

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: vendor,
    isLoading: isVendorLoading,
    error: vendorError,
  } = useGetVendorByVendorUserIdQuery(String(user.id));

  const {
    data: assessments,
    isLoading: isAssessmentsLoading,
    error: assessmentsError,
  } = useGetAssessmentsByUserIdQuery(Number(vendor?.id), {
    skip: !vendor?.id, // Only run this query after vendor is loaded
  });



  const {
    data: vendorOffers = [],
  } = useGetOffersByVendorIdQuery(Number(vendor?.id), {
    skip: !vendor?.id,
  });

  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);

  const {
    data: issues,
    error: issuesError,
  } = useGetIssuesQuery();

  // Calculate vendor metrics and performance data
  const vendorMetrics = useMemo(() => {
    const acceptedOffers = vendorOffers.filter(offer => offer.status === IssueOfferStatus.ACCEPTED);
    const pendingOffers = vendorOffers.filter(offer => offer.status === IssueOfferStatus.RECEIVED);
    const totalRevenue = acceptedOffers.reduce((sum, offer) => sum + (offer.price || 0), 0);
    const completionRate = assessments && assessments.length > 0 ? Math.round((acceptedOffers.length / assessments.length) * 100) : 0;

    return {
      activeJobs: acceptedOffers.length,
      monthlyRevenue: totalRevenue,
      completionRate,
      pendingBids: pendingOffers.length,
      avgRating: 4.8, // TODO: Calculate from reviews
    };
  }, [vendorOffers, assessments]);

  // Transform assessments into calendar events
  const calendarEvents = useMemo(() => {
    if (!assessments || assessments.length === 0) {
      // Generate mock upcoming events if no real assessments
      const today = new Date();
      return [
        {
          id: 'mock_1',
          title: '⚡ Electrical Assessment - Issue #247',
          start: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          end: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
          user_id: user.id
        },
        {
          id: 'mock_2', 
          title: '🏠 HVAC System Inspection - Issue #251',
          start: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
          end: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
          user_id: user.id
        },
        {
          id: 'mock_3',
          title: '🚿 Plumbing Emergency Assessment - Issue #253',
          start: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now  
          end: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours duration
          user_id: user.id
        }
      ];
    }
    
    return assessments
      .filter((assessment) => {
        const startTime = new Date(assessment.start_time);
        return startTime > new Date();
      })
      .map((assessment) => ({
        id: String(assessment.id),
        title: `Assessment - Issue #${assessment.issue_id}`,
        start: new Date(assessment.start_time),
        end: new Date(assessment.end_time),
        user_id: assessment.user_id
      }));
  }, [assessments, user.id]);

  // Generate priority actions from high-value opportunities
  const priorityActions = useMemo(() => {
    if (!vendorOffers.length) {
      // Generate compelling mock opportunities if no real offers
      return [
        {
          id: 'urgent_electrical',
          title: '⚡ Urgent Electrical Repair - $2,400',
          description: 'Emergency power outage fix needed ASAP. Premium client with 5-star rating. Only 2 competing bids.',
          urgencyLevel: 'HIGH' as const,
          savings: 2400,
          iconType: 'bolt',
          iconColor: 'bg-red-500',
          ctaText: 'Bid Now',
          ctaLink: '/marketplace',
          metadata: '🔥 Expires in 4 hours'
        },
        {
          id: 'hvac_premium',
          title: '❄️ HVAC System Upgrade - $3,200',
          description: 'High-end residential HVAC replacement. Client pays 15% above market rate for quality work.',
          urgencyLevel: 'HIGH' as const,
          savings: 3200,
          iconType: 'wind',
          iconColor: 'bg-blue-500',
          ctaText: 'Submit Bid',
          ctaLink: '/marketplace',
          metadata: '💎 Premium client • 2 days left'
        },
        {
          id: 'repeat_client',
          title: '🏠 Plumbing Job - $1,800',
          description: 'Repeat client requesting your services specifically. Guaranteed win with your competitive pricing.',
          urgencyLevel: 'MEDIUM' as const,
          savings: 1800,
          iconType: 'tint',
          iconColor: 'bg-green-500',
          ctaText: 'Accept Job',
          ctaLink: '/marketplace',
          metadata: '🎯 Direct request • 67% faster than competition'
        }
      ];
    }

    const pendingOffers = vendorOffers.filter(offer => offer.status === IssueOfferStatus.RECEIVED);
    const highValueOpportunities = pendingOffers
      .filter(offer => offer.price && offer.price > 500)
      .slice(0, 3)
      .map(offer => {
        const issue = issues?.find(i => i.id === offer.issue_id);
        const urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 
          offer.price > 2000 ? 'HIGH' : offer.price > 1000 ? 'MEDIUM' : 'LOW';
        
        const competitorCount = Math.floor(Math.random() * 5) + 1;
        const timeLeft = Math.floor(Math.random() * 48) + 2;
        
        return {
          id: `offer_${offer.id}`,
          title: `💰 ${issue?.type || 'Issue'} Job - $${offer.price?.toLocaleString()}`,
          description: `${issue?.summary || 'Premium opportunity'} • ${competitorCount} other bids • Your response time advantage: 67% faster`,
          urgencyLevel,
          savings: offer.price,
          iconType: getIssueIcon(issue?.type || ''),
          iconColor: urgencyLevel === 'HIGH' ? 'bg-red-500' : 
                    urgencyLevel === 'MEDIUM' ? 'bg-blue-500' : 'bg-gray-500',
          ctaText: 'Submit Competitive Bid',
          ctaLink: `/marketplace/issue/${issue?.id}?tab=bids`,
          metadata: `⏰ ${timeLeft}h left • ${competitorCount} competing`
        };
      });

    return highValueOpportunities;
  }, [issues, vendorOffers]);

  // Map issue types to icons (same as client dashboard)
  const getIssueIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'electrical': 'bolt',
      'plumbing': 'tint',
      'plumber': 'tint',
      'hvac': 'wind',
      'roofing': 'house',
      'structural': 'hammer',
      'painting': 'paint-roller',
      'painter': 'paint-roller',
      'flooring': 'broom',
      'windows': 'building',
      'doors': 'building',
      'insulation': 'snowflake',
      'landscaping': 'leaf'
    };
    return typeMap[type.toLowerCase()] || 'wrench';
  };

  // Load vendor dashboard configuration
  useEffect(() => {
    const loadDashboardConfig = async () => {
      try {

        const mockApiResponse: DashboardApiResponse = {
          userType: 'vendor',
          metrics: [
            {
              id: 'revenue',
              label: 'Monthly Revenue',
              value: `$${vendorMetrics?.monthlyRevenue?.toLocaleString() || '2,800'}`,
              iconType: 'dollar-sign',
              iconColor: 'text-green-600',
              dotColor: 'bg-green-500',
              valueColor: 'text-green-600'
            },
            {
              id: 'potential',
              label: 'Potential This Month',
              value: `$${((vendorMetrics?.pendingBids || 3) * 1200).toLocaleString()}`,
              iconType: 'trending-up',
              iconColor: 'text-blue-600',
              dotColor: 'bg-blue-500',
              valueColor: 'text-blue-600'
            },
            {
              id: 'ranking',
              label: 'Network Ranking',
              value: `Top ${Math.floor(Math.random() * 15) + 5}%`,
              iconType: 'trophy',
              iconColor: 'text-yellow-600',
              dotColor: 'bg-yellow-500',
              valueColor: 'text-yellow-600'
            },
            {
              id: 'responseTime',
              label: 'Avg Response',
              value: '2.1 hrs',
              iconType: 'clock',
              iconColor: 'text-purple-600',
              dotColor: 'bg-purple-500',
              valueColor: 'text-purple-600'
            }
          ],
          heroContent: {
            backgroundImage: "/images/gradient-bg.png",
            socialProofText: `⚡ ${Math.floor(Math.random() * 12) + 8} new opportunities this week`,
            title: `$${((vendorMetrics?.pendingBids || 3) * 1200 + (vendorMetrics?.monthlyRevenue || 2800)).toLocaleString()} Available This Month!`,
            subtitle: `${vendor?.name || 'You'} could earn up to $${((vendorMetrics?.pendingBids || 3) * 1200).toLocaleString()} more by bidding on ${vendorMetrics?.pendingBids || 3} active projects. Your response time is 67% faster than average - leverage this advantage!`,
            badges: [
              { iconType: 'fire', label: 'Hot specialty: Electrical' },
              { iconType: 'trending-up', label: `+${Math.floor(Math.random() * 30) + 15}% vs last month` },
              { iconType: 'medal', label: `Top ${Math.floor(Math.random() * 15) + 5}% performer` }
            ],
            userInitials: ['⚡', '💰', '🏆'] // Energy, Money, Achievement
          },
          quickActionCards: [
            {
              id: 'hotProjects',
              type: 'upload',
              title: '🔥 Hot Projects Alert',
              subtitle: `$${((Math.floor(Math.random() * 8) + 12) * 1000).toLocaleString()} in total project value`,
              description: `${Math.floor(Math.random() * 8) + 5} urgent electrical jobs posted in the last 24hrs`,
              ctaText: 'Bid Now',
              isLimitedTime: true,
              iconType: 'fire',
              iconColor: 'text-red-600',
              gradientFrom: 'from-red-50',
              gradientTo: 'to-orange-50',
              borderColor: 'border-red-200',
              features: [
                { iconType: 'clock', text: 'Fast turnaround', color: 'text-red-500' },
                { iconType: 'trending-up', text: 'Premium rates', color: 'text-green-500' },
                { iconType: 'star', text: 'High-rating clients', color: 'text-yellow-500' }
              ],
              stats: `Only ${Math.floor(Math.random() * 4) + 2} vendors competing`
            },
            {
              id: 'aiPricing',
              type: 'preview',
              title: '🤖 AI Pricing Assistant',
              description: 'Get competitive pricing recommendations based on your win rate and market data',
              ctaText: 'Optimize Bids',
              image: '/images/ai_image.webp'
            }
          ],
          priorityActions: priorityActions,
          achievements: [
            {
              id: 'revenue_goal',
              label: 'Revenue Goal Progress',
              value: `$${vendorMetrics?.monthlyRevenue || 2800}`,
              subValue: `$${5000 - (vendorMetrics?.monthlyRevenue || 2800)} to reach $5K goal`,
              color: 'green',
              type: 'currency'
            },
            {
              id: 'market_share',
              label: 'Market Position',
              value: `Top ${Math.floor(Math.random() * 15) + 5}%`,
              subValue: `Outperforming ${Math.floor(Math.random() * 200) + 150} vendors`,
              color: 'blue',
              type: 'percentage'
            },
            {
              id: 'efficiency',
              label: 'Efficiency Score',
              value: `${Math.floor(Math.random() * 20) + 85}%`,
              subValue: `${Math.floor(Math.random() * 15) + 5}% above network average`,
              color: 'purple',
              type: 'percentage'
            },
            {
              id: 'streak',
              label: 'Win Streak',
              value: `${Math.floor(Math.random() * 8) + 3}`,
              subValue: 'Consecutive successful projects',
              color: 'orange',
              type: 'number'
            }
          ],
          smartInsights: [
            {
              id: 'market_surge',
              type: 'urgent',
              title: '🔥 Electrical Jobs Surge +47%',
              description: `Perfect timing for your specialty! ${Math.floor(Math.random() * 12) + 8} high-value electrical projects posted this week. Average bid: $1,850.`,
              ctaText: 'View Hot Projects',
              ctaEndpoint: '/marketplace?category=electrical',
              iconType: 'fire'
            },
            {
              id: 'competitive_advantage',
              type: 'opportunity',
              title: '⚡ Your Speed Advantage',
              description: 'Your 2.1hr response time beats 89% of vendors. Clients pay 12% more for fast responders. Leverage this in your next bid!',
              ctaText: 'Optimize Pricing',
              ctaEndpoint: '/api/pricing-optimizer',
              iconType: 'rocket'
            },
            {
              id: 'weekend_premium',
              type: 'savings',
              title: '💰 Weekend Premium Alert',
              description: 'Weekend assessments are paying 28% more this month. Consider expanding your availability for emergency calls.',
              ctaText: 'Update Availability',
              ctaEndpoint: '/api/schedule-weekend',
              iconType: 'calendar-plus'
            }
          ],
          emptyStateConfig: {
            title: 'Ready to Grow Your Business?',
            description: 'Start bidding on projects and build your reputation in our vendor network!',
            ctaText: 'Browse Opportunities',
            ctaEndpoint: '/marketplace'
          }
        };

        const config = transformApiResponseToConfig(mockApiResponse, {
          onUpload: () => navigate('/marketplace'),
          onNavigate: (path: string) => navigate(path),
          onApiCall: (endpoint: string) => console.log('API call to:', endpoint)
        });

        setDashboardConfig(config);
      } catch (error) {
        console.error('Failed to load dashboard config:', error);
      }
    };

    loadDashboardConfig();
  }, [vendorOffers.length, issues?.length, assessments?.length, vendor?.id, navigate]);

  // Handling error state
  if (issuesError) {
    return <p>Error loading dashboard data</p>;
  }

  if (isVendorLoading) {
    return <p>Loading vendor data...</p>;
  }
  
  if (vendorError) {
    return <p>Failed to load vendor data.</p>;
  }

  if (!vendor) {
    return <p>Vendor not found.</p>;
  }

  if (!dashboardConfig) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-6">

      {/* Metrics Overview */}
      {dashboardConfig && shouldShowComponent(dashboardConfig.metrics) && (
        <MetricsOverview 
          metrics={dashboardConfig.metrics!} 
          userType="vendor"
          userName={vendor?.name || 'Vendor'}
        />
      )}

      {/* Hero Banner */}
      {dashboardConfig && shouldShowComponent(dashboardConfig.heroData) && (
        <HeroBanner 
          heroData={dashboardConfig.heroData!} 
          userType="vendor"
        />
      )}

      {/* Quick Actions */}
      {dashboardConfig && shouldShowComponent(dashboardConfig.quickActionCards) && (
        <QuickActions 
          actions={dashboardConfig.quickActionCards!}
          userType="vendor"
          fileInputRef={fileInputRef}
        />
      )}

      <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
        <div className="col-span-12 2xl:col-span-8">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
            {/* Smart Insights */}
            {dashboardConfig && shouldShowComponent(dashboardConfig.smartInsights) && (
              <div className="col-span-12">
                <SmartInsights 
                  insights={dashboardConfig.smartInsights!}
                  userType="vendor"
                />
              </div>
            )}

            {/* Assessment Calendar */}
            <div className="col-span-12">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4">Assessment Schedule</h3>
                <UserCalendar events={calendarEvents as any} />
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="col-span-12">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4">Upcoming Events</h3>
                <Agenda events={calendarEvents as any} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 2xl:col-span-4">
          <div className="gap-6 grid grid-cols-1">
            {/* Priority Actions */}
            {dashboardConfig && shouldShowComponent(dashboardConfig.priorityActions) && (
              <PriorityActions 
                actions={dashboardConfig.priorityActions!}
                title="High-Value Opportunities"
                subtitle="Projects worth your immediate attention"
                userType="vendor"
              />
            )}

            {/* Achievements */}
            {dashboardConfig && shouldShowComponent(dashboardConfig.achievements) && (
              <Achievements 
                achievements={dashboardConfig.achievements!}
                userType="vendor"
              />
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        accept="image/*,.pdf"
        multiple
      />
    </div>
  );
};

export default Dashboard;
