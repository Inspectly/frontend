import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Shield } from "lucide-react";
import heroImage from "@/assets/hero-main.jpg";

const Hero = () => {
  const words = ["Project", "Renovation", "Repair"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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
    <section className="relative pt-24 pb-0 lg:pt-28 lg:pb-0 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-0 w-72 h-72 bg-gold-light rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gold-light rounded-full blur-3xl opacity-20" />
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left — text content */}
          <div className="max-w-xl">
            {/* Main headline */}
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl font-display font-bold text-foreground leading-tight mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Find Trusted Contractors for{" "}
              <span className="text-primary inline-block whitespace-nowrap">
                Every Home{" "}
                <span 
                  className={`inline-block transition-all duration-300 ${
                    isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                >
                  {words[currentIndex]}
                </span>
              </span>
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Connect with vetted professionals for repairs, renovations, and maintenance — fast, fair, and transparent.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Button variant="gold" size="lg" className="w-full sm:w-auto">
                Post Your Project
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Browse Contractors
              </Button>
            </div>

            {/* Social proof strip */}
            <div className="flex flex-wrap items-center gap-6 mt-8 pt-6 border-t border-border animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>2,400+ projects completed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>100% verified pros</span>
              </div>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={heroImage} 
                alt="Contractor and homeowner shaking hands in a renovated kitchen" 
                className="w-full h-[340px] lg:h-[460px] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" />
              
              {/* Floating stat card */}
              <div className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Average time to first quote</p>
                    <p className="text-lg font-bold text-foreground">Under 4 hours</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
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
