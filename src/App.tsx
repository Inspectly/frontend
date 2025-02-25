import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { SectionRefs } from "./types";
import Login from "./pages/Login";
import SignUp from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1025);

  const refs: SectionRefs = {
    heroRef: useRef<HTMLDivElement>(null),
    featuresRef: useRef<HTMLDivElement>(null),
    howItWorksRef: useRef<HTMLDivElement>(null),
    teamRef: useRef<HTMLDivElement>(null),
    plansRef: useRef<HTMLDivElement>(null),
    faqsRef: useRef<HTMLDivElement>(null),
  };

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

  if (loadingAuthState) {
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
              <Route path="/" element={<Home refs={refs} />} />
              <Route
                path="/dashboard"
                element={<PrivateRoute element={<Dashboard />} />}
              />
              <Route
                path="/listings"
                element={<PrivateRoute element={<Listings />} />}
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
                path="*"
                element={<PrivateRoute element={<Dashboard />} />}
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
            <Route path="/" element={<Home refs={refs} />} />
            <Route path="/signup" element={<SignUp />} />
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
