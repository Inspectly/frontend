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
import { useCart } from "./cartContext";
import { useIssues } from "./IssuesContext";
import { Link } from "react-router-dom";

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
  const { cartItems } = useCart();
  const { issues } = useIssues();

  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState(false);
  const [showCartBadge, setShowCartBadge] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const cartDropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cartDropdownRef.current &&
        !cartDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCartDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      const timer = setTimeout(() => {
        setShowCartBadge(true);
      }, 700);

      return () => {
        clearTimeout(timer); // Cleanup to avoid memory leaks
        setShowCartBadge(false);
      };
    } else {
      setShowCartBadge(false);
    }
  }, [cartItems.length]);

  const addedIssues = issues.filter((issue) => cartItems.includes(issue.id));

  return (
    <main
      className={`${
        isSidebarOpen ? "lg:ml-[15.5rem]" : "lg:ml-0"
      } flex flex-col flex-wrap min-h-screen transition-all duration-300 ease-in-out ml-0 bg-neutral-100 text-neutral-900`}
    >
      <header className="sticky top-0 z-20 h-18 bg-white border-0 px-6 py-4 border-b border-neutral-200">
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
                className="h-10 w-[24.25rem] rounded-lg border border-gray-300 bg-gray-100 px-[2.625rem] pr-5 py-[0.3125rem] text-gray-900"
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
              className="relative w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center"
              onClick={() => setIsCartDropdownOpen((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faCartShopping} />
              {showCartBadge && cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                  {cartItems?.length}
                </span>
              )}
            </button>
            {isCartDropdownOpen && (
              <div
                id="dropdownCart"
                ref={cartDropdownRef}
                className="absolute right-1 top-14 mt-2 z-10 bg-white rounded-lg border border-gray-100 shadow-lg p-3 max-w-[394px]"
                data-popper-placement="bottom"
              >
                <div
                  className={`py-3 px-4 bg-blue-100 rounded-lg flex items-center justify-between gap-2 ${
                    cartItems.length > 0 ? "mb-4" : ""
                  }`}
                >
                  <h6 className="text-lg text-neutral-900 font-semibold mb-0">
                    Cart Items
                  </h6>
                  <span className="w-10 h-10 bg-white dark:bg-neutral-600 text-blue-600 dark:text-white font-bold flex justify-center items-center rounded-full">
                    {cartItems?.length}
                  </span>
                </div>
                <div className="scroll-sm !border-t-0">
                  <div className="max-h-[400px] overflow-y-auto">
                    {cartItems?.length > 0 && (
                      <>
                        {addedIssues.map((issue) => (
                          <a
                            key={issue.id}
                            href="#"
                            className="flex px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 justify-between gap-1"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 relative w-11 h-11 bg-success-200 dark:bg-success-600/25 text-success-600 flex justify-center items-center rounded-full">
                                <img src={issue.image} alt="Image Issue" />
                              </div>
                              <div>
                                <h6 className="text-sm fw-semibold mb-1">
                                  {issue.id} {issue.summary}
                                </h6>
                                <p className="mb-0 text-sm line-clamp-1">
                                  {issue.description}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0">
                              <span className="text-sm text-neutral-500">
                                {issue.dateCreated}
                              </span>
                            </div>
                          </a>
                        ))}
                      </>
                    )}
                  </div>

                  {cartItems?.length > 0 && (
                    <div className="text-center pt-3 px-4">
                      <Link
                        to={`/cart`}
                        className="text-blue-600 dark:text-blue-600 font-semibold hover:underline text-center"
                      >
                        See All Items
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                      {currentUser?.displayName || "User"}
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
