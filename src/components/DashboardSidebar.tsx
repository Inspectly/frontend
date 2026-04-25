import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import {
  faChalkboard,
  faInfo,
  faListCheck,
  faShop,
  faBriefcase,
  faFileInvoiceDollar,
  faComments,
  faArrowRightFromBracket,
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
  handleLogout?: () => void;
}

const navItemBase =
  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200";
const navItemActive = "bg-gold-light text-gold";
const navItemInactive = "text-muted-foreground hover:bg-muted hover:text-foreground";

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <li className="pt-4 pb-1 px-3">
    <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
      {label}
    </span>
  </li>
);

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isSidebarOpen,
  handleLogout,
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
      const type = vendor.vendor_types?.split(",")[0]?.trim() || "";
      const city = vendor.city || "";
      return `/marketplace?type=${encodeURIComponent(type)}&city=${encodeURIComponent(city)}`;
    }
    return "/marketplace";
  }, [user, vendor]);

  const isVendor = isAuthReady && user?.user_type === "vendor";
  const isClient = isAuthReady && user?.user_type === "client";

  return (
    <aside
      className={`fixed top-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } w-[250px] h-screen z-30 bg-background border-r border-border transition-transform duration-300 flex flex-col`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b border-border shrink-0">
        <Link to="/dashboard" className="flex items-center gap-0.5 px-3">
          <img src={logo} alt="Inspectly" className="h-16 w-auto" />
          <span className="text-lg font-medium text-foreground -ml-1">
            InspectlyAI
          </span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary rounded">
            Pro
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background px-3 py-2">
        <ul className="flex flex-col space-y-0.5">
          {/* ── MAIN ── */}
          <SectionLabel label="Main" />

          <li>
            <Link
              to="/dashboard"
              className={`${navItemBase} ${
                activePage === "/dashboard" ? navItemActive : navItemInactive
              }`}
            >
              <FontAwesomeIcon icon={faChalkboard} className="mr-3 w-4" />
              <span>Dashboard</span>
            </Link>
          </li>

          {isVendor && (
            <li>
              <Link
                to="/vendor/jobs"
                className={`${navItemBase} ${
                  activePage === "/vendor/jobs" ? navItemActive : navItemInactive
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
              className={`${navItemBase} ${
                activePage.startsWith("/listings") ? navItemActive : navItemInactive
              }`}
            >
              <FontAwesomeIcon icon={faListCheck} className="mr-3 w-4" />
              <span>Properties</span>
            </Link>
          </li>

          {isClient && (
            <li>
              <Link
                to="/offers"
                className={`${navItemBase} ${
                  activePage === "/offers" ? navItemActive : navItemInactive
                }`}
              >
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="mr-3 w-4" />
                <span>Offers</span>
              </Link>
            </li>
          )}

          <li>
            <Link
              to="/chat"
              className={`${navItemBase} ${
                activePage === "/chat" ? navItemActive : navItemInactive
              }`}
            >
              <FontAwesomeIcon icon={faComments} className="mr-3 w-4" />
              <span>Chat</span>
            </Link>
          </li>

          {/* ── SUPPORT ── */}
          <SectionLabel label="Support" />

          <li>
            <Link
              to="/dashboard/faqs"
              className={`${navItemBase} ${
                activePage === "/dashboard/faqs" ? navItemActive : navItemInactive
              }`}
            >
              <FontAwesomeIcon icon={faCircleQuestion} className="mr-3 w-4" />
              <span>FAQs</span>
            </Link>
          </li>

          <li>
            <Link
              to="/dashboard/termsandconditions"
              className={`${navItemBase} ${
                activePage === "/dashboard/termsandconditions"
                  ? navItemActive
                  : navItemInactive
              }`}
            >
              <FontAwesomeIcon icon={faInfo} className="mr-3 w-4" />
              <span>Terms</span>
            </Link>
          </li>

          {/* Vendor marketplace */}
          {isVendor && (
            <li className="pt-3">
              <Link
                to={marketplaceLink}
                className="flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200 bg-gold text-primary-foreground hover:bg-gold-dark"
              >
                <FontAwesomeIcon icon={faShop} className="mr-2 w-4" />
                <span>Marketplace</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Log Out */}
      {handleLogout && (
        <div className="px-3 py-4 border-t border-border shrink-0">
          <button
            onClick={handleLogout}
            className={`${navItemBase} w-full ${navItemInactive}`}
          >
            <FontAwesomeIcon
              icon={faArrowRightFromBracket}
              className="mr-3 w-4"
            />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default DashboardSidebar;
