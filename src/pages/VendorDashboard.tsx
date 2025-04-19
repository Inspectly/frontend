import React, { useEffect, useState } from "react";
import { EventSlot, IssueType, User } from "../types";
import UserCalendar from "../components/UserCalendar";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { Link } from "react-router-dom";
import VendorName from "../components/VendorName";

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [events, setEvents] = useState<EventSlot[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>("all");

  const {
    data: issues,
    error: issuesError,
    isLoading: isIssuesLoading,
    refetch: refetchIssues,
  } = useGetIssuesQuery();

  useEffect(() => {
    if (selectedReport !== "all") {
      refetchIssues();
    }
  }, [selectedReport, refetchIssues]);

  const filteredIssues =
    selectedReport === "all"
      ? issues || []
      : issues?.filter(
          (issue: IssueType) => issue.report_id.toString() === selectedReport
        ) || [];

  useEffect(() => {
    const dummyBookings: EventSlot[] = [
      {
        id: "1",
        title: "plumbing Repair Appointment",
        start: new Date("2025-03-15T10:00:00"),
        end: new Date("2025-03-15T11:00:00"),
      },
      {
        id: "2",
        title: "Electrical Wiring Fix",
        start: new Date("2025-03-20T14:00:00"),
        end: new Date("2025-03-20T15:00:00"),
      },
      {
        id: "3",
        title: "AC Maintenance",
        start: new Date("2025-03-25T09:30:00"),
        end: new Date("2025-03-25T10:30:00"),
      },
    ];
    setEvents(dummyBookings);
  }, []);

  // Handling error state
  // todo: maybe an error loading component?
  if (issuesError) {
    return <p>Error</p>;
  }

  if (!user || isIssuesLoading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold mb-0">
          Hello <VendorName vendorId={user.id} isVendorId={false} />!
        </h1>
      </div>
      <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
        <div className="col-span-12 2xl:col-span-8">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
            <div className="col-span-12">
              <div className="nft-promo-card card border-0 rounded-xl overflow-hidden relative z-1 py-6 3xl:px-[76px] 2xl:px-[56px] xl:px-[40px] lg:px-[28px] px-4">
                <img
                  src="/images/gradient-bg.png"
                  className="absolute start-0 top-0 w-full h-full z-[1]"
                  alt="Welcome card background"
                />
                <div className="flex 3xl:gap-[80px] xl:gap-[32px] lg:gap-6 gap-4 items-center relative z-[1]">
                  <div className="sm:block hidden w-full">
                    <img
                      src="/images/ai_image.webp"
                      alt="Welcome card icon"
                      className="w-full h-full object-fit-cover"
                    />
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="mb-4 font-semibold text-3xl text-white">
                      The fastest way to find and fix property issues
                    </h4>
                    <p className="text-white text-base">
                      Join our network of verified vendors and connect with
                      homeowners in need of your services. Our AI-powered
                      platform instantly analyzes inspection reports, matching
                      you with relevant repair opportunities. Receive
                      competitive bid requests, schedule on-site assessments,
                      and manage projects seamlessly—all from your Vendor
                      Dashboard. Get qualified leads and streamline your
                      workflow today! 🚀
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <h6 className="mb-4 font-semibold">Current Bids & Active Jobs</h6>
      <div className="col-span-12 2xl:col-span-4">
        <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
          <div className="col-span-12 md:col-span-6 2xl:col-span-12">
            <div className="rounded-lg border-gray-600 bg-white h-full">
              <div className="border-b border-gray-200 px-4 py-3 border-bottom flex items-center flex-wrap gap-2 justify-between">
                <h6 className="font-bold text-lg mb-0">Recent Bids</h6>
                {/* <a
                  href={`/dashboard/${selectedListing}`}
                  className="text-blue-400 hover:text-blue-500 flex items-center gap-1"
                >
                  View All
                </a> */}
              </div>
              <div className="card-body px-6 pb-6">
                <div>
                  {Object.entries(
                    filteredIssues.reduce((acc, issue) => {
                      if (!acc[issue.report_id]) acc[issue.report_id] = [];
                      acc[issue.report_id].push(issue);
                      return acc;
                    }, {} as Record<string, IssueType[]>)
                  ).map(([reportId, issueArray]) =>
                    issueArray.map(
                      (issue) =>
                        issue.cost && (
                          <div
                            key={`${issue.id}-${reportId}`}
                            className="flex items-center justify-between gap-2 mt-6"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={`/images/${issue.type.toLowerCase()}.png`}
                                alt=""
                                className="w-10 h-10 shrink-0 overflow-hidden"
                              />
                              <div className="grow">
                                <h6 className="text-base mb-0 font-medium">
                                  <Link
                                    to={`/dashboard/${issue.report_id}/issue/${issue.id}?tab=bids`}
                                    className="text-blue-400 hover:underline"
                                  >
                                    {issue.id} {issue.type}
                                  </Link>
                                </h6>
                                <span className="text-sm font-medium">
                                  {issue.summary}
                                </span>
                              </div>
                            </div>
                            <span className="text-neutral-600 text-base font-medium">
                              {issue.cost}
                            </span>
                          </div>
                        )
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* <div className="col-span-12 md:col-span-6 2xl:col-span-12">
            <DashboardCharts />
          </div> */}
        </div>
      </div>
      <h6 className="mb-4 font-semibold">Active Jobs</h6>
      {/* todo: find active jobs component... */}
      {/* <div className="col-span-12">
        <div className="rounded-md bg-white h-full">
          <UserCalendar events={events} />
        </div>
      </div> */}
      <h6 className="mb-4 font-semibold">Upcoming Assessments/Repairs</h6>
      <div className="col-span-12">
        <div className="rounded-md bg-white h-full">
          <UserCalendar events={events} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
