import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import ReportTable from "../components/ReportTable";
import { useParams } from "react-router-dom";
import { useGetReportByIdQuery } from "../features/api/reportsApi";

const Report: React.FC = () => {
  const { listingId, reportId } = useParams<{
    listingId: string;
    reportId: string;
  }>();

  const validReportId = reportId ? String(reportId) : "";

  const {
    data: report,
    isLoading,
    error,
  } = useGetReportByIdQuery(validReportId, {
    skip: !reportId, // Skip fetching if reportId is missing
  });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading report</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-2xl font-semibold mb-0">
          {report?.name || "Report"}
        </h1>
        <ul className="text-lg flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/listings"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faListCheck} className="size-5" />
              Listings
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">
            <a
              href={`/listings/${listingId}`}
              className="flex items-center gap-2 hover:text-blue-400"
            >
              Reports
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">Report</li>
        </ul>
      </div>

      <div className="grid grid-cols-12">
        <div className="col-span-12">
          <ReportTable />
        </div>
      </div>
    </div>
  );
};

export default Report;
