import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useGetClientsQuery } from "../features/api/clientsApi";
import {
  faBars,
  faPowerOff,
} from "@fortawesome/free-solid-svg-icons";
import { faUser } from "@fortawesome/free-regular-svg-icons";

interface DashboardHeaderProps {
  handleLogout: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  pageTitle?: string;
  children: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  handleLogout,
  toggleSidebar,
  isSidebarOpen,
  pageTitle,
  children,
}) => {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

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

  return (
    <main
      className={`${
        isSidebarOpen ? "lg:ml-[15.5rem]" : "lg:ml-0"
      } flex flex-col flex-wrap min-h-screen transition-all duration-300 ease-in-out ml-0 bg-neutral-100 text-neutral-900`}
    >
      <header className="sticky top-0 z-20 h-18 bg-white border-0 px-6 py-4 border-b border-neutral-200">
        <div className="relative flex items-center justify-between">
          <div className="col-auto flex items-center gap-4">
            {!isSidebarOpen && (
              <button className="sidebar-toggle" onClick={toggleSidebar}>
                <FontAwesomeIcon
                  icon={faBars}
                  className="size-5"
                />
              </button>
            )}
          </div>
          
          {pageTitle && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>
            </div>
          )}
          <div className="col-auto flex items-center gap-3">
            <button
              className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center"
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
