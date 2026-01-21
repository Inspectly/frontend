import { Droplets, Zap, Wind, Home, TreeDeciduous, Bug } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const ServiceCategories = () => {
  const { ref, isVisible } = useScrollAnimation();

  const categories = [
    { icon: Droplets, label: "Plumbing" },
    { icon: Zap, label: "Electric" },
    { icon: Wind, label: "HVAC" },
    { icon: Home, label: "Roofing" },
    { icon: TreeDeciduous, label: "Landscaping" },
    { icon: Bug, label: "Pest Control" },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-6 lg:py-8 bg-white section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <div className="flex items-center justify-center gap-6 md:gap-10 lg:gap-12 flex-wrap">
          {categories.map((category, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-2.5 group cursor-pointer transition-all duration-300 hover:-translate-y-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                transition: `all 0.5s ease-out ${index * 0.08}s`
              }}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 flex items-center justify-center shadow-xl group-hover:bg-primary group-hover:shadow-2xl group-hover:shadow-primary/40 transition-all duration-300">
                <category.icon className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div >
    </section >
  );
};

export default ServiceCategories;
