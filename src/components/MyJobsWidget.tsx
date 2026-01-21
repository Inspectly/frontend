import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBriefcase,
  faClock,
  faCheckCircle,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { IssueOffer, IssueOfferStatus, IssueType } from "../types";

// Note: The backend's vendor_id field stores vendor_user_id (user.id), not vendor table id
interface MyJobsWidgetProps {
  vendorOffers: IssueOffer[];
  issuesMap?: Record<number, IssueType>;
}

const MyJobsWidget: React.FC<MyJobsWidgetProps> = ({ vendorOffers, issuesMap = {} }) => {
  const navigate = useNavigate();

  // Calculate job statistics
  const jobStats = useMemo(() => {
    const activeJobs = vendorOffers.filter((offer) => offer.status === IssueOfferStatus.ACCEPTED);
    const pendingOffers = vendorOffers.filter((offer) => offer.status === IssueOfferStatus.RECEIVED);
    const totalRevenue = activeJobs.reduce((sum, offer) => sum + (offer.price || 0), 0);

    return {
      activeJobs,
      pendingOffers,
      totalRevenue,
      activeCount: activeJobs.length,
      pendingCount: pendingOffers.length,
    };
  }, [vendorOffers]);

  // Get the most important jobs to display (3-5 max)
  const importantJobs = useMemo(() => {
    // Prioritize: Active jobs first, then recent pending offers
    const jobs = [
      ...jobStats.activeJobs.slice(0, 3),
      ...jobStats.pendingOffers.slice(0, 2),
    ].slice(0, 5);

    return jobs;
  }, [jobStats]);

  const getStatusBadge = (status: IssueOfferStatus) => {
    if (status === IssueOfferStatus.ACCEPTED) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
          <FontAwesomeIcon icon={faCheckCircle} className="w-3 h-3" />
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
        <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const getIssueIcon = (): IconDefinition => {
    // Add icon mapping based on issue type if needed
    return faBriefcase;
  };

  if (vendorOffers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">My Jobs</h3>
        </div>
        <div className="text-center py-8">
          <FontAwesomeIcon
            icon={faBriefcase}
            className="w-12 h-12 text-gray-300 mb-3 mx-auto"
          />
          <p className="text-gray-500 text-sm mb-4">No jobs yet</p>
          <button
            onClick={() => navigate("/marketplace")}
            className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
          >
            Browse Opportunities
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">My Jobs</h3>
        <button
          onClick={() => navigate("/vendor/jobs")}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3 border border-green-100">
          <div className="text-2xl font-bold text-green-700">{jobStats.activeCount}</div>
          <div className="text-xs text-green-600 font-medium">Active</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-700">{jobStats.pendingCount}</div>
          <div className="text-xs text-yellow-600 font-medium">Pending</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="text-lg font-bold text-blue-700">
            ${jobStats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600 font-medium">Revenue</div>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-2">
        {importantJobs.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-sm">
            No active or pending jobs
          </div>
        ) : (
          importantJobs.map((offer) => {
            const issue = issuesMap[offer.issue_id];
            return (
              <div
                key={offer.id}
                onClick={() => navigate(`/marketplace/${offer.issue_id}`)}
                className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FontAwesomeIcon
                      icon={getIssueIcon()}
                      className="w-4 h-4 text-gray-600 flex-shrink-0"
                    />
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {issue?.type || "Issue"} #{offer.issue_id}
                    </span>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600 truncate flex-1 mr-2">
                    {issue?.summary || "View details"}
                  </p>
                  <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                    ${offer.price?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View All Link (if more jobs exist) */}
      {vendorOffers.length > 5 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => navigate("/vendor/jobs")}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View {vendorOffers.length - 5} more jobs →
          </button>
        </div>
      )}
    </div>
  );
};

export default MyJobsWidget;
