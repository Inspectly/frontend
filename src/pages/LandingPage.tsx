import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import ServiceCategories from "@/components/landing/ServiceCategories";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingListings from "@/components/landing/LandingListings";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import TrustIndicators from "@/components/landing/TrustIndicators";
import CTA from "@/components/landing/CTA";

const LandingPage = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const targetId = location.hash.replace("#", "");
            const element = document.getElementById(targetId);
            if (element) {
                // Use a small timeout to ensure sections are rendered and animations are ready
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }, 100);
            }
        }
    }, [location.hash]);
    return (
        <main className="min-h-screen bg-white">
            <LandingNavbar />
            <Hero />
            <ServiceCategories />
            <HowItWorks />
            <LandingListings />
            <Features />
            <Testimonials />
            <TrustIndicators />
            <CTA />
        </main>
    );
};

export default LandingPage;
