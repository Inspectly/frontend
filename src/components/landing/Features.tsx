import React from "react";
import {
  Zap,
  Eye,
  DollarSign,
  Brain,
  Shield,
  User,
} from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Features: React.FC = () => {
  const features: Feature[] = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Efficiency",
      description:
        "Save time and effort with a streamlined process that delivers comprehensive insights in minutes, not hours.",
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Transparency",
      description:
        "Complex inspection data is transformed into clear severity levels and actionable recommendations.",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Cost-Effectiveness",
      description:
        "Avoid unexpected repair costs with proactive insights that empower smarter decisions.",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-driven Insights",
      description:
        "Harness the power of AI to detect patterns, assess risks, and predict long-term maintenance needs.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Reliability",
      description:
        "Consistent, accurate, data-backed severity assessments that build confidence for buyers and agents.",
    },
    {
      icon: <User className="w-6 h-6" />,
      title: "User-Friendly Experience",
      description:
        "Intuitive, modern interface that makes property assessments accessible to everyone.",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 md:py-32 bg-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features for
            <span className="block bg-gradient-to-r from-blue-900 via-green-600 to-blue-600 bg-clip-text text-transparent mt-2">
              Modern Property Inspections
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to transform inspection reports into actionable insights
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-900 via-green-600 to-blue-600 flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect Gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-900/0 via-green-600/0 to-blue-600/0 group-hover:from-blue-900/5 group-hover:via-green-600/5 group-hover:to-blue-600/5 transition-all duration-300 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;





