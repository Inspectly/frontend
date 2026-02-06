import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const words = ["Project", "Repair", "Upgrade"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section id="hero" className="relative min-h-[90vh] flex items-center overflow-hidden bg-white">
      {/* Subtle background elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gold accent glow - very subtle */}
        <div className="absolute top-1/4 right-[10%] w-[500px] h-[500px] bg-gradient-radial from-amber-100/30 via-amber-50/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - Content */}
          <div className="max-w-2xl">
            {/* Subtle label */}
            <div className="inline-flex items-center gap-2 mb-10 animate-fade-up">
              <span className="text-xs font-medium tracking-[0.25em] uppercase text-amber-600">
                AI-Powered Marketplace
              </span>
            </div>

            {/* Main headline - 2 lines max */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium text-gray-900 leading-[1.2] mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Find Trusted Contractors
              <br />
              for Every Home{" "}
              <span
                className={`font-serif italic text-amber-500 transition-all duration-300 inline-block ${
                  isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
              >
                {words[currentIndex]}
              </span>
            </h1>

            {/* Subheadline - more space */}
            <p className="text-xl text-gray-500 mb-12 leading-relaxed max-w-lg animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Connect with vetted professionals for repairs, renovations, and maintenance — fast, fair, and transparent.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-4 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-gray-900 text-white hover:bg-gray-800 px-8 py-6 text-base font-medium rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Post Your Project
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                variant="ghost"
                className="text-gray-500 hover:text-gray-900 px-6 py-6 text-base font-medium"
              >
                Browse Contractors
              </Button>
            </div>
          </div>

          {/* Right - Service Cards (inspired by the reference) */}
          <div className="relative hidden lg:block">
            {/* Floating service cards - more spread out */}
            <div className="relative h-[480px]">
              {/* Card 1 - Top Right */}
              <div className="absolute top-0 right-4 bg-gray-900 text-white px-7 py-5 rounded-2xl shadow-2xl animate-fade-up" style={{ animationDelay: "0.4s" }}>
                <div className="flex items-center gap-4">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  <span className="text-sm font-medium tracking-wide">Home Repairs</span>
                </div>
              </div>

              {/* Card 2 - Middle Right */}
              <div className="absolute top-40 right-0 bg-white border border-gray-200 px-7 py-5 rounded-2xl shadow-lg animate-fade-up" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-4">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  <span className="text-sm font-medium text-gray-900 tracking-wide">Renovations</span>
                </div>
              </div>

              {/* Card 3 - Middle Left */}
              <div className="absolute top-56 left-0 bg-gray-900 text-white px-7 py-5 rounded-2xl shadow-2xl animate-fade-up" style={{ animationDelay: "0.6s" }}>
                <div className="flex items-center gap-4">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                  <span className="text-sm font-medium tracking-wide">Inspections</span>
                </div>
              </div>

              {/* Card 4 - Bottom */}
              <div className="absolute bottom-0 right-20 bg-white border border-gray-200 px-7 py-5 rounded-2xl shadow-lg animate-fade-up" style={{ animationDelay: "0.7s" }}>
                <div className="flex items-center gap-4">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                  <span className="text-sm font-medium text-gray-900 tracking-wide">Maintenance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
