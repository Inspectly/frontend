import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";

const CTA = () => {
  const { ref, isVisible } = useScrollAnimation();
  const navigate = useNavigate();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-16 lg:py-24 bg-white relative overflow-hidden section-animate ${isVisible ? 'visible' : ''}`}
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-muted rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
        <div
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)',
            transition: 'all 0.8s ease-out'
          }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
            Ready to Start Your{" "}
            <span className="text-primary">Home Project?</span>
          </h2>
          <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto">
            Join homeowners who found trusted contractors through InspectlyAI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="gold" size="lg" className="text-base h-12 px-8" onClick={() => navigate("/signup")}>
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-base h-12 px-8" onClick={() => navigate("/contact")}>
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
