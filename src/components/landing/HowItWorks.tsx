import { Upload, Search, Users, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();

  const steps = [
    {
      icon: Upload,
      number: "01",
      title: "Post Your Job",
      description: "Describe your repair or renovation — or upload your home inspection report and we'll extract the issues for you.",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    {
      icon: Search,
      number: "02",
      title: "Contractors Find You",
      description: "Your project goes live on our marketplace. Licensed, vetted contractors in your area review it and send you quotes.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    },
    {
      icon: Users,
      number: "03",
      title: "Choose & Get Matched",
      description: "Compare bids, reviews, and timelines side-by-side. Accept the contractor that fits and get matched instantly.",
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
    },
    {
      icon: CheckCircle,
      number: "04",
      title: "Complete & Pay Securely",
      description: "Track milestones, message your contractor, and pay securely — all within the platform.",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop",
    },
  ];

  return (
    <section
      id="how-it-works"
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
            How It Works
          </h2>
          <p className="text-muted-foreground text-base">Get started in four simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(30px)",
                transition: `all 0.6s ease-out ${0.2 + index * 0.1}s`,
              }}
            >
              <div className="relative bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 h-full flex flex-col">
                {/* Image with number badge */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-xs font-bold shadow-lg">
                      {step.number}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <step.icon className="w-4 h-4 text-foreground group-hover:text-primary-foreground transition-colors duration-300" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
