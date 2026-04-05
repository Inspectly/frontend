import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import Preloader from "./components/Preloader";
import { User } from "./types";
import Login from "./pages/Login";
import Signup from "./pages/signup";
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
import VendorJobsPage from "./pages/VendorJobsPage";
import { getUserById } from "./features/api/usersApi";
import Marketplace from "./pages/Marketplace";
import MarketplaceIssue from "./pages/MarketplaceIssue";

import ReportReviewPage from "./pages/ReportReviewPage";
import Offers from "./pages/Offers";
import VendorCelebrationListener from "./components/VendorCelebrationListener";
import { marketplacePrefetchService } from "./services/marketplacePrefetchService";
import LandingPage from "./pages/LandingPage";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import Footer from "./components/Footer";
import LandingNavbar from "./components/landing/LandingNavbar";
import FAQ from "./pages/FAQ";
import About from "./pages/About";

function App() {
  const location = useLocation();

  // Get page title based on current route
  const getPageTitle = (pathname: string): string => {
    const pathMap: Record<string, string> = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/marketplace': 'Marketplace',
      '/listings': 'Listings',
      '/offers': 'Offers',
      '/reports': 'Reports',
      '/issues': 'Issues',
      '/pricing': 'Pricing',
      '/vendor/jobs': 'Jobs',
    };
    return pathMap[pathname] || 'Dashboard';
  };
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
    // Initialize prefetch service with dispatch
    marketplacePrefetchService.initialize(dispatch);
    dispatch(checkAuthState());
  }, [dispatch]);

  // Safeguard: unblock UI if auth/loading hangs (e.g. Firebase or backend unreachable)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loadingAuthState || loadingUserType) {
        console.warn("Auth loading timeout - unblocking UI");
        dispatch(setLoading(false));
        setLoadingUserType(false);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [loadingAuthState, loadingUserType, dispatch]);

  // Handle marketplace prefetching - trigger when user is on dashboard
  useEffect(() => {
    if (authenticated && user?.id && user?.user_type && userInfo && !loadingUserType) {
      // User is fully logged in and on dashboard - trigger prefetch if not already running
      if (!marketplacePrefetchService.isActive()) {
        setTimeout(() => {
          marketplacePrefetchService.startPrefetch().catch(error => {
            console.warn("Marketplace prefetch failed:", error);
          });
        }, 2000); // 2 second delay to let dashboard fully load first
      }
    } else if (!authenticated) {
      // User logged out - clean up prefetch
      marketplacePrefetchService.stopPrefetch();
      marketplacePrefetchService.clearPrefetchCache();
    }
  }, [authenticated, user?.id, user?.user_type, userInfo, loadingUserType]);

  // Handle window resize to toggle sidebar visibility
  useEffect(() => {
    const handleResize = () => {
      // Auto-close sidebar sooner to free horizontal space and prevent hero content clipping
      setIsSidebarOpen(window.innerWidth >= 1200);
    };
    window.addEventListener("resize", handleResize);
    // Run once on mount to ensure correct initial state
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Global Stripe redirect handler: if returning from Stripe on ANY page, redirect to /offers
  useEffect(() => {
    if (location.pathname === "/offers") return; // Already on offers, let Offers page handle it
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("session_id");
    const pendingPayment = localStorage.getItem("pending_offer_payment");
    if (sessionId && pendingPayment) {
      navigate(`/offers?session_id=${sessionId}&filter=accepted&payment=success`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

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
      <ToastContainer />
      {authenticated && userType === "vendor" && userInfo && (
        <VendorCelebrationListener userId={userInfo.id} />
      )}
      {authenticated ? (
        <div className="flex min-h-screen w-screen overflow-x-hidden">
          <DashboardSidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
          <DashboardHeader
            handleLogout={handleLogout}
            toggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSidebarOpen={isSidebarOpen}
            pageTitle={getPageTitle(location.pathname)}
            userType={userType}
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
                path="/offers"
                element={<PrivateRoute element={<Offers />} />}
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
                path="/vendor/jobs"
                element={<PrivateRoute element={<VendorJobsPage />} />}
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
                path="/listings/:listingId/reports/:reportId/review"
                element={<PrivateRoute element={<ReportReviewPage />} />}
              />
              <Route
                path="*"
                element={<PrivateRoute element={getDashboardComponent()} />}
              />
            </Routes>
          </DashboardHeader>
        </div>
      ) : (
        <>
          <LandingNavbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
          </Routes>
          <Footer />
        </>
      )}
    </>
  );
}

export default App;
