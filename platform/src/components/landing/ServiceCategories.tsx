import { Droplets, Zap, Wind, HardHat, TreeDeciduous, Bug } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import catPlumbing from "@/assets/cat-plumbing.jpg";
import catElectrical from "@/assets/cat-electrical.jpg";
import catHvac from "@/assets/cat-hvac.jpg";
import catRoofing from "@/assets/cat-roofing.jpg";
import catLandscaping from "@/assets/cat-landscaping.jpg";
import catPest from "@/assets/cat-pest.jpg";

const ServiceCategories = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  const categories = [
    { image: catPlumbing, label: "Plumbing", icon: Droplets },
    { image: catElectrical, label: "Electrical", icon: Zap },
    { image: catHvac, label: "HVAC", icon: Wind },
    { image: catRoofing, label: "Roofing", icon: HardHat },
    { image: catLandscaping, label: "Landscaping", icon: TreeDeciduous },
    { image: catPest, label: "Pest Control", icon: Bug },
  ];

  return (
    <section 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-12 lg:py-16 bg-background border-b border-border section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8">Browse by service category</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-3 group cursor-pointer"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
                transition: `all 0.5s ease-out ${index * 0.08}s`
              }}
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300 group-hover:-translate-y-1">
                <img 
                  src={category.image} 
                  alt={category.label}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                {/* Icon overlay */}
                <div className="absolute inset-0 bg-foreground/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <category.icon className="w-7 h-7 text-background" />
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <category.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {category.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;
