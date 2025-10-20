import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListCheck } from "@fortawesome/free-solid-svg-icons";
import ReportTable from "../components/ReportTable";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGetReportByIdQuery } from "../features/api/reportsApi";

const Report: React.FC = () => {
  const { listingId, reportId } = useParams<{ listingId: string; reportId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // 1) Snapshot the flag once on first render
  const initialOpenFlag = useMemo(
    () => Boolean((location.state as any)?.openCreateIssue),
    []
  );
  const [openAddIssueOnMount, setOpenAddIssueOnMount] = useState<boolean>(initialOpenFlag);

  // 2) clear the location.state so it won't reopen on refresh/back
  useEffect(() => {
    if (initialOpenFlag) {
      navigate(location.pathname, { replace: true });
    }
  }, []);

  
  const {
    data: report,
    isLoading,
    error,
  } = useGetReportByIdQuery(Number(reportId), { skip: !reportId });

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading Issue Collection</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-2xl font-semibold mb-0">
          {report?.name || "Issue Collection"}
        </h1>
        <ul className="text-lg text-gray-600 flex items-center gap-[6px]">
          <li className="font-medium">
            <a href="/listings" className="flex items-center gap-2 hover:text-blue-400">
              <FontAwesomeIcon icon={faListCheck} className="size-4" />
              Listings
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">
            <a href={`/listings/${listingId}`} className="flex items-center gap-2 hover:text-blue-400">
              Issue Collections
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">Issue Collection</li>
        </ul>
      </div>

      <div className="grid grid-cols-12">
        <div className="col-span-12">
          <ReportTable openAddIssueOnMount={openAddIssueOnMount} />
        </div>
      </div>
    </div>
  );
};

export default Report;
