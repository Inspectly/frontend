import { Upload, Eye, Handshake, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  const steps = [
    {
      icon: Upload,
      number: "01",
      title: "Post Your Job",
      description: "Describe your repair or renovation — or upload your home inspection report and we'll extract the issues for you.",
      image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=300&fit=crop",
    },
    {
      icon: Eye,
      number: "02",
      title: "Contractors Find You",
      description: "Your project goes live on our marketplace. Licensed, vetted contractors in your area review it and send you quotes.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    },
    {
      icon: Handshake,
      number: "03",
      title: "Choose & Get Matched",
      description: "Compare bids, reviews, and timelines side-by-side. Accept the contractor that fits and get matched instantly.",
      image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop",
    },
    {
      icon: CheckCircle,
      number: "04",
      title: "Complete & Pay Securely",
      description: "Track milestones, message your contractor, and pay securely — all within the platform.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop",
    },
  ];

  return (
    <section 
      id="how-it-works" 
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
            How It Works
          </h2>
          <p className="text-muted-foreground text-base">Get started in four simple steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
                {/* Step image */}
                <div className="relative h-36 overflow-hidden">
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background text-xs font-bold">
                      {step.number}
                    </span>
                  </div>
                </div>

                <div className="p-5 pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                      <step.icon className="w-4 h-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
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
