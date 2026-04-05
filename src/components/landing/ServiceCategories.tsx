import { Droplets, Zap, Wind, Home, TreeDeciduous, Bug } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const ServiceCategories = () => {
  const { ref, isVisible } = useScrollAnimation();

  const categories = [
    { icon: Droplets, label: "Plumbing", image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=120&h=120&fit=crop" },
    { icon: Zap, label: "Electrical", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=120&h=120&fit=crop" },
    { icon: Wind, label: "HVAC", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=120&h=120&fit=crop" },
    { icon: Home, label: "Roofing", image: "https://images.unsplash.com/photo-1632759145351-1d592919f522?w=120&h=120&fit=crop" },
    { icon: TreeDeciduous, label: "Landscaping", image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?w=120&h=120&fit=crop" },
    { icon: Bug, label: "Pest Control", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&h=120&fit=crop" },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-8 lg:py-10 relative bg-white section-animate ${isVisible ? "visible" : ""}`}
    >
      {/* Bottom fade into How It Works */}
      {/* Bottom fade into How It Works */}
      <div className="absolute bottom-0 left-0 right-0 h-40 -z-10 bg-[radial-gradient(ellipse_at_bottom,_#fefcf7_0%,_#ffffff_80%)]" />
      <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
        <p
          className="text-center text-sm text-muted-foreground mb-6"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(10px)",
            transition: "all 0.5s ease-out",
          }}
        >
          Browse by service category
        </p>
        <div className="flex items-center justify-center gap-6 md:gap-10 lg:gap-12 flex-wrap">
          {categories.map((category, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-2.5 group cursor-pointer transition-all duration-300 hover:-translate-y-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
                transition: `all 0.5s ease-out ${index * 0.08}s`,
              }}
            >
              <div className="w-16 h-16 md:w-18 md:h-18 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-300 border-2 border-transparent group-hover:border-primary/40">
                <img src={category.image} alt={category.label} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300 inline-flex items-center gap-1">
                <category.icon className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;
