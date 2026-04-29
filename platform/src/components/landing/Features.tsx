import { Zap, UserCheck, DollarSign, Shield, Star, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

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
      image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=250&fit=crop",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
      description: "Compare quotes upfront with no hidden fees or surprises.",
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=250&fit=crop",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Protected payments released only when you're satisfied.",
      image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop",
    },
    {
      icon: Star,
      title: "Quality Guaranteed",
      description: "Satisfaction guarantee on all completed projects.",
      image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400&h=250&fit=crop",
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Message contractors directly through our secure platform.",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=250&fit=crop",
    },
  ];

  return (
    <section 
      id="features" 
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 lg:py-20 bg-background section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div 
          className="text-center mb-12"
          style={{ 
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-foreground mb-3">
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
              className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-1"
              style={{ 
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease-out ${0.1 + index * 0.08}s`
              }}
            >
              {/* Feature image */}
              <div className="relative h-36 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-3 left-3">
                  <div className="w-10 h-10 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-sm group-hover:bg-primary transition-colors duration-300">
                    <feature.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
