import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
import { onAuthStateChanged, signOut, getIdToken } from "firebase/auth";
import { useCreateUserSessionMutation } from "./features/api/userSessionsApi";
import { useGetUserLoginByUserIdQuery } from "./features/api/userLoginsApi";

function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loadingAuthState, setLoadingAuthState] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1025);
  const [createUserSession] = useCreateUserSessionMutation();

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

  // Track if authentication state is loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setLoadingAuthState(false);
        return;
      }

      try {
        const token = await getIdToken(user); // Get Firebase token
        const { data: userData, error } = await useGetUserLoginByUserIdQuery(
          user.uid
        );

        if (error || !userData) {
          console.error("User not found in backend:", error);
          await signOut(auth);
          localStorage.removeItem("authToken");
          setCurrentUser(null);
          setLoadingAuthState(false);
          return;
        }

        // User exists in backend, create session
        const payload = {
          user_id: user.uid,
          login_method: "firebase",
          authentication_code: token,
        };
        await createUserSession(payload).unwrap();
        localStorage.setItem("authToken", token);
        setCurrentUser(user);
      } catch (error) {
        console.error("Session creation failed:", error);
        await signOut(auth);
        localStorage.removeItem("authToken");
        setCurrentUser(null);
      }

      setLoadingAuthState(false);
    });

    return () => unsubscribe();
  }, []);

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

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem("authToken");
      window.location.href = "/login"; // Redirect to login page
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  if (loadingAuthState) {
    return <Preloader />;
  }

  return (
    <>
      {currentUser ? (
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
          <Header scrollToSection={scrollToSection} refs={refs} />
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
