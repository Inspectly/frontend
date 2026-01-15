import { useState, useEffect } from "react";

import { ArrowRight, Sparkles } from "lucide-react";
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
    <section id="hero" className="relative pt-32 pb-12 lg:pt-40 lg:pb-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-72 h-72 bg-gold-light rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gold-light rounded-full blur-3xl opacity-20" />
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gold-light/50 border shadow-lg border-gold-muted mb-6 animate-fade-up hover:shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">AI-Powered Marketplace</span>
          </div>

          {/* Main headline with animated word */}
          <h1 className="text-3xl md:text-4xl lg:text-7xl font-display font-bold text-foreground leading-tight mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Find Trusted Contractors for{" "}
            <span className="inline-block">
              Every Home{" "}
            </span>
            <br />
            <p
              className={`text-primary inline-block transition-all duration-300 min-w-[260px] text-left ${isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
            >
              {words[currentIndex]}
            </p>
          </h1>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Connect with vetted professionals for repairs, renovations, and maintenance — fast, fair, and transparent.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Button onClick={() => navigate("/signup")} variant="gold" className="w-full sm:w-auto shadow-md hover:shadow-2xl transition-all duration-300">
              Post Your Project
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button onClick={() => navigate("/signup")} variant="outline" className="w-full sm:w-auto shadow-md hover:shadow-2xl transition-all duration-300">
              Browse Contractors
            </Button>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
