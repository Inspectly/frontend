import React from "react";
import { useParams } from "react-router-dom";
import { useGetIssueByIdQuery } from "../features/api/issuesApi";
import { useGetReportByIdQuery } from "../features/api/reportsApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import IssueCard from "../components/IssueDetails";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShop } from "@fortawesome/free-solid-svg-icons";

const MarketplaceIssue: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();

  // Fetch issue
  const {
    data: issue,
    isLoading: issueLoading,
    error: issueError,
  } = useGetIssueByIdQuery(issueId!, {
    skip: !issueId,
  });

  // Fetch report using issue.report_id
  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
  } = useGetReportByIdQuery(issue?.report_id?.toString() ?? "", {
    skip: !issue?.report_id,
  });

  // Fetch listing using report.listing_id
  const {
    data: listing,
    isLoading: listingLoading,
    error: listingError,
  } = useGetListingByIdQuery(report?.listing_id?.toString() ?? "", {
    skip: !report?.listing_id,
  });

  if (issueLoading || reportLoading || listingLoading)
    return <p className="p-6">Loading...</p>;
  if (issueError || reportError || listingError)
    return <p className="p-6 text-red-600">Error loading data</p>;
  if (!issue) return <p className="p-6 text-gray-600">Issue not found</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-2xl font-semibold mb-0">Issue</h1>
        <ul className="text-lg text-gray-600 flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/marketplace"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faShop} className="size-4" />
              Marketplace
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">Issue</li>
        </ul>
      </div>

      <IssueCard issue={issue} listing={listing} />
    </div>
  );
};

export default MarketplaceIssue;
