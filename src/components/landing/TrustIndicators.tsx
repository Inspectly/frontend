import { Leaf, Cpu, ShieldCheck, Clock } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const TrustIndicators = () => {
  const { ref, isVisible } = useScrollAnimation();

  const indicators = [
    {
      icon: Leaf,
      title: "Canadian-First",
      subtitle: "Platform",
    },
    {
      icon: Cpu,
      title: "AI-Powered",
      subtitle: "Matching",
    },
    {
      icon: ShieldCheck,
      title: "Licensed &",
      subtitle: "Insured",
    },
    {
      icon: Clock,
      title: "24h Response",
      subtitle: "Time",
    },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-10 bg-white section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="flex items-center justify-center gap-6 md:gap-12 flex-wrap">
          {indicators.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 group"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.6s ease-out ${index * 0.1}s`
              }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;