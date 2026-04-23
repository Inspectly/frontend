import React, { useState, useEffect, useRef, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useGetClientsQuery } from "../features/api/clientsApi";
import { useGetVendorByVendorUserIdQuery } from "../features/api/vendorsApi";
import { useGetListingByIdQuery } from "../features/api/listingsApi";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { useLocation, useNavigate } from "react-router-dom";
import {
  faPowerOff,
} from "@fortawesome/free-solid-svg-icons";
import { PanelLeft } from "lucide-react";
import { faUser } from "@fortawesome/free-regular-svg-icons";

interface DashboardHeaderProps {
  handleLogout: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  pageTitle?: string;
  userType?: string | null;
  children: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  handleLogout,
  toggleSidebar,
  isSidebarOpen,
  pageTitle,
  userType = null,
  children,
}) => {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const authUser = useSelector((state: RootState) => state.auth.user);

  // Fetch clients from API
  const { data: clients } = useGetClientsQuery();
  const { data: vendor } = useGetVendorByVendorUserIdQuery(String(authUser?.id), { skip: !authUser?.id || userType !== "vendor" });

  // Match client by email
  const client = clients?.find((c) => c.email === currentUser?.email);

  // Derive display name and initials
  const fullName = userType === "vendor" && vendor?.name
    ? vendor.name
    : client
      ? `${client.first_name} ${client.last_name}`
      : currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  const nameParts = fullName.trim().split(/\s+/);
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : fullName.slice(0, 2).toUpperCase();

  const roleLabel = userType === "vendor"
    ? (vendor?.vendor_types || vendor?.vendor_type?.vendor_type || "Vendor")
    : userType === "client"
      ? "Homeowner"
      : userType || "User";

  // Breadcrumb logic
  const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const listingIdFromPath = pathSegments[0] === "listings" && pathSegments[1] ? Number(pathSegments[1]) : null;
  const { data: breadcrumbListing } = useGetListingByIdQuery(listingIdFromPath ?? 0, { skip: !listingIdFromPath });

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; path?: string }[] = [];
    const p = location.pathname;

    if (p === "/" || p === "/dashboard") {
      crumbs.push({ label: "Dashboard" });
    } else if (p === "/listings") {
      crumbs.push({ label: "Properties" });
    } else if (p.startsWith("/listings/")) {
      crumbs.push({ label: "Properties", path: "/listings" });
      if (breadcrumbListing) {
        const addr = breadcrumbListing.address?.split(",")[0] || breadcrumbListing.address || "Property";
        if (pathSegments.length === 2) {
          crumbs.push({ label: addr });
        } else if (pathSegments[2] === "reports" && pathSegments[3]) {
          crumbs.push({ label: addr, path: `/listings/${pathSegments[1]}` });
          if (pathSegments[4] === "issues" && pathSegments[5]) {
            crumbs.push({ label: "Issue" });
          } else if (pathSegments[4] === "review") {
            crumbs.push({ label: "Review" });
          } else {
            crumbs.push({ label: "Report" });
          }
        }
      } else {
        crumbs.push({ label: "Property" });
      }
    } else if (p === "/marketplace") {
      crumbs.push({ label: "Marketplace" });
    } else if (p.startsWith("/marketplace/")) {
      crumbs.push({ label: "Marketplace", path: "/marketplace" });
      crumbs.push({ label: "Issue" });
    } else if (p === "/offers") {
      crumbs.push({ label: "Offers" });
    } else if (p === "/vendor/jobs") {
      crumbs.push({ label: "Jobs" });
    } else if (p === "/pricing") {
      crumbs.push({ label: "Pricing" });
    } else if (p === "/settings") {
      crumbs.push({ label: "Settings" });
    } else {
      crumbs.push({ label: pageTitle || "Dashboard" });
    }
    return crumbs;
  }, [location.pathname, breadcrumbListing, pathSegments, pageTitle]);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main
      className={`${
        isSidebarOpen ? "lg:ml-[250px]" : "lg:ml-0"
      } flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out bg-neutral-100 text-neutral-900`}
    >
      <header className="sticky top-0 z-20 bg-white border-0 px-4 py-3 border-b border-neutral-200">
        <div className="relative flex items-center justify-between h-10">
          <div className="col-auto flex items-center gap-3">
            <button className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" onClick={toggleSidebar}>
              <PanelLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-gray-400">–</span>}
                  {crumb.path ? (
                    <button
                      onClick={() => navigate(crumb.path!)}
                      className="text-gray-400 hover:text-gray-700 font-medium transition-colors"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-gray-700 font-semibold">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="col-auto flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{fullName}</p>
                <p className="text-xs text-gray-500 leading-tight">{roleLabel}</p>
              </div>
              <button
                className="w-9 h-9 bg-primary/15 rounded-full flex items-center justify-center text-sm font-semibold text-primary"
                onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
              >
                {initials}
              </button>
            </div>
            {isProfileDropdownOpen && (
              <div
                id="dropdownProfile"
                ref={profileDropdownRef}
                className="absolute right-1 top-14 mt-2 z-10 bg-white rounded-lg border border-gray-100 shadow-lg p-3 w-80"
              >
                <div className="py-3 px-4 bg-primary/10 mb-4 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <h6 className="text-lg text-neutral-900 font-semibold mb-0">
                      {fullName}
                    </h6>
                    <span className="text-neutral-500">
                      {roleLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-500"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    ✕
                  </button>
                </div>
                <ul className="flex flex-col">
                  <li>
                    <button
                      className="text-black px-4 py-2 hover:text-blue-400 flex items-center gap-4 w-full text-left"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        navigate("/settings");
                      }}
                    >
                      <FontAwesomeIcon icon={faUser} />
                      My Profile
                    </button>
                  </li>
                  <li>
                    <button
                      className="text-black px-4 py-2 hover:text-red-500 flex items-center gap-4 w-full text-left"
                      onClick={handleLogout}
                    >
                      <FontAwesomeIcon icon={faPowerOff} />
                      Log Out
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </header>
      {children}
    </main>
  );
};

export default DashboardHeader;
