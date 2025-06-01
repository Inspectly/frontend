import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import UserCalendar from "../components/UserCalendar";
import DashboardCharts from "../components/DashboardCharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  ReportType,
  User,
  Vendor,
} from "../types";
import VendorMap from "../components/VendorMap";
import Agenda from "../components/Agenda";
import Realtors from "../components/Realtors";
import { getIssueById, useGetIssuesQuery } from "../features/api/issuesApi";
import { useGetListingByUserIdQuery } from "../features/api/listingsApi";
import { useGetReportsByUserIdQuery } from "../features/api/reportsApi";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetAssessmentsByClientIdUsersInteractionIdQuery } from "../features/api/issueAssessmentsApi";
import { getOffersByIssueId } from "../features/api/issueOffersApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store/store";
import { getVendorById } from "../features/api/vendorsApi";

interface DashboardProps {
  user: User;
}

const ClientDashboard: React.FC<DashboardProps> = ({ user }) => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    data: listings,
    error: listingsError,
    isLoading: isListingsLoading,
  } = useGetListingByUserIdQuery(user?.id, { skip: !user?.id });
  const {
    data: reports,
    error: reportsError,
    isLoading: isReportsLoading,
    refetch: refetchReports,
  } = useGetReportsByUserIdQuery(user?.id, { skip: !user?.id });
  const {
    data: issues,
    error: issuesError,
    isLoading: isIssuesLoading,
    refetch: refetchIssues,
  } = useGetIssuesQuery();
  const { data: clients } = useGetClientsQuery();
  const client = clients?.find((c) => c.user_id === user.id);

  const { data: assessments = [] } =
    useGetAssessmentsByClientIdUsersInteractionIdQuery(user.id);

  const acceptedAssessments = assessments
    .filter((a) => a.status === IssueAssessmentStatus.ACCEPTED)
    .map((a) => ({
      ...a,
      vendor_id: parseInt(a.users_interaction_id.split("_")[1], 10), // safely extract vendor_id
    }));

  const issueIds = [...new Set(acceptedAssessments.map((a) => a.issue_id))];
  const vendorIds = [...new Set(acceptedAssessments.map((a) => a.vendor_id))];

  const [issueMap, setIssueMap] = useState<Record<number, IssueType>>({});
  const [vendorMap, setVendorMap] = useState<Record<number, Vendor>>({});

  useEffect(() => {
    const fetchData = async () => {
      const issuePromises = issueIds.map((id) =>
        dispatch(getIssueById.initiate(String(id)))
      );
      const vendorPromises = vendorIds.map((id) =>
        dispatch(getVendorById.initiate(String(id)))
      );

      const issueResults = await Promise.all(issuePromises);
      const vendorResults = await Promise.all(vendorPromises);

      const issueData = Object.fromEntries(
        issueResults.map((r) => [r?.data?.id, r?.data])
      );
      const vendorData = Object.fromEntries(
        vendorResults.map((r) => [r?.data?.id, r?.data])
      );

      setIssueMap(issueData);
      setVendorMap(vendorData);
    };

    fetchData();
  }, [JSON.stringify(issueIds), JSON.stringify(vendorIds)]);

  const events: CalendarReadyAssessment[] = acceptedAssessments.map((a) => {
    const issue = issueMap[a.issue_id];
    const vendor = vendorMap[a.vendor_id];

    return {
      ...a,
      title: `${vendor?.name || "Vendor #" + a.vendor_id} Assessment: ${
        issue?.summary || "Issue #" + a.issue_id
      }`,
      start: new Date(a.start_time),
      end: new Date(a.end_time),
    };
  });

  const [files, setFiles] = useState<File[]>([]);
  const [selectedListing, setSelectedListing] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<string>("all");
  const [offersByIssueId, setOffersByIssueId] = useState<
    Record<number, IssueOffer[]>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const issueColors: Record<string, string> = {
    general: "bg-gray-600",
    structural: "bg-purple-600",
    electrician: "bg-yellow-500",
    plumber: "bg-blue-500",
    painter: "bg-pink-500",
    cleaner: "bg-green-400",
    hvac: "bg-teal-500",
    roofing: "bg-indigo-600",
    insulation: "bg-cyan-500",
    drywall: "bg-orange-400",
    plaster: "bg-red-400",
    carpentry: "bg-amber-700",
    landscaping: "bg-lime-500",
    other: "bg-neutral-500",
  };

  const issueGradients: Record<string, string> = {
    general: "from-gray-600/10 to-white",
    structural: "from-purple-600/10 to-white",
    electrician: "from-yellow-500/10 to-white",
    plumber: "from-blue-500/10 to-white",
    painter: "from-pink-500/10 to-white",
    cleaner: "from-green-400/10 to-white",
    hvac: "from-teal-500/10 to-white",
    roofing: "from-indigo-600/10 to-white",
    insulation: "from-cyan-500/10 to-white",
    drywall: "from-orange-400/10 to-white",
    plaster: "from-red-400/10 to-white",
    carpentry: "from-amber-700/10 to-white",
    landscaping: "from-lime-500/10 to-white",
    other: "from-neutral-500/10 to-white",
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

  const filteredReports = useMemo(() => {
    return selectedListing === "all"
      ? reports || []
      : reports?.filter(
          (report: ReportType) =>
            report.listing_id.toString() === selectedListing
        ) || [];
  }, [reports, selectedListing]);

  const filteredIssuesByUser = useMemo(() => {
    const filteredIssues =
      selectedReport === "all"
        ? issues || []
        : issues?.filter(
            (issue: IssueType) => issue.report_id.toString() === selectedReport
          ) || [];

    return filteredIssues.filter((issue) => {
      const report = reports?.find((r) => r.id === issue.report_id);
      return report?.user_id === user?.id;
    });
  }, [issues, reports, selectedReport, user?.id]);

  const issueCounts = filteredIssuesByUser.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostRecentListing = listings?.reduce((latest, current) => {
    return new Date(current.created_at) > new Date(latest.created_at)
      ? current
      : latest;
  }, listings?.[0]);

  useEffect(() => {
    if (filteredIssuesByUser.length === 0) return; // Wait until it's populated

    const fetchOffers = async () => {
      const results: Record<number, IssueOffer[]> = {};
      for (const issue of filteredIssuesByUser) {
        try {
          const res = await dispatch(
            getOffersByIssueId.initiate(issue.id)
          ).unwrap();
          results[issue.id] = res;
        } catch (err) {
          console.error("Failed to fetch offers for issue", issue.id, err);
        }
      }
      setOffersByIssueId(results);
    };

    fetchOffers();
  }, [filteredIssuesByUser, dispatch]);

  // Handling loading state
  if (isIssuesLoading || isReportsLoading || isListingsLoading) {
    return <p>Loading...</p>;
  }

  // Handling error state
  if (issuesError || reportsError || listingsError) {
    return <p>Error</p>;
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <h1 className="text-2xl font-semibold mb-0">
          {client?.first_name}'s Dashboard
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
                {listings
                  ?.filter((listing) => listing.user_id === user.id)
                  .map((listing) => (
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
                    key={type}
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
                            src={
                              mostRecentListing?.image_url ||
                              "/images/property_card_holder.jpg"
                            }
                            alt=""
                            className="w-full h-[250px] object-fit-cover"
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 w-full rounded-b-xl bg-gradient-to-t from-black/40 via-black/60 to-transparent p-3">
                          <h6 className="text-base font-bold text-white mb-1">
                            {listings?.[0]?.address || "No Recent Listings"}
                          </h6>
                          <h6 className="text-sm text-white mb-2">
                            {listings?.[0]?.postal_code}, {listings?.[0]?.city},{" "}
                            {listings?.[0]?.state}, {listings?.[0]?.country}
                          </h6>
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
                      filteredIssuesByUser.reduce((acc, issue) => {
                        if (!acc[issue.report_id]) acc[issue.report_id] = [];
                        acc[issue.report_id].push(issue);
                        return acc;
                      }, {} as Record<string, IssueType[]>)
                    ).map(([reportId, issueArray]) => (
                      <React.Fragment key={reportId}>
                        {issueArray.map((issue) => {
                          const report = reports?.find(
                            (r) => r.id === issue.report_id
                          );
                          const listingId = report?.listing_id;

                          return listingId
                            ? (offersByIssueId[issue.id]?.length || 0) > 0 && (
                                <div
                                  key={issue.id}
                                  className="flex items-center justify-between gap-2 mt-6"
                                >
                                  <div className="flex items-center gap-3">
                                    <FontAwesomeIcon
                                      icon={issueIcons[issue.type] || faWrench} // Default to faWrench if no match
                                      className={`text-gray-400 text-3xl`}
                                    />
                                    <div className="grow">
                                      <h6 className="text-base mb-0 font-medium">
                                        <Link
                                          to={`/listings/${listingId}/reports/${issue.report_id}/issues/${issue.id}?tab=offers`}
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
                                    $
                                    {offersByIssueId[issue.id]?.[0]?.price ??
                                      "N/A"}
                                  </span>
                                </div>
                              )
                            : null;
                        })}
                      </React.Fragment>
                    ))}
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
