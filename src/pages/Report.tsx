import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faChevronDown,
  faHome,
  faMagnifyingGlass,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";

interface Issue {
  id: string;
  summary: string;
  severity: string;
  progress: string;
  dateCreated: string;
  vendor: string;
  cost: string;
}

const Report: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([
    {
      id: "1.1",
      summary: "Pipe leakage in kitchen",
      severity: "High",
      progress: "To-do",
      dateCreated: "2023-12-25",
      vendor: "Plumbing Pros",
      cost: "",
    },
    {
      id: "1.2",
      summary: "Broken showerhead",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-01",
      vendor: "Plumbing Pros",
      cost: "",
    },
    {
      id: "1.3",
      summary: "Water heater malfunction",
      severity: "Low",
      progress: "Done",
      dateCreated: "2024-01-03",
      vendor: "Plumbing Pros",
      cost: "$200",
    },
    {
      id: "2.1",
      summary: "Electrical short circuit in basement",
      severity: "High",
      progress: "Done",
      dateCreated: "2024-01-05",
      vendor: "Electrical Experts",
      cost: "$250",
    },
    {
      id: "2.2",
      summary: "Faulty wiring in living room",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-06",
      vendor: "Electrical Experts",
      cost: "",
    },
    {
      id: "2.3",
      summary: "Damaged electrical socket",
      severity: "Low",
      progress: "To-do",
      dateCreated: "2024-01-07",
      vendor: "Electrical Experts",
      cost: "",
    },
    {
      id: "3.1",
      summary: "Cracked foundation wall",
      severity: "High",
      progress: "To-do",
      dateCreated: "2024-01-08",
      vendor: "Structural Solutions",
      cost: "",
    },
    {
      id: "3.2",
      summary: "Roof leaking near attic",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-09",
      vendor: "Structural Solutions",
      cost: "",
    },
    {
      id: "3.3",
      summary: "Window frame misalignment",
      severity: "Low",
      progress: "Done",
      dateCreated: "2024-01-10",
      vendor: "Structural Solutions",
      cost: "$150",
    },
    {
      id: "4.1",
      summary: "Heating system failure",
      severity: "High",
      progress: "Done",
      dateCreated: "2024-01-11",
      vendor: "HVAC Experts",
      cost: "$300",
    },
    {
      id: "4.2",
      summary: "Air conditioning not cooling",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-12",
      vendor: "HVAC Experts",
      cost: "",
    },
    {
      id: "4.3",
      summary: "Thermostat malfunction",
      severity: "Low",
      progress: "To-do",
      dateCreated: "2024-01-13",
      vendor: "HVAC Experts",
      cost: "",
    },
    {
      id: "5.1",
      summary: "Broken tile in bathroom",
      severity: "Low",
      progress: "To-do",
      dateCreated: "2024-01-14",
      vendor: "Tiling Masters",
      cost: "",
    },
    {
      id: "5.2",
      summary: "Loose grout in shower",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-15",
      vendor: "Tiling Masters",
      cost: "",
    },
    {
      id: "5.3",
      summary: "Cracked floor tiles",
      severity: "High",
      progress: "Done",
      dateCreated: "2024-01-16",
      vendor: "Tiling Masters",
      cost: "$120",
    },
    {
      id: "6.1",
      summary: "Garage door not opening",
      severity: "High",
      progress: "To-do",
      dateCreated: "2024-01-17",
      vendor: "Garage Techs",
      cost: "",
    },
    {
      id: "6.2",
      summary: "Garage door sensor issue",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-18",
      vendor: "Garage Techs",
      cost: "",
    },
    {
      id: "6.3",
      summary: "Garage door spring broken",
      severity: "High",
      progress: "Done",
      dateCreated: "2024-01-19",
      vendor: "Garage Techs",
      cost: "$400",
    },
    {
      id: "7.1",
      summary: "Fence panel broken",
      severity: "Low",
      progress: "To-do",
      dateCreated: "2024-01-20",
      vendor: "Fencing Specialists",
      cost: "",
    },
    {
      id: "7.2",
      summary: "Gate latch not working",
      severity: "Medium",
      progress: "In-progress",
      dateCreated: "2024-01-21",
      vendor: "Fencing Specialists",
      cost: "",
    },
    {
      id: "7.3",
      summary: "Fence leaning to one side",
      severity: "High",
      progress: "Done",
      dateCreated: "2024-01-22",
      vendor: "Fencing Specialists",
      cost: "$250",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    severity: "",
    progress: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleProgressChange = (id: string, newProgress: string) => {
    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === id ? { ...issue, progress: newProgress } : issue
      )
    );
    setDropdownOpen(null); // Close the dropdown after selecting an option
  };

  // Filter logic
  const filteredIssues = issues.filter((issue) => {
    const matchesSearchQuery =
      issue.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity =
      filters.severity === "" || issue.severity === filters.severity;
    const matchesProgress =
      filters.progress === "" || issue.progress === filters.progress;

    return matchesSearchQuery && matchesSeverity && matchesProgress;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIssues = filteredIssues.slice(startIndex, endIndex);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page on items per page change
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-3xl font-semibold mb-0 dark:text-white">Issues</h1>
        <ul className="text-lg flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/dashboard"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faHome} className="size-5" />
              Dashboard
            </a>
          </li>
          <li>-</li>
          <li className="font-medium">Report</li>
        </ul>
      </div>

      <div className="grid grid-cols-12">
        <div className="col-span-12">
          <div className="card h-full p-0 rounded-xl border-0 overflow-hidden">
            <div className="card-header border-b border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 py-4 px-6 flex items-center flex-wrap gap-3 justify-between">
              <div className="flex items-center flex-wrap gap-3">
                <span className="text-base font-medium text-secondary-light mb-0">
                  Show
                </span>
                <select
                  className="border px-1 py-1.5 w-auto border-neutral-300 rounded-lg cursor-pointer"
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                </select>
                <form className="relative">
                  <input
                    type="text"
                    placeholder="Search issues"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="h-10 sm:w-[20rem] w-[14rem] rounded-lg border border-gray-200 bg-gray-100 px-[2.625rem] pr-5 py-[0.3125rem] text-gray-900 dark:border-gray-600"
                  />
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute top-1/2 left-3 -translate-y-1/2 text-[0.9rem] text-gray-600"
                  />
                </form>
                <select
                  className="border px-1 py-1.5 cursor-pointer w-auto border-neutral-200 rounded-lg"
                  value={filters.severity}
                  onChange={(e) =>
                    handleFilterChange("severity", e.target.value)
                  }
                >
                  <option value="">Filter by Severity</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                <select
                  className="border px-1 py-1.5 cursor-pointer w-auto border-neutral-200 rounded-lg"
                  value={filters.progress}
                  onChange={(e) =>
                    handleFilterChange("progress", e.target.value)
                  }
                >
                  <option value="">Filter by Progress</option>
                  <option value="To-do">To-do</option>
                  <option value="In-progress">In-progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
            <div className="bg-white p-6">
              {currentIssues.length === 0 ? (
                <div className="text-center text-gray-500">
                  You have no current issues.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full min-w-max border-separate border-spacing-0 rounded-lg border border-gray-200 bordered-table sm-table mb-0">
                    <thead>
                      <tr>
                        <th className="bg-gray-100 text-center font-medium px-4 py-3 first:rounded-tl-lg">
                          Severity
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          ID
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Summary
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Severity
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Progress
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Date Created
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Vendor
                        </th>
                        <th className="bg-gray-100 text-left font-medium px-4 py-3">
                          Cost
                        </th>
                        <th className="bg-gray-100 text-center font-medium px-4 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentIssues.map((issue, index) => (
                        <tr key={issue.id}>
                          <td className="text-center border-b border-gray-200 px-4 py-3">
                            <span
                              className={`block w-4 h-4 rounded-full mx-auto ${
                                issue.severity === "High"
                                  ? "bg-red-500"
                                  : issue.severity === "Medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                            ></span>
                          </td>

                          <td className="text-left border-b border-gray-200 px-4 py-3">
                            {issue.id}
                          </td>
                          <td className="text-left border-b border-gray-200 px-4 py-3">
                            {issue.summary}
                          </td>
                          <td className="text-left border-b border-gray-200 px-4 py-3">
                            {issue.severity}
                          </td>
                          <td className="text-left border-b border-gray-200 px-4 py-3">
                            <div className="relative">
                              <button
                                className={`px-2.5 py-1.5 rounded font-medium text-sm ${
                                  issue.progress === "To-do"
                                    ? "bg-neutral-100 text-neutral-600 border border-neutral-600"
                                    : issue.progress === "In-progress"
                                    ? "bg-blue-100 text-blue-600 border border-blue-600"
                                    : "bg-green-100 text-green-600 border border-green-600"
                                }`}
                                onClick={() =>
                                  setDropdownOpen((prev) =>
                                    prev === issue.id ? null : issue.id
                                  )
                                }
                              >
                                {issue.progress}
                                <FontAwesomeIcon
                                  icon={faChevronDown}
                                  className="ml-1"
                                />
                              </button>
                              {dropdownOpen === issue.id && (
                                <div className="fixed z-50 bg-white shadow-md rounded-lg mt-2">
                                  {["To-do", "In-progress", "Done"].map(
                                    (progress) => (
                                      <button
                                        key={progress}
                                        className={`block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left ${
                                          progress === issue.progress
                                            ? "font-bold"
                                            : ""
                                        }`}
                                        onClick={() =>
                                          handleProgressChange(
                                            issue.id,
                                            progress
                                          )
                                        }
                                      >
                                        {progress}
                                      </button>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="text-left border-b border-gray-200 px-4 py-3">
                            {issue.dateCreated}
                          </td>
                          <td className="text-left border-b border-gray-200 px-4 py-3">
                            {issue.vendor}
                          </td>
                          <td className="text-left border-b border-gray-200 px-4 py-3">
                            {issue.cost || "N/A"}
                          </td>
                          <td className="text-center border-b border-gray-200 px-4 py-3">
                            <button className="w-8 h-8 bg-blue-100 text-primary-600 rounded-full inline-flex items-center justify-center">
                              <FontAwesomeIcon
                                icon={faPlus}
                                className="text-blue-600 size-3.5"
                              />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2 mt-6">
                <span>
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredIssues.length)} of{" "}
                  {filteredIssues.length} entries
                </span>
                <ul className="pagination flex flex-wrap items-center gap-2 justify-center">
                  <li className="page-item">
                    <button
                      className={`page-link bg-neutral-200 text-secondary-light font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 text-base ${
                        currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      onClick={handlePrevious}
                      disabled={currentPage === 1}
                    >
                      <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <li key={page} className="page-item">
                        <button
                          className={`page-link font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 ${
                            currentPage === page
                              ? "bg-blue-400 text-white"
                              : "bg-neutral-200 text-secondary-light"
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    )
                  )}
                  <li className="page-item">
                    <button
                      className={`page-link bg-neutral-200 text-secondary-light font-semibold rounded-lg border-0 flex items-center justify-center h-8 w-8 text-base ${
                        currentPage === totalPages
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                    >
                      <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
