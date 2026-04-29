import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useGetClientsQuery } from "../features/api/clientsApi";
import {
  faBars,
  faGear,
  faPowerOff,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import SettingsSidebar from "./SettingsSidebar";
import VendorProfileSettings from "./VendorProfileSettings";
import ClientProfileSettings from "./ClientProfileSettings";
import RealtorProfileSettings from "./RealtorProfileSettings";
import AccountAndSecuritySetting from "./AccountAndSecuritySetting";
import PaymentSettings from "./PaymentSettings";

interface DashboardHeaderProps {
  handleLogout: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  pageTitle?: string;
  userType?: string | null;
  children: React.ReactNode;
}

/* ---------- Settings section renderer ---------- */
const renderSettingsSection = (section: string, userType: string | null) => {
  switch (section) {
    case "Profile Settings":
      if (userType === "vendor") return <VendorProfileSettings />;
      if (userType === "client") return <ClientProfileSettings />;
      if (userType === "realtor") return <RealtorProfileSettings />;
      return <p>Unknown user type</p>;
    case "Account & Security":
      return <AccountAndSecuritySetting />;
    case "Payment Settings":
      return <PaymentSettings />;
    default:
      return <p className="text-neutral-600 text-sm">We are working on it!</p>;
  }
};

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState("Profile Settings");

  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch clients from API
  const { data: clients } = useGetClientsQuery();

  // Match client by email
  const client = clients?.find((c) => c.email === currentUser?.email);

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

  // Close settings modal on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsSettingsOpen(false);
    };
    if (isSettingsOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isSettingsOpen]);

  return (
    <main
      className={`${
        isSidebarOpen ? "lg:ml-[250px]" : "lg:ml-0"
      } flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ease-in-out bg-neutral-100 text-neutral-900`}
    >
      <header className="sticky top-0 z-20 bg-white border-0 px-4 py-2 border-b border-neutral-200">
        <div className="relative flex items-center justify-between">
          <div className="col-auto flex items-center gap-3">
            {!isSidebarOpen && (
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                <FontAwesomeIcon
                  icon={faBars}
                  className="size-4"
                />
              </button>
            )}
          </div>
          
          {pageTitle && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
            </div>
          )}
          <div className="col-auto flex items-center gap-2">
            <button
              className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center"
              onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
            >
              <img src="/images/user.png" alt="User" className="rounded-full" />
            </button>
            {isProfileDropdownOpen && (
              <div
                id="dropdownProfile"
                ref={profileDropdownRef}
                className="absolute right-1 top-14 mt-2 z-10 bg-white rounded-lg border border-gray-100 shadow-lg p-3 w-80"
              >
                <div className="py-3 px-4 bg-blue-100 mb-4 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <h6 className="text-lg text-neutral-900 font-semibold mb-0">
                      {client
                        ? `${client.first_name} ${client.last_name}`
                        : currentUser?.displayName ||
                          currentUser?.email?.split("@")[0] ||
                          "User"}
                    </h6>
                    <span className="text-neutral-500">
                      {currentUser?.email || "user@example.com"}
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
                    <a
                      href="/view-profile"
                      className="text-black px-4 py-2 hover:text-blue-400 flex items-center gap-4"
                    >
                      <FontAwesomeIcon icon={faUser} />
                      My Profile
                    </a>
                  </li>
                  <li>
                    <button
                      className="text-black px-4 py-2 hover:text-blue-400 flex items-center gap-4 w-full text-left"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setSettingsSection("Profile Settings");
                        setIsSettingsOpen(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faGear} />
                      Settings
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

      {/* ---- Settings Modal ---- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSettingsOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white shadow-xl border flex overflow-hidden">
            {/* Close button */}
            <button
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
              onClick={() => setIsSettingsOpen(false)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </button>

            {/* Sidebar */}
            <div className="w-[220px] border-r border-gray-200 bg-white overflow-y-auto shrink-0">
              <SettingsSidebar
                selected={settingsSection}
                onSelect={setSettingsSection}
              />
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                {renderSettingsSection(settingsSection, userType)}
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default DashboardHeader;
