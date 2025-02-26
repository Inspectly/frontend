import {
  faCircleQuestion,
  faCommentDots,
  faMoneyBill1,
} from "@fortawesome/free-regular-svg-icons";
import {
  faChalkboard,
  faClose,
  faGear,
  faInfo,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";

interface DashboardSidebarProps {
  isSidebarOpen: boolean; // Prop to check if sidebar is open
  toggleSidebar: () => void; // Prop to toggle sidebar
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isSidebarOpen,
  toggleSidebar,
}) => {
  const [activePage, setActivePage] = useState(window.location.pathname);

  const handleMenuClick = (page: string) => {
    setActivePage(page); // Update the active page
  };

  return (
    <aside
      className={`fixed top-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } w-[250px] h-screen z-30 bg-white text-neutral-900 transition-transform duration-300`}
    >
      <button
        type="button"
        className="lg:hidden absolute top-1.5 right-[0.625rem] inline-flex items-center justify-center h-7 w-7 rounded-full border border-gray-300 mt-4"
        onClick={toggleSidebar}
      >
        <FontAwesomeIcon icon={faClose} />
      </button>
      <div>
        <a
          href="/dashboard"
          className="flex h-[72px] items-center ml-3 border-r border-b text-3xl font-semibold border-gray-200 px-4 py-[14px]"
        >
          Inspectly
        </a>
      </div>
      <div className="h-[calc(100vh-72px)] overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-white border-r border-gray-200 px-4 py-3">
        <ul className="sidebar-menu">
          <li>
            <a
              href="/dashboard"
              onClick={() => handleMenuClick("/dashboard")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faChalkboard}
                className="mr-2 size-[22px]"
              />
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a
              href="/listings"
              onClick={() => handleMenuClick("/listings")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition duration-150 ease-in-out ${
                activePage === "/listings"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faListCheck}
                className="mr-2 size-[22px]"
              />
              <span>Listings</span>
            </a>
          </li>
          <li>
            <a
              href="/dashboard/chat"
              onClick={() => handleMenuClick("/dashboard/chat")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/chat"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faCommentDots}
                className="mr-2 size-[22px]"
              />
              <span>Chat</span>
            </a>
          </li>
          <li>
            <a
              href="/dashboard/pricing"
              onClick={() => handleMenuClick("/dashboard/pricing")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/pricing"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faMoneyBill1}
                className="mr-2 size-[22px]"
              />
              <span>Pricing</span>
            </a>
          </li>
          <li>
            <a
              href="/dashboard/faqs"
              onClick={() => handleMenuClick("/dashboard/faqs")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/faqs"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faCircleQuestion}
                className="mr-2 size-[22px]"
              />
              <span>FAQs.</span>
            </a>
          </li>
          <li>
            <a
              href="/dashboard/termsandconditions"
              onClick={() => handleMenuClick("/dashboard/termsandconditions")}
              className={`group flex items-center rounded-lg px-3 py-2.5 text-md font-medium ${
                activePage === "/dashboard/termsandconditions"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faInfo}
                className="mr-2 text-xs rounded-full border-2 py-[3px] px-1.5 border-neutral-600 group-hover:border-blue-400"
              />
              <span>Terms & Conditions</span>
            </a>
          </li>
          <li>
            <a
              href="/dashboard/settings"
              onClick={() => handleMenuClick("/dashboard/settings")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-md font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/settings"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon icon={faGear} className="mr-2 size-[22px]" />
              <span>Settings</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
