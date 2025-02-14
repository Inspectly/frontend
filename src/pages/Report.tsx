import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChalkboard } from "@fortawesome/free-solid-svg-icons";
import ReportTable from "../components/ReportTable";

const Report: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2 mb-6 justify-between">
        <h1 className="text-3xl font-semibold mb-0">Report</h1>
        <ul className="text-lg flex items-center gap-[6px]">
          <li className="font-medium">
            <a
              href="/dashboard"
              className="flex items-center gap-2 hover:text-blue-400"
            >
              <FontAwesomeIcon icon={faChalkboard} className="size-5" />
              Dashboard
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
