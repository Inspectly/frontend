import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import UserCalendar from "../components/UserCalendar";
import DashboardCharts from "../components/DashboardCharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faHouse,
  faPaintRoller,
  faTint,
  faWind,
  faWrench,
} from "@fortawesome/free-solid-svg-icons";
import {
  CalendarReadyAssessment,
  IssueAssessmentStatus,
  IssueType,
  ReportType,
  User,
} from "../types";
import VendorMap from "../components/VendorMap";
import Agenda from "../components/Agenda";
import Realtors from "../components/Realtors";
import { useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetListingsQuery } from "../features/api/listingsApi";
import { useGetReportsQuery } from "../features/api/reportsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetAssessmentsByUserIdQuery } from "../features/api/issueAssessmentsApi";

interface DashboardProps {
  user: User;
}

const ClientDashboard: React.FC<DashboardProps> = ({ user }) => {
  const {
    data: listings,
    error: listingsError,
    isLoading: isListingsLoading,
  } = useGetListingsQuery();
  const {
    data: reports,
    error: reportsError,
    isLoading: isReportsLoading,
    refetch: refetchReports,
  } = useGetReportsQuery();
  const {
    data: issues,
    error: issuesError,
    isLoading: isIssuesLoading,
    refetch: refetchIssues,
  } = useGetIssuesQuery();
  const { data: clients } = useGetClientsQuery();
  const client = clients?.find((c) => c.user_id === user.id);

  const { data: assessments = [] } = useGetAssessmentsByUserIdQuery(user.id);

  const events: CalendarReadyAssessment[] = assessments
    .filter((a) => a.status === IssueAssessmentStatus.ACCEPTED)
    .map((a) => ({
      ...a,
      title: `Issue #${a.issue_id} – Vendor #${a.interaction_id.split("_")[1]}`,
      start: new Date(a.start_time),
      end: new Date(a.end_time),
    }));

  const [files, setFiles] = useState<File[]>([]);
  const [selectedListing, setSelectedListing] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<string>("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const issueIcons: Record<string, any> = {
    plumbing: faTint,
    hvac: faWind,
    electrical: faBolt,
    roofing: faHouse,
    painting: faPaintRoller,
    general: faWrench, // Default
  };

  const issueColors: Record<string, string> = {
    plumbing: "bg-blue-500",
    hvac: "bg-teal-500",
    electrical: "bg-yellow-500",
    roofing: "bg-gray-600",
    painting: "bg-green-500",
    general: "bg-orange-500", // Default
  };

  const issueGradients: Record<string, string> = {
    plumbing: "from-blue-600/10 to-white",
    hvac: "from-teal-500/10 to-white",
    electrical: "from-yellow-500/10 to-white",
    roofing: "from-gray-600/10 to-white",
    painting: "from-green-500/10 to-white",
    general: "from-orange-500/10 to-white", // Default
  };

  const realtors = [
    {
      image: "images/Manzur.jpeg",
      quote:
        "It seems that only fragments of the original text remain in the Lorem Ipsum texts used today.",
      name: "Manzur Mulk",
      company: "Staff Engineer, Algolia",
    },
    {
      image: "images/Sharhad.jpg",
      quote:
        "The most well-known dummy text is the 'Lorem Ipsum', which is said to have originated in the 16th century.",
      name: "Sharhad Bashar",
      company: "Staff Engineer, Algolia",
    },
    {
      image: "images/Yousef.png",
      quote:
        "One disadvantage of Lorem Ipsum is that in Latin certain letters appear more frequently than others.",
      name: "Yousef Ouda",
      company: "Staff Engineer, Algolia",
    },
    {
      image: "images/Mohammed_Hussein.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Mohammed Hussein",
      company: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "One disadvantage of Lorem Ipsum is that in Latin certain letters appear more frequently than others.",
      name: "Abdel Malek Fadel",
      company: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Moe Mohasseb",
      company: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Abdullah Anwar",
      company: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Mohammed Alaa",
      company: "Staff Engineer, Algolia",
    },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files).filter(
        (file) => file.type === "application/pdf"
      );
      setFiles((prevFiles) => [...prevFiles, ...fileList]);

      // Reset input to allow re-selection of the same file
      event.target.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const fileList = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === "application/pdf"
    );
    setFiles((prevFiles) => [...prevFiles, ...fileList]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (selectedListing !== "all") {
      refetchReports();
    }
  }, [selectedListing, refetchReports]);

  useEffect(() => {
    if (selectedReport !== "all") {
      refetchIssues();
    }
  }, [selectedReport, refetchIssues]);

  const filteredReports =
    selectedListing === "all"
      ? reports || []
      : reports?.filter(
          (report: ReportType) =>
            report.listing_id.toString() === selectedListing
        ) || [];

  const filteredIssues =
    selectedReport === "all"
      ? issues || []
      : issues?.filter(
          (issue: IssueType) => issue.report_id.toString() === selectedReport
        ) || [];

  const issueCounts = Object.values(filteredIssues)
    .flat() // Flatten to a single array
    .reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Handling loading state
  if (isIssuesLoading || isListingsLoading) {
    return <p>Loading...</p>;
  }

  // Handling error state
  if (issuesError || listingsError) {
    return <p>Error</p>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold mb-0">Dashboard</h1>
      </div>

      <div className="gap-6 grid grid-cols-1 2xl:grid-cols-12">
        <div className="col-span-12 2xl:col-span-8">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
            <div className="col-span-12">
              <h1 className="text-xl font-semibold mb-2">
                Hello {client?.first_name} {client?.last_name}!
              </h1>
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
                      The Smartest Way to Manage Property Repairs
                    </h4>
                    <p className="text-white text-base">
                      Managing property repairs has never been easier. Upload
                      your inspection report, and our AI will instantly extract
                      key issues, saving you time. Active issues will receive
                      competitive offers from verified vendors, schedule on-site
                      assessments, and track progress—all in one place. Take
                      control of your property maintenance with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12">
              <select
                className="px-3 pr-10 py-1.5 text-sm leading-5 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:0.75em_0.75em] w-auto bg-neutral-50 border rounded-full"
                style={{
                  backgroundImage: "url('images/chevron.svg')",
                }}
                value={selectedListing}
                onChange={(e) => setSelectedListing(e.target.value)}
              >
                <option value="all">All Listings</option>
                {listings?.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.address}
                  </option>
                ))}
              </select>

              {selectedListing !== "all" && (
                <select
                  className="px-3 pr-10 py-1.5 ml-2 text-sm leading-5 appearance-none bg-no-repeat bg-[right_0.75rem_center] bg-[length:0.75em_0.75em] w-auto bg-neutral-50 border rounded-full"
                  style={{
                    backgroundImage: "url('images/chevron.svg')",
                  }}
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                >
                  <option value="all">All Reports</option>
                  {filteredReports?.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.name}
                    </option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {Object.entries(issueCounts).map(([type, count]) => (
                  <div
                    className={`bg-white shadow-none border border-gray-200 rounded-lg h-full bg-gradient-to-r ${
                      issueGradients[type] || "from-red-500/10 to-white"
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900 mb-1">
                            {type}
                          </p>
                          <h6 className="mb-0 font-medium text-xl">
                            {count} Issues
                          </h6>
                        </div>
                        <div
                          className={`w-[50px] h-[50px] ${
                            issueColors[type] || "bg-red-500"
                          } rounded-full flex justify-center items-center`}
                        >
                          <FontAwesomeIcon
                            icon={issueIcons[type] || faWrench} // Default to faWrench if no match
                            className="text-white text-xl"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-12">
              <div className="rounded-md bg-white h-full">
                <div className="border-b border-gray-200 px-4 py-3 md:px-6 border-bottom flex items-center flex-wrap gap-2 justify-between">
                  <h6 className="font-bold text-lg mb-0">Recent Listing</h6>
                  <a
                    href="/listings"
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View All
                  </a>
                </div>
                <div className="px-6 py-5">
                  <div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white rounded overflow-hidden shadow-4 relative">
                        <div className="rounded-xl overflow-hidden">
                          <img
                            src="/images/house_example.jpg"
                            alt=""
                            className="w-full h-[250px] object-fit-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full rounded-b-xl bg-gradient-to-t from-black/40 via-black/60 to-transparent p-3">
                          <h6 className="text-base font-bold text-white mb-3">
                            161 old pennywell road
                          </h6>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="badge text-sm font-semibold bg-blue-500 px-4 py-1.5 rounded text-white flex items-center gap-2"
                            >
                              plumbing
                              <span className="badge text-neutral-900 bg-white w-5 h-5 flex items-center justify-center rounded text-xs">
                                4
                              </span>
                            </button>
                            <button
                              type="button"
                              className="badge text-sm font-semibold bg-blue-500 px-4 py-1.5 rounded text-white flex items-center gap-2"
                            >
                              electrical
                              <span className="badge text-neutral-900 bg-white w-5 h-5 flex items-center justify-center rounded text-xs">
                                2
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded overflow-hidden shadow-4 flex">
                        {/* Drag & Drop Area */}
                        <div
                          className="border-2 h-[250px] w-full border-dashed border-gray-400 p-6 rounded-xl flex flex-col items-center justify-center text-center gap-3 cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition"
                          onDrop={handleDrop}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevents bubbling to parent
                            fileInputRef.current?.click();
                          }}
                        >
                          <p className="text-gray-500 font-semibold">
                            Drag & Drop your PDF files here
                          </p>
                          <span className="text-gray-400">or</span>
                          <button
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevents opening twice
                              fileInputRef.current?.click();
                            }}
                          >
                            Choose File
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            hidden
                            accept="application/pdf"
                            multiple
                            onChange={handleFileChange}
                          />
                        </div>

                        {/* File Preview List */}
                        {files.length > 0 && (
                          <div className="mt-4">
                            <h3 className="text-gray-700 font-semibold mb-2">
                              Uploaded Files:
                            </h3>
                            <ul className="space-y-2">
                              {files.map((file, index) => (
                                <li
                                  key={index}
                                  className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                                >
                                  <span className="text-gray-700">
                                    {file.name}
                                  </span>
                                  <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleRemoveFile(index)}
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12">
              <div className="rounded-md bg-white h-full">
                <UserCalendar events={events} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-12 2xl:col-span-4">
          <div className="gap-6 grid grid-cols-1 sm:grid-cols-12">
            <div className="col-span-12 md:col-span-6 2xl:col-span-12">
              <div className="rounded-lg border-gray-600 bg-white h-full">
                <div className="border-b border-gray-200 px-4 py-3 border-bottom flex items-center flex-wrap gap-2 justify-between">
                  <h6 className="font-bold text-lg mb-0">Recent Offers</h6>
                  <a
                    href={`/dashboard/${selectedListing}`}
                    className="text-blue-400 hover:text-blue-500 flex items-center gap-1"
                  >
                    View All
                  </a>
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
                              key={issue.id}
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
                                      to={`/dashboard/${issue.report_id}/issue/${issue.id}?tab=offers`}
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

            <div className="col-span-12 md:col-span-6 2xl:col-span-12">
              <DashboardCharts />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 2xl:col-span-4">
          <div className="bg-white h-full border-0 rounded-lg">
            <div className="p-6">
              <div className="flex items-center flex-wrap gap-2 justify-between mb-5">
                <h6 className="font-bold text-lg mb-2">Upcoming Events</h6>
              </div>
              <Agenda events={events} />
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-6 2xl:col-span-4">
          <div className="bg-white h-full border-0 rounded-lg">
            <div className="px-6 py-5">
              <div className="flex items-center flex-wrap gap-2 justify-between">
                <h6 className="mb-2 font-bold text-lg">Distribution Maps</h6>
              </div>
            </div>
            <VendorMap />
            <div className="p-6 max-h-[266px] scroll-sm overflow-y-auto">
              <div className="">
                <div className="flex items-center justify-between gap-3 mb-3 pb-2">
                  <div className="flex sm:flex-[1] lg:flex-[3] 2xl:flex-[1] items-center w-full">
                    <img
                      src="images/vendor-marker.webp"
                      alt=""
                      className="w-10 h-10 rounded-full shrink-0 me-4"
                    />
                    <div className="grow">
                      <h6 className="text-sm mb-0">Plumber Bros</h6>
                      <span className="text-xs text-secondary-light font-medium">
                        12 issues
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-[1] items-center gap-2 w-full">
                    <div className="hidden sm:block lg:hidden 2xl:block w-full max-w-66 ms-auto">
                      <div
                        className="progress progress-sm rounded-full bg-gray-200"
                        role="progressbar"
                        aria-label="Success example"
                      >
                        <div
                          className="progress-bar bg-blue-600 rounded-l-full h-4"
                          style={{ width: "80%" }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-secondary-light font-xs font-semibold justify-end">
                      80%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-12 2xl:col-span-4">
          <div className="bg-white h-full border-0 rounded-lg">
            <div className="p-6">
              <div className="flex items-center flex-wrap gap-2 justify-between mb-5">
                <h6 className="font-bold text-lg mb-2">Top Vendors</h6>
                <a
                  href="javascript:void(0)"
                  className="text-blue-600 hover:text-blue-600 flex items-center gap-1"
                >
                  View All
                </a>
              </div>
              <div className="mt-8">
                <div className="flex items-center justify-between gap-3 mb-8">
                  <div className="flex items-center gap-2">
                    <img
                      src="images/placeholder.jpg"
                      alt=""
                      className="w-10 h-10 rounded-lg shrink-0"
                    />
                    <div className="grow">
                      <h6 className="text-base mb-0 font-normal">
                        Plumber Bros
                      </h6>
                      <span className="text-sm text-secondary-light font-normal">
                        plumbing
                      </span>
                    </div>
                  </div>
                  <span className="text-neutral-600 text-base font-medium">
                    Offers placed: <a>30</a>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12">
          <div className="bg-white h-full border-0 rounded-lg">
            <div className="border-b border-gray-200 px-4 py-3 border-bottom flex items-center flex-wrap gap-2 justify-between">
              <h6 className="font-bold text-lg mb-0">Realtors</h6>
            </div>
            <div className="p-6">
              <Realtors team={realtors} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
