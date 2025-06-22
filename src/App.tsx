import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SectionRefs, User } from "./types";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ClientDashboard from "./pages/ClientDashboard";
import Dashboard from "./pages/Dashboard";
import Report from "./pages/Report";
import Issue from "./pages/Issue";
import Listings from "./pages/Listings";
import Reports from "./pages/Reports";
import DashboardHeader from "./components/DashboardHeader";
import DashboardSidebar from "./components/DashboardSidebar";
import PrivateRoute from "./components/PrivateRoute";

import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { checkAuthState, logout, setLoading } from "./features/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "./store/store";
import PriceSection from "./components/PriceSection";
import AdminDashboard from "./pages/AdminDashboard";
import RealtorDashboard from "./pages/RealtorDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import { getUserById } from "./features/api/usersApi";
import Marketplace from "./pages/Marketplace";
import MarketplaceIssue from "./pages/MarketplaceIssue";
import Settings from "./pages/Settings";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Get authentication and loading state from Redux
  const authenticated = useSelector(
    (state: RootState) => state.auth.authenticated
  );
  const loadingAuthState = useSelector(
    (state: RootState) => state.auth.loading
  );

  const user = useSelector((state: RootState) => state.auth.user); // Get user object

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1025);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [loadingUserType, setLoadingUserType] = useState(true);

  const refs: SectionRefs = {
    heroRef: useRef<HTMLDivElement>(null),
    featuresRef: useRef<HTMLDivElement>(null),
    howItWorksRef: useRef<HTMLDivElement>(null),
    teamRef: useRef<HTMLDivElement>(null),
    plansRef: useRef<HTMLDivElement>(null),
    faqsRef: useRef<HTMLDivElement>(null),
  };

  const plans = [
    {
      title: "Basic",
      description: "Ideal for individuals looking to get started.",
      price: "69.95",
      bgColor: "bg-white",
      textColor: "text-gray-400",
      priceTextColor: "text-blue-500",
      buttonBg: "bg-blue-400",
      buttonTextColor: "text-white",
      buttonHover: "hover:bg-blue-500",
      features: [
        { text: "Detailed repair costs", isAvailable: true },
        { text: "PDF report format", isAvailable: true },
        { text: "RUSH upgrade time", isAvailable: false },
        { text: "Fire claim history", isAvailable: false },
        { text: "Flood zone info", isAvailable: false },
        { text: "Permit details active", isAvailable: false },
        { text: "Sales lien info", isAvailable: false },
      ],
    },
    {
      title: "Premium",
      description: "Perfect for teams and businesses with advanced needs.",
      price: "99.95",
      bgColor: "bg-blue-500 text-white",
      textColor: "",
      priceTextColor: "text-white",
      buttonBg: "bg-white",
      buttonTextColor: "text-blue-500",
      buttonHover: "hover:bg-gray-100",
      features: [
        { text: "Detailed repair costs", isAvailable: true },
        { text: "PDF report format", isAvailable: true },
        { text: "RUSH upgrade time", isAvailable: true },
        { text: "Fire claim history", isAvailable: true },
        { text: "Flood zone info", isAvailable: true },
        { text: "Permit details active", isAvailable: true },
        { text: "Sales lien info", isAvailable: true },
      ],
    },
  ];

  const scrollToSection = (
    ref: React.RefObject<HTMLElement>,
    offset: number = -50
  ) => {
    if (ref.current) {
      const elementPosition =
        ref.current.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition + offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth", // Smooth scrolling to the adjusted position
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("authToken");
      localStorage.removeItem("firebase_id");

      dispatch(logout());
      dispatch(setLoading(false));

      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Function to get dashboard component based on user type
  const getDashboardComponent = () => {
    if (!userType) return <Dashboard />; // Default dashboard if user type is undefined

    switch (userType) {
      case "client":
        return userInfo ? <ClientDashboard user={userInfo} /> : <Preloader />;
      case "admin":
        return <AdminDashboard />;
      case "realtor":
        return <RealtorDashboard />;
      case "vendor":
        return userInfo ? <VendorDashboard user={userInfo} /> : <Preloader />;
      default:
        return <Dashboard />; // Default dashboard
    }
  };

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  // Handle window resize to toggle sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1025);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Fetch user type based on user ID
  useEffect(() => {
    const fetchUserType = async () => {
      if (!user) {
        setLoadingUserType(false);
        return;
      }

      try {
        setLoadingUserType(true);
        const response = await dispatch(getUserById.initiate(user.id)).unwrap();
        setUserType(response.user_type);
        setUserInfo(response);
      } catch (error) {
        console.error("Error fetching user type:", error);
      } finally {
        setLoadingUserType(false);
      }
    };

    fetchUserType();
  }, [user, dispatch]);

  if (loadingAuthState || loadingUserType) {
    return <Preloader />;
  }

  return (
    <>
      {authenticated ? (
        <>
          <DashboardSidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
          <DashboardHeader
            handleLogout={handleLogout}
            toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSidebarOpen={isSidebarOpen}
          >
            <Routes>
              <Route
                path="/"
                element={<PrivateRoute element={getDashboardComponent()} />}
              />
              <Route
                path="/dashboard"
                element={<PrivateRoute element={getDashboardComponent()} />}
              />
              <Route
                path="/pricing"
                element={
                  <PrivateRoute element={<PriceSection plans={plans} />} />
                }
              />
              <Route
                path="/listings"
                element={<PrivateRoute element={<Listings />} />}
              />
              <Route
                path="/marketplace"
                element={<PrivateRoute element={<Marketplace />} />}
              />
              <Route
                path="/marketplace/:issueId"
                element={<PrivateRoute element={<MarketplaceIssue />} />}
              />
              <Route
                path="/listings/:listingId"
                element={<PrivateRoute element={<Reports />} />}
              />
              <Route
                path="/listings/:listingId/reports/:reportId"
                element={<PrivateRoute element={<Report />} />}
              />
              <Route
                path="/listings/:listingId/reports/:reportId/issues/:issueId"
                element={<PrivateRoute element={<Issue />} />}
              />
              <Route
                path="/dashboard/settings"
                 element={
                  userType ? (<PrivateRoute element={<Settings userType={userType} />} />) : (<Preloader />)
                }
              />
              <Route
                path="*"
                element={<PrivateRoute element={getDashboardComponent()} />}
              />
            </Routes>
          </DashboardHeader>
        </>
      ) : (
        <>
          <Header
            scrollToSection={scrollToSection}
            refs={refs}
            isAuthenticated={authenticated}
          />
          <Routes>
            <Route path="/" element={<Home refs={refs} plans={plans} />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
          </Routes>
          <Footer />
        </>
      )}
    </>
  );
}

export default App;
