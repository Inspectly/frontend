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
      className={`py-20 lg:py-28 bg-white section-animate ${isVisible ? 'visible' : ''}`}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Section header */}
        <div
          className="text-center mb-16"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out'
          }}
        >
          <span className="text-xs font-medium tracking-[0.2em] uppercase text-amber-600 mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-gray-900 mb-4">
            Built for <span className="font-serif italic">Excellence</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-lg mx-auto">
            Simple, secure, and stress-free contractor hiring.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-900 transition-all duration-300 hover:shadow-lg"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease-out ${0.1 + index * 0.08}s`
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5 group-hover:bg-gray-900 transition-all duration-300">
                <feature.icon className="w-5 h-5 text-gray-900 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
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
