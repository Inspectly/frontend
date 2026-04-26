import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowRightFromBracket,
  faChalkboard,
  faCommentDots,
  faFileInvoiceDollar,
  faInfo,
  faLayerGroup,
  faListCheck,
  faShop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { logout, setLoading } from "../features/authSlice";
import { AppDispatch, RootState } from "../store/store";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import logo from "@/assets/logo.png";

interface DashboardSidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const SectionLabel = ({ label }: { label: string }) => (
  <li className="px-3 pt-4 pb-1">
    <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
      {label}
    </span>
  </li>
);

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isSidebarOpen,
}: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const activePage = location.pathname;

  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthReady = useSelector((state: RootState) => state.auth.authenticated);
  const isVendor = user?.user_type === "vendor";

  const { data: vendor } = useGetVendorByVendorUserIdQuery(
    String(user?.id),
    { skip: !user?.id || !isVendor }
  );

  const marketplaceLink = useMemo(() => {
    if (isVendor && vendor) {
      const type = vendor.vendor_types?.split(",")[0]?.trim() || "";
      const city = vendor.city || "";
      return `/marketplace?type=${encodeURIComponent(type)}&city=${encodeURIComponent(city)}`;
    }
    return "/marketplace";
  }, [isVendor, vendor]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      localStorage.removeItem("firebase_id");
      dispatch(logout());
      dispatch(setLoading(false));
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Active/inactive nav item classes — unified for all roles
  const navItemActive = "bg-gold-light text-gold";
  const navItemInactive =
    "text-muted-foreground hover:bg-muted hover:text-foreground";
  const navItemBase =
    "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200";

  return (
    <aside
      className={`fixed top-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } w-[250px] h-screen z-30 bg-background border-r border-border transition-transform duration-300`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-3 border-b border-border">
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
      <div className="h-[calc(100vh-64px)] flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background px-3 py-2">
        <ul className="flex flex-col flex-1 space-y-0.5">
          {/* MAIN section */}
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

          {isAuthReady && isVendor && (
            <>
              <li>
                <Link
                  to={marketplaceLink}
                  className={`${navItemBase} ${
                    activePage === "/marketplace" ? navItemActive : navItemInactive
                  }`}
                >
                  <FontAwesomeIcon icon={faShop} className="mr-3 w-4" />
                  <span>Find Jobs</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/vendor/jobs"
                  className={`${navItemBase} ${
                    activePage === "/vendor/jobs" ? navItemActive : navItemInactive
                  }`}
                >
                  <FontAwesomeIcon icon={faLayerGroup} className="mr-3 w-4" />
                  <span>My Projects</span>
                </Link>
              </li>
            </>
          )}

          {!isVendor && (
            <>
              <li>
                <Link
                  to="/listings"
                  className={`${navItemBase} ${
                    activePage === "/listings" ? navItemActive : navItemInactive
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
                    className={`${navItemBase} ${
                      activePage === "/offers" ? navItemActive : navItemInactive
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={faFileInvoiceDollar}
                      className="mr-3 w-4"
                    />
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
                  <FontAwesomeIcon icon={faCommentDots} className="mr-3 w-4" />
                  <span>Chat</span>
                </Link>
              </li>
            </>
          )}

          {/* SUPPORT section */}
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

          {/* Spacer */}
          <li className="flex-1" aria-hidden="true" />

          {/* Log Out */}
          <li className="pb-2 border-t border-border pt-2">
            <button
              onClick={handleLogout}
              className={`w-full ${navItemBase} ${navItemInactive}`}
            >
              <FontAwesomeIcon
                icon={faArrowRightFromBracket}
                className="mr-3 w-4"
              />
              <span>Log Out</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
