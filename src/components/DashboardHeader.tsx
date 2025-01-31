import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  faBars,
  faCartShopping,
  faMagnifyingGlass,
  faPowerOff,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faUser } from "@fortawesome/free-regular-svg-icons";
import { useCart } from "./cardContext";

interface DashboardHeaderProps {
  handleLogout: () => void;
  toggleSidebar: () => void;
  isSidebarOpen: boolean;
  children: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  handleLogout,
  toggleSidebar,
  isSidebarOpen,
  children,
}) => {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { cartItems } = useCart(); // Get cartItems globally

  const dropdownRef = useRef<HTMLDivElement>(null);

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
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <main
      className={`${
        isSidebarOpen ? "lg:ml-[15.5rem]" : "lg:ml-0"
      } flex flex-col flex-wrap min-h-screen transition-all duration-300 ease-in-out ml-0 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white`}
    >
      <header className="sticky top-0 z-20 h-18 bg-white border-0 px-6 py-4 border-b border-neutral-200 dark:border-neutral-600">
        <div className="flex items-center justify-between">
          <div className="col-auto flex items-center gap-4">
            <button className="sidebar-toggle" onClick={toggleSidebar}>
              <FontAwesomeIcon
                icon={isSidebarOpen ? faTimes : faBars}
                className="size-5"
              />
            </button>
            <form className="hidden lg:inline-block relative">
              <input
                type="text"
                placeholder="Search"
                className="h-10 w-[24.25rem] rounded-lg border border-gray-300 bg-gray-100 px-[2.625rem] pr-5 py-[0.3125rem] text-gray-900 dark:border-gray-600"
              />
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-[0.9rem] text-gray-600"
              />
            </form>
          </div>
          <div className="col-auto flex items-center gap-3">
            <button
              id="cart"
              className="relative w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faCartShopping} />
              {cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {cartItems?.length}
                </span>
              )}
            </button>
            <button
              className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              <img src="/images/user.png" alt="User" className="rounded-full" />
            </button>
            {isDropdownOpen && (
              <div
                id="dropdownProfile"
                ref={dropdownRef}
                className="absolute right-1 top-14 mt-2 z-10 bg-white rounded-lg border border-gray-100 shadow-lg p-3 w-80"
              >
                <div className="py-3 px-4 bg-blue-100 mb-4 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <h6 className="text-lg text-neutral-900 dark:text-white font-semibold mb-0">
                      {currentUser?.displayName || "User"}
                    </h6>
                    <span className="text-neutral-500 dark:text-gray-400">
                      {currentUser?.email || "user@example.com"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-red-500"
                    onClick={() => setIsDropdownOpen(false)}
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
