import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import Home from "./pages/Home";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import Footer from "./components/Footer";

import { SectionRefs } from "./types";

function App() {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false); // Disable the preloader after 3 seconds
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <Preloader />}
      <div
        className={`transition-opacity duration-500 ${
          !loading ? "opacity-100" : "opacity-0"
        }`}
      >
        <Header scrollToSection={scrollToSection} refs={refs} />
        <Home refs={refs} />
        <Footer />
      </div>
    </>
  );
}

export default App;
