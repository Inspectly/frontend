import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import ctaBg from "@/assets/cta-bg.jpg";

const CTA = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-0 bg-background relative overflow-hidden section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl py-16 lg:py-24">
        <div 
          className="relative rounded-3xl overflow-hidden"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)',
            transition: 'all 0.8s ease-out'
          }}
        >
          {/* Background image */}
          <img 
            src={ctaBg} 
            alt="Beautiful renovated living room" 
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-foreground/70" />

          {/* Content */}
          <div className="relative z-10 text-center py-16 lg:py-20 px-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-background mb-4">
              Ready to Start Your{" "}
              <span className="text-primary">Home Project?</span>
            </h2>
            <p className="text-base text-background/80 mb-8 max-w-md mx-auto">
              Join homeowners who found trusted contractors through InspectlyAI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gold" size="lg" className="text-base h-12 px-8">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-base h-12 px-8 border-background/30 text-background hover:bg-background/10">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
