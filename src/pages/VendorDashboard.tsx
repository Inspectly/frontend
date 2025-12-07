import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { store } from "../store/store";
import { User, IssueOfferStatus } from "../types";
import UserCalendar from "../components/UserCalendar";
import Agenda from "../components/Agenda";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";

import { useGetAssessmentsByUserIdQuery } from "../features/api/issueAssessmentsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetOffersByVendorIdQuery, getOffersByIssueId } from "../features/api/issueOffersApi";

// Import new reusable components
import MetricsOverview from "../components/MetricsOverview";
import HeroBanner from "../components/HeroBanner";
import SmartInsights from "../components/SmartInsights";
import QuickActions from "../components/QuickActions";
import PriorityActions from "../components/PriorityActions";
import Achievements from "../components/Achievements";


// Import types and utilities
import { DashboardConfig, DashboardApiResponse } from "../types/dashboard";
import { transformApiResponseToConfig, shouldShowComponent, getSocialProofForDashboard } from "../utils/dashboardUtils";


interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: vendor,
    isLoading: isVendorLoading,
    error: vendorError,
  } = useGetVendorByVendorUserIdQuery(String(user.id));

  const {
    data: assessments,
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

  const {
    data: listings,
  } = useGetListingsQuery();

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
           title: 'Electrical Assessment - Issue #247',
           start: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
           end: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours duration
           user_id: user.id
         },
         {
           id: 'mock_2', 
           title: 'HVAC System Inspection - Issue #251',
           start: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
           end: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours duration
           user_id: user.id
         },
         {
           id: 'mock_3',
           title: 'Plumbing Emergency Assessment - Issue #253',
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

  // Get earning multiplier based on issue type
  const getTypeMultiplier = (type: string): number => {
    const multipliers: Record<string, number> = {
      'electrical': 1.2,     // Higher skill, higher pay
      'plumbing': 1.1,
      'hvac': 1.3,          // Specialized equipment
      'structural': 1.4,     // High complexity
      'roofing': 1.2,
      'painting': 0.8,       // Lower skill barrier
      'flooring': 1.0,
      'windows': 1.1,
      'doors': 0.9,
      'insulation': 1.0,
      'landscaping': 0.9
    };
    return multipliers[type?.toLowerCase()] || 1.0;
  };

  // State for priority actions with async calculation (API format before transformation)
  const [priorityActions, setPriorityActions] = useState<Array<{
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
    reasons?: string[];
  }>>([]);

  // Generate priority actions from high-value opportunities based on listings with high/medium severity issues
  useEffect(() => {
    const calculatePriorityActions = async () => {
      if (!issues || !listings) {
        setPriorityActions([]);
        return;
      }

      // Filter issues by high and medium severity
      const highValueIssues = issues.filter(issue => 
        issue.severity === 'high' || issue.severity === 'medium'
      );

      // Prioritize high severity first, then medium
      const sortedIssues = highValueIssues.sort((a, b) => {
        if (a.severity === 'high' && b.severity !== 'high') return -1;
        if (b.severity === 'high' && a.severity !== 'high') return 1;
        return 0;
      });

      try {
        // Take top 3 opportunities and calculate earnings based on actual bids
        const opportunities = await Promise.all(
          sortedIssues.slice(0, 3).map(async (issue) => {
            const urgencyLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 
              issue.severity === 'high' ? 'HIGH' : 
              issue.severity === 'medium' ? 'MEDIUM' : 'LOW';
            
            // Fetch actual bids for this issue to calculate realistic earning potential
            let estimatedEarnings = 0;
            let competitorCount = 0;
            let offers: any[] = [];
            
            try {
              const offersResult = await store.dispatch(getOffersByIssueId.initiate(issue.id));
              offers = offersResult.data || [];
              competitorCount = offers.length;
              
              if (offers.length > 0) {
                // Calculate average of existing bids as earning potential
                const totalBids = offers.reduce((sum, offer) => sum + (offer.price || 0), 0);
                estimatedEarnings = Math.round(totalBids / offers.length);
              } else {
                // Fallback: estimate based on severity and issue type if no bids yet
                const baseEarnings = issue.severity === 'high' ? 3000 : 2000;
                const typeMultiplier = getTypeMultiplier(issue.type);
                estimatedEarnings = Math.round(baseEarnings * typeMultiplier);
              }
            } catch (error) {
              console.error('Error fetching offers for issue:', issue.id, error);
              // Fallback calculation
              estimatedEarnings = issue.severity === 'high' ? 3000 : 2000;
            }
            
            const titleText = offers?.length > 0 ? 
              `${issue.type} - Avg Bid: $${estimatedEarnings.toLocaleString()}` : 
              `${issue.type} - Be First to Bid`;
            // Determine reason candidates with weights for ordering
            const averageTicket = (vendorMetrics?.activeJobs || 0) > 0
              ? (vendorMetrics?.monthlyRevenue || 0) / Math.max(1, vendorMetrics.activeJobs)
              : 0;
            const isHighEarnings = estimatedEarnings > Math.max(1500, (averageTicket || 1000) * 1.2);
            const createdAt = (issue as any).created_at ? new Date((issue as any).created_at) : null;
            const hoursSinceCreated = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60) : Infinity;
            const isNewlyPosted = hoursSinceCreated <= 72; // 3 days

            const reasonCandidates: Array<{ label: string; ok: boolean; weight: number }> = [
              { label: 'High urgency', ok: issue.severity === 'high', weight: 100 },
              { label: 'High earnings potential', ok: isHighEarnings, weight: 90 },
              { label: 'Low competition', ok: competitorCount <= 1, weight: 80 },
              { label: 'Newly posted', ok: isNewlyPosted, weight: 70 },
              { label: 'High vendor rating', ok: (vendorMetrics?.avgRating || 0) >= 4.5, weight: 60 },
              { label: 'Bandwidth available', ok: (vendorMetrics?.pendingBids || 0) < 5, weight: 50 },
            ];
            const reasons = reasonCandidates
              .filter(r => r.ok)
              .sort((a, b) => b.weight - a.weight)
              .map(r => r.label)
              .slice(0, 3);
            
            return {
              id: `opportunity_${issue.id}`,
              title: titleText,
              description: `${issue.summary} • ${issue.severity} severity${competitorCount > 0 ? ` • ${competitorCount} existing bids` : ' • No bids yet'}`,
              urgencyLevel,
              savings: offers?.length > 0 ? estimatedEarnings : undefined, // Only show savings if there are actual bids
              iconType: getIssueIcon(issue.type || 'electrical'),
              iconColor: urgencyLevel === 'HIGH' ? 'bg-red-500' : 'bg-orange-500',
              ctaText: competitorCount > 0 ? 'Submit Bid' : 'Be First to Bid',
              ctaLink: `/marketplace/${issue.id}`,
              metadata: competitorCount > 0 ? `${competitorCount} competing bids` : 'No competition yet',
              reasons
            };
          })
        );

        // If no high/medium severity issues, show fallback
        if (opportunities.length === 0) {
          setPriorityActions([
            {
              id: 'no_opportunities',
              title: 'New Opportunities Coming Soon',
              description: 'Check back regularly for high-value projects matching your expertise.',
              urgencyLevel: 'LOW' as const,
              savings: undefined, // No savings amount for this fallback
              iconType: 'toolbox',
              iconColor: 'bg-gray-500',
              ctaText: 'Browse All',
              ctaLink: '/marketplace',
              metadata: 'Stay updated'
            }
          ]);
        } else {
          setPriorityActions(opportunities);
        }
      } catch (error) {
        console.error('Error calculating priority actions:', error);
        setPriorityActions([]);
      }
    };

    calculatePriorityActions();
  }, [issues, listings, dispatch]);



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
            socialProofText: getSocialProofForDashboard('vendor'),
             title: `$${((vendorMetrics?.pendingBids || 3) * 1200 + (vendorMetrics?.monthlyRevenue || 2800)).toLocaleString()} Available This Month!`,
             subtitle: `${vendor?.name || 'You'} could earn up to $${((vendorMetrics?.pendingBids || 3) * 1200).toLocaleString()} more by bidding on ${vendorMetrics?.pendingBids || 3} active projects. Your response time is 67% faster than average - leverage this advantage!`,
             badges: [
               { iconType: 'fire', label: 'Specialty: Electrical' },
               { iconType: 'trending-up', label: `+${Math.floor(Math.random() * 30) + 15}% vs last month` },
               { iconType: 'medal', label: `Top ${Math.floor(Math.random() * 15) + 5}% performer` }
             ],
            // Remove mock initials to avoid misleading UI
            userInitials: []
           },
                     quickActionCards: [
             {
               id: 'hotProjects',
               type: 'upload',
               title: 'High Priority Projects',
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
               title: 'AI Pricing Assistant',
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
              value: `${vendorMetrics?.monthlyRevenue || 2800}`,
              subValue: `$${5000 - (vendorMetrics?.monthlyRevenue || 2800)} to reach $5K goal`,
              color: 'green',
              type: 'currency'
            },
            {
              id: 'market_share',
              label: 'Market Position',
              value: `Top ${Math.floor(Math.random() * 15) + 5}`,
              subValue: `Outperforming ${Math.floor(Math.random() * 200) + 150} vendors`,
              color: 'blue',
              type: 'percentage'
            },
            {
              id: 'efficiency',
              label: 'Efficiency Score',
              value: `${Math.floor(Math.random() * 20) + 85}`,
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
               title: 'Electrical Jobs Surge +47%',
               description: `Perfect timing for your specialty! ${Math.floor(Math.random() * 12) + 8} high-value electrical projects posted this week. Average bid: $1,850.`,
               ctaText: 'View Available Projects',
               ctaEndpoint: '/marketplace?category=electrical',
               iconType: 'fire'
             },
            // Follow up stale bids insight (bids older than 48h that are still RECEIVED)
            ...(() => {
              try {
                const now = Date.now();
                const staleBids = (vendorOffers || []).filter(b => b.status === IssueOfferStatus.RECEIVED && (now - new Date(b.created_at).getTime()) / (1000 * 60 * 60) > 48);
                if (staleBids.length > 0) {
                  return [{
                    id: 'follow_up_bids',
                    type: 'opportunity' as const,
                    title: 'Follow Up On Pending Bids',
                    description: `${staleBids.length} bid${staleBids.length > 1 ? 's' : ''} pending for over 48h. A quick follow-up can increase win rate by 18%.`,
                    ctaText: 'Review Pending Bids',
                    ctaEndpoint: '/marketplace?tab=my-bids',
                    iconType: 'clock'
                  }];
                }
                return [];
              } catch {
                return [];
              }
            })(),
            {
               id: 'competitive_advantage',
               type: 'opportunity',
               title: 'Response Time Advantage',
               description: 'Your 2.1hr response time beats 89% of vendors. Clients pay 12% more for fast responders. Leverage this in your next bid!',
               ctaText: 'Optimize Pricing',
               ctaEndpoint: '/api/pricing-optimizer',
               iconType: 'rocket'
             },
             {
               id: 'weekend_premium',
               type: 'savings',
               title: 'Weekend Premium Opportunity',
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
  }, [vendorOffers.length, issues?.length, assessments?.length, vendor?.id, navigate, priorityActions]);

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
        <div className="mb-6">
          <MetricsOverview 
            metrics={dashboardConfig.metrics!} 
            userType="vendor"
            userName={vendor?.name || 'Vendor'}
          />
        </div>
      )}

      {/* Hero Banner */}
      {dashboardConfig && shouldShowComponent(dashboardConfig.heroData) && (
        <div className="mb-6">
          <HeroBanner
            heroData={dashboardConfig.heroData!}
            userType="vendor"
          />
        </div>
      )}

      {/* Quick Actions */}
      {dashboardConfig && shouldShowComponent(dashboardConfig.quickActionCards) && (
        <div className="mb-6">
          <QuickActions 
            actions={dashboardConfig.quickActionCards!}
            userType="vendor"
            fileInputRef={fileInputRef}
          />
      </div>
      )}

      <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
        <div className="col-span-12 2xl:col-span-8">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
            {/* Smart Insights */}
            {dashboardConfig && shouldShowComponent(dashboardConfig.smartInsights) && (
              <div className="col-span-12 mb-6">
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
              <div className="mb-6">
                <PriorityActions 
                  actions={dashboardConfig.priorityActions!}
                  title="High-Value Opportunities"
                  subtitle="Projects worth your immediate attention"
                  userType="vendor"
                  isLoading={isVendorLoading}
                />
              </div>
            )}

            {/* Achievements */}
            {dashboardConfig && shouldShowComponent(dashboardConfig.achievements) && (
              <div className="mb-6">
                <Achievements 
                  achievements={dashboardConfig.achievements!}
                  userType="vendor"
                />
                          </div>
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
