import React, { useEffect } from "react";
import NavBar from "../components/landing/NavBar";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Waitlist from "../components/landing/Waitlist";
import FAQ from "../components/landing/FAQ";
import Footer from "../components/landing/Footer";

const LandingPage: React.FC = () => {
  // Smooth scroll handler
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = sectionId === "hero" ? 0 : 80;
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Handle join waitlist from hero
  const handleJoinWaitlist = () => {
    scrollToSection("waitlist");
    // Focus on email input after a short delay
    setTimeout(() => {
      const emailInput = document.querySelector(
        '#waitlist input[type="email"]'
      ) as HTMLInputElement;
      if (emailInput) {
        emailInput.focus();
      }
    }, 500);
  };

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <NavBar onScrollToSection={scrollToSection} />
      <Hero onJoinWaitlist={handleJoinWaitlist} />
      <Features />
      <HowItWorks />
      <Waitlist />
      <FAQ />
      <Footer />
    </div>
  );
};

export default LandingPage;
