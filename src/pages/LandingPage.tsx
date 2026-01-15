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
