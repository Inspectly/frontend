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
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { getUserById } from "../features/api/usersApi";

interface DashboardSidebarProps {
  isSidebarOpen: boolean; // Prop to check if sidebar is open
  toggleSidebar: () => void; // Prop to toggle sidebar
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isSidebarOpen,
  toggleSidebar,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [activePage, setActivePage] = useState(window.location.pathname);
  const [userType, setUserType] = useState<string | null>(null);

  const user = useSelector((state: RootState) => state.auth.user); // Get user object

  const handleMenuClick = (page: string) => {
    setActivePage(page); // Update the active page
  };

  // Fetch user type based on user ID
  useEffect(() => {
    const fetchUserType = async () => {
      if (user) {
        try {
          const response = await dispatch(
            getUserById.initiate(user.id)
          ).unwrap();
          setUserType(response.user_type);
        } catch (error) {
          console.error("Error fetching user type:", error);
        }
      }
    };

    fetchUserType();
  }, [user]);

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
        <ul className="sidebar-menu flex flex-col h-full">
          <li>
            <a
              href="/dashboard"
              onClick={() => handleMenuClick("/dashboard")}
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
            </a>
          </li>
          <li>
            <a
              href="/listings"
              onClick={() => handleMenuClick("/listings")}
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
            </a>
          </li>
          <li>
            <a
              href="/dashboard/chat"
              onClick={() => handleMenuClick("/dashboard/chat")}
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
            </a>
          </li>
          <li>
            <a
              href="/pricing"
              onClick={() => handleMenuClick("/dashboard/pricing")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/pricing"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon
                icon={faMoneyBill1}
                className="mr-2 size-[19px]"
              />
              <span>Pricing</span>
            </a>
          </li>
          <li>
            <a
              href="/dashboard/faqs"
              onClick={() => handleMenuClick("/dashboard/faqs")}
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
            </a>
          </li>
          <li>
            <a
              href="/dashboard/termsandconditions"
              onClick={() => handleMenuClick("/dashboard/termsandconditions")}
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
            </a>
          </li>
          <li>
            <a
              href="/dashboard/settings"
              onClick={() => handleMenuClick("/dashboard/settings")}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                activePage === "/dashboard/settings"
                  ? "bg-blue-500 text-white"
                  : "text-neutral-600 hover:text-blue-400"
              }`}
            >
              <FontAwesomeIcon icon={faGear} className="mr-2 size-[19px]" />
              <span>Settings</span>
            </a>
          </li>

          {userType === "vendor" && (
            <li className="mt-auto mb-2">
              <a
                href="/marketplace"
                onClick={() => handleMenuClick("/marketplace")}
                className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-in-out ${
                  activePage === "/marketplace"
                    ? "bg-blue-500 text-white"
                    : "text-white bg-blue-400 hover:bg-blue-500"
                }`}
              >
                <FontAwesomeIcon
                  icon={faShop}
                  className="mr-2 size-[19px] text-white"
                />
                <span>Marketplace</span>
              </a>
            </li>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
