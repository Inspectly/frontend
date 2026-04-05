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
      className={`py-16 lg:py-24 bg-white relative overflow-hidden section-animate ${isVisible ? "visible" : ""}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div
          className="relative rounded-3xl overflow-hidden shadow-2xl"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
            transition: "all 0.8s ease-out",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
          <div className="relative z-10 text-center py-16 px-6 md:py-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
              Ready to Start Your{" "}
              <span className="text-primary">Home Project?</span>
            </h2>
            <p className="text-base text-gray-300 mb-8 max-w-md mx-auto">
              Join homeowners who found trusted contractors through InspectlyAI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="gold" size="lg" className="text-base h-12 px-8" onClick={() => navigate("/signup")}>
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base h-12 px-8 border-white/30 text-white hover:bg-white/10 hover:text-white"
                onClick={() => navigate("/signup")}
              >
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
