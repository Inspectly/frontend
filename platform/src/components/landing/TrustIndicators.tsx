import { Leaf, Clock, ShieldCheck, Handshake } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TrustIndicators = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  const indicators = [
    { icon: Leaf, stat: "100%", label: "Canadian-First Platform" },
    { icon: Handshake, stat: "2,400+", label: "Projects Completed" },
    { icon: ShieldCheck, stat: "500+", label: "Licensed & Insured Pros" },
    { icon: Clock, stat: "24h", label: "Response Guarantee" },
  ];

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-16 lg:py-20 bg-foreground section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl text-center">
        <h2 
          className="text-2xl md:text-3xl font-display font-bold text-background mb-10"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          Trusted by Homeowners Across Canada
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {indicators.map((item, index) => (
            <div
              key={index}
              className="text-center group"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.6s ease-out ${index * 0.1}s`
              }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-background/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-background mb-1">{item.stat}</p>
              <p className="text-sm text-background/60">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
