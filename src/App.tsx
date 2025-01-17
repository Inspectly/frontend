import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Home from "./pages/Home";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { SectionRefs } from "./types";
import Login from "./pages/Login";

function App() {
  const location = useLocation();

  const refs: SectionRefs = {
    heroRef: useRef<HTMLDivElement>(null),
    featuresRef: useRef<HTMLDivElement>(null),
    howItWorksRef: useRef<HTMLDivElement>(null),
    teamRef: useRef<HTMLDivElement>(null),
    plansRef: useRef<HTMLDivElement>(null),
    faqsRef: useRef<HTMLDivElement>(null),
  };
  const [loading, setLoading] = useState(true);

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
    }, 1000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = ""; // Ensure scrolling is restored on cleanup
    };
  }, [loading]);

  return (
    <div>
      {loading && <Preloader />}
      <div
        className={`transition-opacity duration-500 ${
          !loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <Header scrollToSection={scrollToSection} refs={refs} />

        <Routes>
          <Route path="/" element={<Home refs={refs} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        <Footer />
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}
