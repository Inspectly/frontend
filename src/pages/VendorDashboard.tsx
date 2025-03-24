import React, { useEffect, useState } from "react";
import { CalendarEvent, User } from "../types";
import UserCalendar from "../components/UserCalendar";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetReportsQuery } from "../features/api/reportsApi";
import { useGetIssuesQuery } from "../features/api/issuesApi";

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedReport, setSelectedReport] = useState<string>("all");

  // const {
  //   data: listings,
  //   error: listingsError,
  //   isLoading: isListingsLoading,
  // } = useGetListingsQuery();

  // const {
  //   data: reports,
  //   error: reportsError,
  //   isLoading: isReportsLoading,
  //   refetch: refetchReports,
  // } = useGetReportsQuery();

  const {
    data: issues,
    error: issuesError,
    isLoading: isIssuesLoading,
    refetch: refetchIssues,
  } = useGetIssuesQuery();

  console.log('user: ', user);
  console.log('issues: ', issues);

  useEffect(() => {
    if (selectedReport !== "all") {
      refetchIssues();
    }
  }, [selectedReport, refetchIssues]);

  useEffect(() => {
    const dummyBookings: CalendarEvent[] = [
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

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold mb-0">Vendor Dashboard</h1>
      </div>
      <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
        <div className="col-span-12 2xl:col-span-8">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
          <div className="col-span-12">
              <div className="nft-promo-card card border-0 rounded-xl overflow-hidden relative z-1 py-6 3xl:px-[76px] 2xl:px-[56px] xl:px-[40px] lg:px-[28px] px-4">
                <img
                  src="/images/gradient-bg.png"
                  className="absolute start-0 top-0 w-full h-full z-[1]"
                  alt=""
                />
                <div className="flex 3xl:gap-[80px] xl:gap-[32px] lg:gap-6 gap-4 items-center relative z-[1]">
                  <div className="sm:block hidden w-full">
                    <img
                      src="/images/ai_image.webp"
                      alt=""
                      className="w-full h-full object-fit-cover"
                    />
                  </div>
                  <div className="flex-grow-1">
                    <h4 className="mb-4 font-semibold text-3xl text-white">
                      The fastest way to find and fix property issues
                    </h4>
                    <p className="text-white text-base">
                      Join our network of verified vendors and connect with homeowners in need of your services. Our AI-powered platform instantly analyzes inspection reports, matching you with relevant repair opportunities. Receive competitive bid requests, schedule on-site assessments, and manage projects seamlessly—all from your Vendor Dashboard. Get qualified leads and streamline your workflow today! 🚀
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-grow-2 col-span-12">
              <span>Terms & Conditions</span>
              <span>Hello, (Contractor Name)!</span>
            </div>
            <div className="col-span-12">
              <div className="rounded-md bg-white h-full">
                <UserCalendar events={events} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
