import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import {
  faChalkboard,
  faInfo,
  faListCheck,
  faShop,
  faBriefcase,
  faFileInvoiceDollar,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { RootState } from "../store/store";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import logo from "@/assets/logo.png";

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isSidebarOpen,
  toggleSidebar: _toggleSidebar,
}) => {
  const location = useLocation();
  const activePage = location.pathname;

  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthReady = useSelector(
    (state: RootState) => state.auth.authenticated
  );

  const { data: vendor } = useGetVendorByVendorUserIdQuery(
    String(user?.id),
    { skip: !user?.id || user?.user_type !== "vendor" }
  );

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
      } w-[250px] h-screen z-30 bg-white border-r border-gray-200 transition-transform duration-300`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-0.5 px-3">
          <img src={logo} alt="Inspectly" className="h-16 w-auto" />
          <span className="text-lg font-medium text-foreground -ml-1">InspectlyAI</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary rounded">Pro</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-white px-3 py-4">
        <ul className="flex flex-col h-full space-y-1">
          <li>
            <Link
              to="/dashboard"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                activePage === "/dashboard"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
              }`}
            >
              <FontAwesomeIcon icon={faChalkboard} className="mr-3 w-4" />
              <span>Dashboard</span>
            </Link>
          </li>

          {isAuthReady && user?.user_type === "vendor" && (
            <li>
              <Link
                to="/vendor/jobs"
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activePage === "/vendor/jobs"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-foreground hover:text-background"
                }`}
              >
                <FontAwesomeIcon icon={faBriefcase} className="mr-3 w-4" />
                <span>Jobs</span>
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/listings"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                activePage === "/listings"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
              }`}
            >
              <FontAwesomeIcon icon={faListCheck} className="mr-3 w-4" />
              <span>Properties</span>
            </Link>
          </li>

          {user?.user_type === "client" && (
            <li>
              <Link
                to="/offers"
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activePage === "/offers"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-foreground hover:text-background"
                }`}
              >
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-3 w-4" />
                <span>Offers</span>
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/settings"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                activePage === "/settings"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
              }`}
            >
              <FontAwesomeIcon icon={faGear} className="mr-3 w-4" />
              <span>Settings</span>
            </Link>
          </li>

          <li>
            <Link
              to="/dashboard/faq"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                activePage === "/dashboard/faq"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
              }`}
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="mr-3 w-4" />
              <span>FAQs</span>
            </Link>
          </li>

          <li>
            <Link
              to="/dashboard/terms"
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                activePage === "/dashboard/terms"
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-foreground hover:text-background"
              }`}
            >
              <FontAwesomeIcon icon={faInfo} className="mr-3 w-4" />
              <span>Terms & Conditions</span>
            </Link>
          </li>

          {/* Spacer to push marketplace to bottom */}
          <li className="flex-1" aria-hidden="true"></li>

          {/* Marketplace button for vendors - gold accent */}
          {isAuthReady && user?.user_type === "vendor" && (
            <li className="pt-4">
              <Link
                to={marketplaceLink}
                className="flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 bg-gold text-white hover:bg-foreground hover:text-background"
              >
                <FontAwesomeIcon icon={faShop} className="mr-2 w-4" />
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
