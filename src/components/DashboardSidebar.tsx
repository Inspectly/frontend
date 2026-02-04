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
  faShop,
  faBriefcase,
  faFileInvoiceDollar,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { RootState } from "../store/store";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";

interface DashboardSidebarProps {
  isSidebarOpen: boolean; // Prop to check if sidebar is open
  toggleSidebar: () => void; // Prop to toggle sidebar
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isSidebarOpen,
  toggleSidebar,
}) => {
  const location = useLocation();
  const activePage = location.pathname;

  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthReady = useSelector(
    (state: RootState) => state.auth.authenticated
  );

  // Fetch vendor data if user is a vendor
  const { data: vendor } = useGetVendorByVendorUserIdQuery(
    String(user?.id),
    { skip: !user?.id || user?.user_type !== "vendor" }
  );

  // Construct marketplace link with vendor's specialty and city
  const marketplaceLink = useMemo(() => {
    if (user?.user_type === "vendor" && vendor) {
      const type = vendor.vendor_types?.split(',')[0]?.trim() || '';
      const city = vendor.city || '';
      return `/marketplace?type=${encodeURIComponent(type)}&city=${encodeURIComponent(city)}`;
    }
    return "/marketplace";
  }, [user, vendor]);

  return (
    <aside
      className={`fixed top-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } w-[250px] h-screen z-30 bg-white text-neutral-900 transition-transform duration-300`}
    >
      <button
        type="button"
        className="absolute top-[14px] right-3 inline-flex items-center justify-center h-6 w-6 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors z-10"
        onClick={toggleSidebar}
      >
        <FontAwesomeIcon icon={faClose} className="text-sm" />
      </button>
      <div>
        <Link
          to="/dashboard"
          className="flex h-[48px] items-center ml-3 border-r border-b text-xl font-semibold border-gray-200 px-3 py-2"
        >
          Inspectly
        </Link>
      </div>
      <div className="h-[calc(100vh-48px)] overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-white border-r border-gray-200 px-3 py-2">
        <ul className="sidebar-menu flex flex-col h-full">
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faChalkboard}
                className="mr-2 size-[19px]"
              />
              <span>Dashboard</span>
            </Link>
          </li>
          {isAuthReady && user?.user_type === "vendor" && (
            <li>
              <Link
                to="/vendor/jobs"
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                  activePage === "/vendor/jobs"
                    ? "bg-blue-500 text-white"
                    : "text-neutral-600 hover:text-blue-400"
                }`}
              >
                <FontAwesomeIcon
                  icon={faBriefcase}
                  className="mr-2 size-[19px]"
                />
                <span>Jobs</span>
              </Link>
            </li>
          )}
          <li>
            <Link
              to="/listings"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/listings"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faListCheck}
                className="mr-2 size-[19px]"
              />
              <span>Listings</span>
            </Link>
          </li>
          {user?.user_type === "client" && (
            <li>
              <Link
                to="/offers"
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                  activePage === "/offers"
                    ? "bg-blue-500 text-white"
                    : "text-neutral-600 hover:text-blue-400"
                }`}
              >
                <FontAwesomeIcon
                  icon={faFileInvoiceDollar}
                  className="mr-2 size-[19px]"
                />
                <span>Offers</span>
              </Link>
            </li>
          )}
          <li>
            <Link
              to="/dashboard/chat"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/chat"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faCommentDots}
                className="mr-2 size-[19px]"
              />
              <span>Chat</span>
            </Link>
          </li>
          <li>
            <Link
              to="/pricing"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/pricing"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faMoneyBill1}
                className="mr-2 size-[19px]"
              />
              <span>Pricing</span>
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard/faqs"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/faqs"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faCircleQuestion}
                className="mr-2 size-[19px]"
              />
              <span>FAQs.</span>
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard/termsandconditions"
              className={`group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium ${
                activePage === "/dashboard/termsandconditions"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faInfo}
                className="mr-2 text-[10px] rounded-full border-2 py-[3px] px-1.5 border-neutral-600 group-hover:border-blue-400"
              />
              <span>Terms & Conditions</span>
            </Link>
          </li>
          <li>
            <Link
              to="/dashboard/settings"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/settings"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon icon={faGear} className="mr-2 size-[19px]" />
              <span>Settings</span>
            </Link>
          </li>

          {isAuthReady && user?.user_type === "vendor" && (
            <li className="mt-auto mb-2">
              <Link
                to={marketplaceLink}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                  activePage.startsWith("/marketplace")
                    ? "bg-blue-500 text-white"
                    : "text-white bg-blue-400 hover:bg-blue-500"
                }`}
              >
                <FontAwesomeIcon
                  icon={faShop}
                  className="mr-2 size-[19px] text-white"
                />
                <span>Marketplace</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
