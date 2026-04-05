import { useState, useEffect } from "react";
import { ArrowRight, Users, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const words = ["Project", "Renovation", "Repair"];
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
    <section id="hero" className="relative bg-[#0d1117] pt-28 pb-14 lg:pt-36 lg:pb-20 overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left copy */}
          <div className="animate-fade-up">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-display font-bold text-white leading-tight mb-6">
              Find Trusted Contractors for{" "}
              <span className="inline-block">Every Home</span>
              <br />
              <span
                className={`text-primary inline-block transition-all duration-300 ${
                  isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
              >
                {words[currentIndex]}
              </span>
            </h1>

            <p
              className="text-base md:text-lg text-gray-400 max-w-md mb-8 animate-fade-up"
              style={{ animationDelay: "0.15s" }}
            >
              Connect with vetted professionals for repairs, renovations, and maintenance — fast, fair, and transparent.
            </p>

            <div
              className="flex flex-col sm:flex-row items-start gap-3 mb-8 animate-fade-up"
              style={{ animationDelay: "0.25s" }}
            >
              <Button onClick={() => navigate("/signup")} variant="gold" className="w-full sm:w-auto shadow-md hover:shadow-2xl transition-all duration-300">
                Post Your Project
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                variant="outline"
                className="w-full sm:w-auto shadow-md hover:shadow-2xl transition-all duration-300 border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                Browse Contractors
              </Button>
            </div>

            <div
              className="flex items-center gap-6 text-sm text-gray-400 animate-fade-up"
              style={{ animationDelay: "0.35s" }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                2,400+ projects completed
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                100% verified pros
              </span>
            </div>
          </div>

          {/* Right image + floating card */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700&q=80"
                alt="Homeowner meeting contractor"
                className="w-full h-[320px] lg:h-[400px] object-cover"
              />
            </div>
            <div className="absolute -bottom-5 right-4 md:right-8 bg-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 max-w-xs">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Average time to first quote</p>
                <p className="text-sm font-semibold text-gray-900">Under 4 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
