import { Zap, UserCheck, DollarSign, Shield, Star, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();

  const features = [
    {
      icon: Zap,
      title: "Fast Matching",
      description: "Get connected with qualified contractors within hours, not days.",
      image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=250&fit=crop",
    },
    {
      icon: UserCheck,
      title: "Vetted Professionals",
      description: "Every contractor is background-checked and license-verified.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=250&fit=crop",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Compare quotes upfront with no hidden fees or surprises.",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=250&fit=crop",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Protected payments released only when you're satisfied.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "Satisfaction guarantee on all completed projects.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop",
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Message contractors directly through our secure platform.",
      image: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=400&h=250&fit=crop",
    },
  ];

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 lg:py-20 relative overflow-hidden bg-white section-animate ${isVisible ? "visible" : ""}`}
    >
      {/* Soft radial background tint */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-[-15%] bg-[radial-gradient(ellipse_at_center,_#fdf6e8_0%,_#ffffff_65%)]" />
      </div>
      {/* Gold background splash */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-r from-primary/10 to-gold-light/20 rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div
          className="text-center mb-12"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease-out",
          }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
            Why Choose Inspectly?
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            Simple, secure, and stress-free contractor hiring.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group shadow-2xl rounded-2xl bg-card border border-border overflow-hidden hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(30px)",
                transition: `all 0.6s ease-out ${0.1 + index * 0.08}s`,
              }}
            >
              <div className="h-40 overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 -mt-10 relative z-10 border-2 border-white shadow-md">
                  <feature.icon className="w-5 h-5 text-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
