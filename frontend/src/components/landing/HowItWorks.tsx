import { Upload, Lightbulb, Users, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();

  const steps = [
    {
      icon: Upload,
      number: "1",
      title: "Post Your Project",
      description: "Describe your home repair or renovation needs in minutes.",
    },
    {
      icon: Lightbulb,
      number: "2",
      title: "AI Matches Instantly",
      description: "Our AI analyzes your project and finds the best-suited contractors.",
    },
    {
      icon: Users,
      number: "3",
      title: "Get Matched with Pros",
      description: "Receive quotes from vetted, licensed professionals near you.",
    },
    {
      icon: CheckCircle,
      number: "4",
      title: "Complete Your Project",
      description: "Track progress and pay securely through our platform.",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-14 border-b border-border lg:py-20 bg-white section-animate ${isVisible ? 'visible' : ''}`}
    >
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
            How It Works
          </h2>
          <p className="text-muted-foreground text-base">Get started in four simple steps</p>
        </div>
        {/* Subtle background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-muted rounded-full blur-3xl" />
        </div>
        {/* Steps - horizontal flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 0.6s ease-out ${0.2 + index * 0.1}s`
              }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-full h-px bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="relative bg-card rounded-2xl p-6 border border-border hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                {/* Icon - top right */}
                <div className="flex justify-between items-start mb-5">
                  <span className="text-xs font-mono text-muted-foreground tracking-wider">
                    {step.number}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-foreground group-hover:bg-primary flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <step.icon className="w-5 h-5 text-background" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
