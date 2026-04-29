import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const Pricing = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  const features = [
    "Transparent Bidding",
    "Contractor Discovery",
    "Loyalty Programs",
    "Bundle Discounts",
    "AI-Powered Matching",
    "Verified Professionals",
  ];

  return (
    <section 
      id="pricing" 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-16 lg:py-24 bg-foreground text-background section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
        {/* Section header */}
        <div 
          className="text-center mb-10"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mb-3">
            Choose Your Plan
          </h2>
          <p className="text-base text-background/70">
            Everything you need to find the perfect contractor.
          </p>
        </div>

        {/* Single pricing card */}
        <div 
          style={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
            transition: 'all 0.7s ease-out 0.2s'
          }}
        >
          <div className="relative rounded-3xl p-10 bg-background text-foreground transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-full shadow-lg shadow-primary/30">
                <Sparkles className="w-4 h-4" />
                Free to Start
              </span>
            </div>

            {/* Plan name */}
            <h3 className="text-2xl md:text-3xl font-display font-bold text-center mb-8 mt-2">
              InspectlyAI Core
            </h3>

            {/* Features - 2 column grid */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {features.map((feature, index) => (
                <li 
                  key={index} 
                  className="flex items-center gap-3 text-base"
                  style={{ 
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
                    transition: `all 0.5s ease-out ${0.3 + index * 0.08}s`
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button variant="gold" size="lg" className="w-full text-base h-12">
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
