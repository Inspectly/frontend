import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ServiceCategories from "@/components/landing/ServiceCategories";
import HowItWorks from "@/components/landing/HowItWorks";
import Listings from "@/components/landing/Listings";
import Features from "@/components/landing/Features";
import Testimonials from "@/components/landing/Testimonials";
import TrustIndicators from "@/components/landing/TrustIndicators";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ServiceCategories />
      <HowItWorks />
      <Listings />
      <Features />
      <Testimonials />
      <TrustIndicators />
      <CTA />
      <Footer />
    </main>
  );
};

export default Index;
