import { Zap, UserCheck, DollarSign, Shield, Star, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";

const Features = () => {
  const { ref, isVisible } = useScrollAnimation();

  const features = [
    {
      icon: Zap,
      title: "Fast Matching",
      description: "Get connected with qualified contractors within hours, not days.",
    },
    {
      icon: UserCheck,
      title: "Vetted Professionals",
      description: "Every contractor is background-checked and license-verified.",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Compare quotes upfront with no hidden fees or surprises.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Protected payments released only when you're satisfied.",
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "Satisfaction guarantee on all completed projects.",
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Message contractors directly through our secure platform.",
    },
  ];

  return (
    <section
      id="features"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 lg:py-20 bg-white section-animate ${isVisible ? 'visible' : ''}`}
    >
      {/* Subtle background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/10 to-muted rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* Section header */}
        <div
          className="text-center mb-12"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
            Why Choose InspectlyAI?
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            Simple, secure, and stress-free contractor hiring.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group shadow-2xl p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease-out ${0.1 + index * 0.08}s`
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <feature.icon className="w-6 h-6 text-foreground group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
