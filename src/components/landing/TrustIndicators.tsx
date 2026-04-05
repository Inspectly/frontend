import { Leaf, Cpu, ShieldCheck, Clock } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const TrustIndicators = () => {
  const { ref, isVisible } = useScrollAnimation();

  const indicators = [
    { icon: Leaf, value: "100%", label: "Canadian-First Platform" },
    { icon: Cpu, value: "2,400+", label: "Projects Completed" },
    { icon: ShieldCheck, value: "500+", label: "Licensed & Insured Pros" },
    { icon: Clock, value: "24h", label: "Response Guarantee" },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 lg:py-20 bg-[#0d1117] section-animate ${isVisible ? "visible" : ""}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <h2
          className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white text-center mb-10"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease-out",
          }}
        >
          Trusted by Homeowners Across Canada
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {indicators.map((item, index) => (
            <div
              key={index}
              className="text-center group"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease-out ${0.15 + index * 0.1}s`,
              }}
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors duration-300">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-display font-bold text-white mb-1">{item.value}</p>
              <p className="text-sm text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators;
