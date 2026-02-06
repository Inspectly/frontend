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
      className={`py-20 lg:py-28 bg-gray-900 relative overflow-hidden section-animate ${isVisible ? 'visible' : ''}`}
    >
      {/* Subtle gold glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <div
          className="text-center"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.98)',
            transition: 'all 0.8s ease-out'
          }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-white mb-4">
            Ready to Start Your{" "}
            <span className="font-serif italic text-amber-400">Home Project?</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-lg mx-auto">
            Join thousands of homeowners who found trusted contractors through InspectlyAI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-gray-900 font-semibold text-base h-12 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-gray-400 hover:text-white text-base h-12 px-8"
              onClick={() => navigate("/signup")}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
