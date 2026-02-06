import { Upload, Lightbulb, Users, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation();

  const steps = [
    {
      icon: Upload,
      number: "01",
      title: "Post Your Project",
      description: "Describe your home repair or renovation needs in minutes.",
    },
    {
      icon: Lightbulb,
      number: "02",
      title: "AI Matches Instantly",
      description: "Our AI analyzes your project and finds the best-suited contractors.",
    },
    {
      icon: Users,
      number: "03",
      title: "Get Matched with Pros",
      description: "Receive quotes from vetted, licensed professionals near you.",
    },
    {
      icon: CheckCircle,
      number: "04",
      title: "Complete Your Project",
      description: "Track progress and pay securely through our platform.",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      className={`py-20 lg:py-28 bg-gray-50 section-animate ${isVisible ? 'visible' : ''}`}
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
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-gray-900 mb-4">
            How It <span className="font-serif italic">Works</span>
          </h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto">
            Get started in four simple steps
          </p>
        </div>

        {/* Steps - horizontal flow */}
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
              <div className="relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-lg h-full">
                {/* Number - top left */}
                <span className="text-xs font-mono text-amber-600 tracking-wider mb-4 block">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center mb-5 group-hover:bg-amber-500 transition-all duration-300">
                  <step.icon className="w-5 h-5 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
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
