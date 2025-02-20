import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { SectionRefs } from "./types";
import Login from "./pages/Login";
import ScrollUpButton from "./components/ScrollUpButton";
import Payment from "./pages/Payment";
import SignUp from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import DashboardHeader from "./components/DashboardHeader";
import DashboardSidebar from "./components/DashboardSidebar";
import Report from "./pages/Report";
import Issue from "./pages/Issue";
import Listings from "./pages/Listings";
import Reports from "./pages/Reports";

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(() => {
    const hasLoaded = sessionStorage.getItem("hasLoaded");
    return !hasLoaded; // If no session flag, set loading to true
  });

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

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, [auth]);

  // Scroll to the top immediately on route changes
  useEffect(() => {
    window.scrollTo(0, 0); // Reset scroll position to the top
  }, [location.pathname]);

  useEffect(() => {
    // Disable scrolling during the loading phase
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = ""; // Restore scrolling
    }

    const timer = setTimeout(() => {
      setLoading(false); // Disable the preloader after 3 seconds
      sessionStorage.setItem("hasLoaded", "true"); // Mark as loaded in sessionStorage
    }, 1000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = ""; // Ensure scrolling is restored on cleanup
    };
  }, [loading]);

  return (
    <div>
      {loading && !currentUser && <Preloader />}
      <div
        className={`transition-opacity duration-500 ${
          !loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <ScrollUpButton />
        {!currentUser && (
          <Header scrollToSection={scrollToSection} refs={refs} />
        )}

        <Routes>
          <Route path="/" element={<Home refs={refs} />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/Listings" element={<Listings />} />
          <Route path="/listings/:listingId" element={<Reports />} />
          <Route
            path="/listings/:listingId/reports/:reportId"
            element={<Report />}
          />
          <Route
            path="/listings/:listingId/reports/:reportId/issues/:issueId"
            element={<Issue />}
          />
        </Routes>

        <div
          className={`${
            currentUser && currentUser.emailVerified ? "bg-white" : "bg-inherit"
          }`}
        >
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  const [currentUser, setCurrentUser] = useState(() => auth.currentUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loadingAuthState, setLoadingAuthState] = useState(true);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null); // Explicitly set user state to null
      window.location.href = "/login"; // Force reload to reset state
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1025) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuthState(false); // Stop the auth loading once the state is determined
    });

    return () => unsubscribe();
  }, [auth]);

  if (loadingAuthState) {
    return <Preloader />;
  }

  return (
    <>
      {currentUser && currentUser.emailVerified ? (
        <>
          <DashboardSidebar
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
          <DashboardHeader
            handleLogout={handleLogout}
            toggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          >
            <App />
          </DashboardHeader>
        </>
      ) : (
        <App />
      )}
    </>
  );
}
