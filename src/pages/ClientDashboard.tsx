import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserCalendar from "../components/UserCalendar";
import { useUploadReportFileMutation, useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import {
  faBolt,
  faBroom,
  faBuilding,
  faGripLines,
  faHammer,
  faHouse,
  faLayerGroup,
  faLeaf,
  faPaintRoller,
  faQuestionCircle,
  faSnowflake,
  faTint,
  faToolbox,
  faWind,
  faWrench,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import {
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  IssueOffer,
  IssueType,
  User,
  Vendor,
} from "../types";
import VendorMap from "../components/VendorMap";
import Realtors from "../components/Realtors";
import ImageComponent from "../components/ImageComponent";
import { getIssueById, useGetIssuesQuery } from "../features/api/issuesApi";
import { useCreateListingMutation, useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetAssessmentsByClientIdUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import { getOffersByIssueId } from "../features/api/issueOffersApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { getVendorById } from "../features/api/vendorsApi";
import  AddListingByReportModal, { ListingByReportFormData } from "../components/AddListingByReportModal";
import { handleAddListingWithReport } from "../utils/reportUtil";

// dashboard pieces
import MetricsOverview from "../components/MetricsOverview";
import HeroBanner from "../components/HeroBanner";
import SmartInsights from "../components/SmartInsights";
import QuickActions from "../components/QuickActions";
import PriorityActions from "../components/PriorityActions";
import Achievements from "../components/Achievements";
import SocialProof from "../components/SocialProof";

import { DashboardConfig, DashboardApiResponse } from "../types/dashboard";
import { transformApiResponseToConfig, shouldShowComponent, getSocialProofForDashboard } from "../utils/dashboardUtils";

interface DashboardProps {
  user: User;
}

const ClientDashboard: React.FC<DashboardProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: _listings } = useGetListingByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: reports, refetch: refetchReports } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });
  const { data: issues } = useGetIssuesQuery();
  const { data: clients } = useGetClientsQuery();
  const client = clients?.find((c) => c.user_id === user.id);

  const { data: assessments = [] } =
    useGetAssessmentsByClientIdUsersInteractionIdQuery(user.id);

  const [createListing] = useCreateListingMutation();
  const [uploadReportFile] = useUploadReportFileMutation();

  // Parse accepted assessments and extract vendor_id
  const acceptedAssessments = useMemo(() => {
    return assessments
      .filter((a) => a.status === IssueAssessmentStatus.ACCEPTED)
      .map((a) => {
        const parts = a.users_interaction_id?.split("_") ?? [];
        const vendor_id = parts.length > 1 ? parseInt(parts[1], 10) : NaN;
        return { ...a, vendor_id: Number.isFinite(vendor_id) ? vendor_id : null };
      })
      .filter((a) => a.vendor_id !== null) as Array<(typeof assessments)[number] & { vendor_id: number }>;
  }, [assessments]);

  // Unique IDs (memoized)
  const issueIds = useMemo(
    () => [...new Set(acceptedAssessments.map((a) => a.issue_id))],
    [acceptedAssessments]
  );
  const vendorIds = useMemo(
    () => [...new Set(acceptedAssessments.map((a) => a.vendor_id))],
    [acceptedAssessments]
  );

  // Lookups/state
  const [issueMap, setIssueMap] = useState<Record<number, IssueType>>({});
  const [vendorMap, setVendorMap] = useState<Record<number, Vendor>>({});
  const [offersByIssueId, setOffersByIssueId] = useState<Record<number, IssueOffer[]>>({});
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [isAddListingModalOpen, setIsAddListingModalOpen] = useState<boolean>(false);

  // Optional: icons if needed later
  const issueIcons: Record<string, IconDefinition> = {
    general: faToolbox,
    structural: faBuilding,
    electrician: faBolt,
    plumber: faTint,
    painter: faPaintRoller,
    cleaner: faBroom,
    hvac: faWind,
    roofing: faHouse,
    insulation: faSnowflake,
    drywall: faGripLines,
    plaster: faLayerGroup,
    carpentry: faHammer,
    landscaping: faLeaf,
    other: faQuestionCircle,
  };

  // Issues for this user
  const filteredIssuesByUser = useMemo(() => {
    if (!issues || !reports) return [];
    const userReportIds = reports.filter((r) => r.user_id === user.id).map((r) => r.id);
    return issues.filter((issue) => userReportIds.includes(issue.report_id));
  }, [issues, reports, user.id]);

  // Calendar events (future only)
  const calendarEvents = useMemo(() => {
    return assessments
      .filter((a) => new Date(a.start_time) > new Date())
      .map((a) => ({
        id: a.id,
        title: `Assessment - Issue #${a.issue_id}`,
        start: new Date(a.start_time),
        end: new Date(a.end_time),
        user_id: a.user_id,
      })) as CalendarReadyAssessment[];
  }, [assessments]);

  // Realtors
  const realtorTeamMembers = [
    {
      image: "/images/Manzur.jpeg",
      name: "Manzur Mulk",
      company: "Senior Real Estate Advisor",
      quote:
        "Helping families find their dream homes with expert market knowledge and personalized service.",
    },
    {
      image: "/images/Sharhad.jpg",
      name: "Sharhad Bashar",
      company: "Property Investment Specialist",
      quote:
        "Maximizing property investment returns through strategic analysis and market insights.",
    },
    {
      image: "/images/Yousef.png",
      name: "Yousef Ouda",
      company: "Residential Sales Expert",
      quote: "Dedicated to making your home buying journey smooth and stress-free.",
    },
    {
      image: "/images/Mohammed_Hussein.jpg",
      name: "Mohammed Hussein",
      company: "Commercial Real Estate Broker",
      quote:
        "Connecting businesses with prime commercial properties for growth and success.",
    },
  ];

  // (kept; QuickActions still accepts these handlers even if modal is used)
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      if (file.type === "application/pdf") {
        console.log("Processing PDF file:", file.name);
      }
    });
  };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files).filter(
      (f) => f.type === "application/pdf"
    );
    files.forEach((file) => {
      console.log("Processing dropped PDF:", file.name);
    });
  };

  // Fetch issues/vendors and offers
  useEffect(() => {
    const run = async () => {
      try {
        const issueResults = await Promise.all(
          issueIds.map((id) => dispatch(getIssueById.initiate(String(id))))
        );
        const vendorResults = await Promise.all(
          vendorIds.map((id) => dispatch(getVendorById.initiate(String(id))))
        );

        const nextIssueMap = Object.fromEntries(
          issueResults.map((res, i) => [issueIds[i], res.data as IssueType])
        );
        const nextVendorMap = Object.fromEntries(
          vendorResults.map((res, i) => [vendorIds[i], res.data as Vendor])
        );

        setIssueMap(nextIssueMap);
        setVendorMap(nextVendorMap);

        const offerResults = await Promise.all(
          issueIds.map((id) => dispatch(getOffersByIssueId.initiate(id)))
        );
        const nextOffers = Object.fromEntries(
          offerResults.map((res, i) => [issueIds[i], (res.data as IssueOffer[]) || []])
        );
        setOffersByIssueId(nextOffers);
      } catch (err) {
        console.error("Error fetching issue/vendor/offer data:", err);
      }
    };

    if (issueIds.length || vendorIds.length) run();
  }, [dispatch, issueIds, vendorIds]);

  // Build dashboard config (mock + real data) — onUpload now opens the modal
  useEffect(() => {
    const generatePriorityActions = () => {
      if (!filteredIssuesByUser.length || !Object.keys(offersByIssueId).length || !reports) {
        return [];
      }

      return filteredIssuesByUser
        .filter((issue) => (offersByIssueId[issue.id] ?? []).length > 0)
        .slice(0, 3)
        .map((issue) => {
          const offers = offersByIssueId[issue.id] ?? [];
          const savings = offers.length ? Math.max(...offers.map((o) => o.price || 0)) : 0;
          const urgencyLevel: "HIGH" | "MEDIUM" | "LOW" =
            issue.severity === "high" ? "HIGH" : issue.severity === "medium" ? "MEDIUM" : "LOW";

          const report = reports.find((r) => r.id === issue.report_id);
          const listingId = report?.listing_id ?? 1;

          const createdAt = (issue as any).created_at ? new Date((issue as any).created_at) : null;
          const hoursSinceCreated = createdAt ? (Date.now() - createdAt.getTime()) / 36e5 : Infinity;
          const isNewlyPosted = hoursSinceCreated <= 72;

          const savingsThreshold = Math.max(500, savings * 0.2);
          const reasonCandidates = [
            { label: "High urgency", ok: issue.severity === "high", weight: 100 },
            { label: "High savings potential", ok: savings > savingsThreshold, weight: 90 },
            { label: "Multiple offers", ok: offers.length >= 3, weight: 80 },
            { label: "Newly posted", ok: isNewlyPosted, weight: 70 },
          ];
          const reasons = reasonCandidates
            .filter((r) => r.ok)
            .sort((a, b) => b.weight - a.weight)
            .map((r) => r.label)
            .slice(0, 3);

          const iconMap: Record<string, string> = {
            electrical: "bolt",
            plumbing: "tint",
            plumber: "tint",
            hvac: "wind",
            roofing: "house",
            structural: "hammer",
            painting: "paint-roller",
            painter: "paint-roller",
            flooring: "broom",
            windows: "building",
            doors: "building",
            insulation: "snowflake",
            landscaping: "leaf",
          };
          const iconKey = iconMap[issue.type?.toLowerCase?.() || ""] || "wrench";

          return {
            id: `issue_${issue.id}`,
            title: `${issue.type?.[0]?.toUpperCase?.() || ""}${issue.type?.slice?.(1) || "Issue"} #${issue.id}`,
            description: issue.summary,
            urgencyLevel,
            savings,
            iconType: iconKey,
            iconColor: urgencyLevel === "HIGH" ? "bg-red-500" : urgencyLevel === "MEDIUM" ? "bg-orange-500" : "bg-green-500",
            ctaText: urgencyLevel === "HIGH" ? "Review Now" : "View Offers",
            ctaLink: `/listings/${listingId}/reports/${issue.report_id}/issues/${issue.id}?tab=offers`,
            metadata: `${offers.length} competitive offers`,
            reasons,
          };
        });
    };

    const loadDashboardConfig = async () => {
      try {
        const realPriorityActions = generatePriorityActions();
        const recentListings = [...(_listings || [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3);

        const mockApiResponse: DashboardApiResponse = {
          userType: "client",
          metrics: [
            {
              id: "health",
              label: "Property Health Score",
              value: "8.7/10",
              iconType: "check-circle",
              iconColor: "text-green-600",
              dotColor: "bg-green-500",
              valueColor: "text-green-600",
            },
            {
              id: "savings",
              label: "Potential Savings",
              value: `$${Object.values(offersByIssueId).flat().length * 150}`,
              iconType: "dollar-sign",
              iconColor: "text-green-600",
              dotColor: "bg-blue-500",
            },
            {
              id: "urgent",
              label: "Urgent Items",
              value: filteredIssuesByUser.filter((i) => i.severity === "high").length || 0,
              iconType: "exclamation-triangle",
              iconColor: "text-orange-500",
              dotColor: "bg-orange-500",
            },
            {
              id: "completion",
              label: "Completion Rate",
              value: "85%",
              iconType: "bullseye",
              iconColor: "text-blue-600",
              dotColor: "bg-purple-500",
            },
          ],
          heroContent: {
            backgroundImage: "/images/gradient-bg.png",
            socialProofText: getSocialProofForDashboard("client"),
            title: "You've Saved $2,340 This Year!",
            subtitle:
              "Our AI-powered platform has helped you find the best deals and avoid costly mistakes. Keep the momentum going with your next inspection report!",
            badges: [
              { iconType: "bolt", label: "2-min AI analysis" },
              { iconType: "dollar-sign", label: "Average 23% savings" },
              { iconType: "trophy", label: "98% satisfaction" },
            ],
            userInitials: [],
          },
          smartInsights: [
            {
              id: "electrical",
              type: "urgent",
              title: "Electrical Safety Check",
              description: "Properties built before 1980 need updated wiring. Schedule before winter.",
              ctaText: "Get Quotes Now",
              ctaEndpoint: "/api/electrical-quotes",
              iconType: "exclamation-triangle",
            },
            {
              id: "hvac",
              type: "savings",
              title: "Winter Prep Discount",
              description: "HVAC maintenance 30% off through October. Book now, save $340.",
              ctaText: "Claim Discount",
              ctaEndpoint: "/api/hvac-discount",
              iconType: "dollar-sign",
            },
            {
              id: "kitchen",
              type: "opportunity",
              title: "Property Value Boost",
              description: "Kitchen updates could increase your home value by $8,500.",
              ctaText: "Learn More",
              ctaEndpoint: "/api/kitchen-updates",
              iconType: "chart-line",
            },
          ],
          achievements: [
            { id: "saved", label: "Total Saved", value: "$2,340", subValue: "+$340 this month", color: "green", type: "currency" },
            { id: "rating", label: "Avg Vendor Rating", value: "4.8", subValue: "Above average", color: "blue", type: "rating" },
            { id: "response", label: "Days Avg Response", value: "3.2", subValue: "47% faster", color: "purple", type: "number" },
            { id: "resolved", label: "Issues Resolved", value: "12", subValue: "85% success rate", color: "orange", type: "number" },
          ],
          progressGoal: {
            title: "Monthly Goal Progress",
            description: "Complete 3 more repairs",
            progress: 67,
            badgeText: 'Complete your goal to earn "Super Saver" badge!',
          },
          testimonials: [
            {
              id: "sarah",
              name: "Sarah M.",
              location: "Denver, CO",
              rating: 5,
              text:
                "Saved $1,200 on electrical work! The AI found issues I never would have noticed. Best platform ever!",
              metrics: "Saved $1,200 • 3 days turnaround",
            },
            {
              id: "mike",
              name: "Mike R.",
              location: "Austin, TX",
              rating: 5,
              text:
                "The competitive bidding saved me 30% on HVAC repair. Vendors are pre-vetted and professional!",
              metrics: "Saved $850 • 5-star vendors",
            },
            {
              id: "jennifer",
              name: "Jennifer L.",
              location: "Miami, FL",
              rating: 5,
              text:
                "Property value increased $15K after following the AI recommendations. ROI was incredible!",
              metrics: "+$15K value • Smart recommendations",
            },
          ],
          communityStats: [
            { id: "customers", value: "12,847+", label: "Happy Customers", color: "indigo" },
            { id: "savings", value: "$2.3M+", label: "Total Savings", color: "green" },
            { id: "rating", value: "4.9⭐", label: "Average Rating", color: "purple" },
            { id: "satisfaction", value: "98%", label: "Satisfaction Rate", color: "orange" },
          ],
          quickActionCards: [
            {
              id: "upload",
              type: "upload",
              title: "Upload Inspection Report",
              subtitle: "This month only: Free priority analysis + $50 bonus for new uploads",
              description: "Upload Your Inspection Report & Get Competitive Offers",
              ctaText: "Upload Report Now",
              isLimitedTime: true,
              iconType: "toolbox",
              iconColor: "text-green-600",
              gradientFrom: "from-green-50",
              gradientTo: "to-blue-50",
              borderColor: "border-green-200",
              features: [
                { iconType: "bolt", text: "2-min AI analysis", color: "text-orange-500" },
                { iconType: "dollar-sign", text: "Instant estimates", color: "text-green-500" },
                { iconType: "check-circle", text: "PDF upload only", color: "text-blue-500" },
              ],
              stats: "Join 847 property owners who uploaded inspection reports this week",
            },
            ...(recentListings.length
              ? []
              : [
                  {
                    id: "recent",
                    type: "preview" as const,
                    title: "Recent Listings",
                    description: "No listings yet. Create your first listing to get started.",
                    ctaText: "Create Listing",
                    image: "/images/property_card_holder.jpg",
                  },
                ]),
          ],
          priorityActions: realPriorityActions,
          emptyStateConfig: {
            title: "Ready to Save Money?",
            description: "Upload your first inspection report and get competitive offers within 24 hours!",
            ctaText: "Upload Report Now",
            ctaEndpoint: "/api/upload",
          },
        };

        // <<< HERE: change onUpload to open the modal >>>
        const config = transformApiResponseToConfig(mockApiResponse, {
          onUpload: () => setIsAddListingModalOpen(true),
          onNavigate: (path: string) => navigate(path),
          onApiCall: (endpoint: string) => console.log("API call to:", endpoint),
        });

        setDashboardConfig(config);
      } catch (err) {
        console.error("Failed to load dashboard config:", err);
      }
    };

    loadDashboardConfig();
  }, [
    _listings?.length,
    filteredIssuesByUser.length,
    JSON.stringify(offersByIssueId),
    reports?.length,
    assessments?.length,
    navigate,
  ]);

  if (!dashboardConfig) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-100 rounded"></div>
          </div>
          <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
            <div className="col-span-12 2xl:col-span-8 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
            <div className="col-span-12 2xl:col-span-4 space-y-6">
              <div className="h-60 bg-gray-100 rounded"></div>
              <div className="h-60 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Metrics Overview */}
      <div className="mb-6">
        <MetricsOverview
          userName={client?.first_name || "User"}
          userType={dashboardConfig.userType}
          metrics={dashboardConfig.metrics}
          quickActions={dashboardConfig.quickActions}
        />
      </div>

      {/* Hero Banner */}
      {shouldShowComponent(dashboardConfig.heroData) && (
        <div className="mb-6">
          <HeroBanner heroData={dashboardConfig.heroData!} userType={dashboardConfig.userType} />
        </div>
      )}

      {/* Quick Actions + Recent Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {shouldShowComponent(dashboardConfig.quickActionCards) && (
          <div className="[&>div]:!grid-cols-1 [&>div]:!mb-0">
            <QuickActions
              actions={dashboardConfig.quickActionCards!}
              userType={dashboardConfig.userType}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
              onDrop={handleDrop}
            />
          </div>
        )}

        {_listings && _listings.length > 0 && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Recent Listings</h3>
                <button
                  onClick={() => navigate("/listings")}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {[..._listings]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .slice(0, 3)
                  .map((listing) => (
                    <div
                      key={listing.id}
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300 flex gap-3"
                    >
                      <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageComponent
                          src={listing.image_url}
                          fallback="/images/property_card_holder.jpg"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 truncate text-sm">
                          {listing.address}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          {listing.city}, {listing.state}
                        </p>
                        <p className="text-xs text-gray-500">
                          Added {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Insights */}
      {shouldShowComponent(dashboardConfig.smartInsights) && (
        <SmartInsights insights={dashboardConfig.smartInsights!} userType={dashboardConfig.userType} />
      )}

      {/* Assessment Calendar + Vendor Map (Create Listing section removed) */}
      <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
        <div className="col-span-12 2xl:col-span-8">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
            <div className="col-span-12">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4">Assessment Calendar</h3>
                <UserCalendar events={calendarEvents as any} />
              </div>
            </div>

            {/* Removed the "Add a new listing" dashed card here */}

            <div className="col-span-12">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4">Vendor Network</h3>
                <VendorMap />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 2xl:col-span-4">
          <div className="gap-6 grid grid-cols-1">
            {shouldShowComponent(dashboardConfig.priorityActions) && (
              <PriorityActions
                actions={dashboardConfig.priorityActions!}
                userType={dashboardConfig.userType}
                emptyStateConfig={dashboardConfig.emptyStateConfig}
              />
            )}

            {shouldShowComponent(dashboardConfig.achievements) && (
              <Achievements
                achievements={dashboardConfig.achievements!}
                progressGoal={dashboardConfig.progressGoal}
                userType={dashboardConfig.userType}
                statusBadge={{ text: "ON FIRE", color: "green" }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Social Proof */}
      {shouldShowComponent(dashboardConfig.testimonials) &&
        shouldShowComponent(dashboardConfig.communityStats) && (
          <SocialProof
            testimonials={dashboardConfig.testimonials!}
            communityStats={dashboardConfig.communityStats!}
            userType={dashboardConfig.userType}
            ctaText="Upload Your Next Report"
            ctaAction={() => setIsAddListingModalOpen(true)}
          />
        )}

      {/* Partner Realtors */}
      <div className="mt-6">
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-xl font-semibold">Trusted Partner Network</h3>
            <p className="text-gray-600 text-sm">
              Professional realtors and service providers in our ecosystem
            </p>
          </div>
          <div className="p-6">
            <Realtors team={realtorTeamMembers} />
          </div>
        </div>
      </div>

      <AddListingByReportModal
        isOpen={isAddListingModalOpen}
        onClose={() => setIsAddListingModalOpen(false)}
        onSubmit={async (formData: ListingByReportFormData) => {
          try {
            await handleAddListingWithReport({
              formData,
              user_id: user.id,
              createListing,
              uploadReportFile,
              refetch: refetchReports,
              onClose: () => setIsAddListingModalOpen(false),
            });
          } catch (err) {
            console.error("Failed to create listing:", err);
          }
        }}
      />
    </div>
  );
};

export default ClientDashboard;
