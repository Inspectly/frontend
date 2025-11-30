import React from "react";
import {
  Upload,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  Share2,
} from "lucide-react";

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string | React.ReactNode;
}

const HowItWorks: React.FC = () => {
  const steps: Step[] = [
    {
      number: 1,
      icon: <Upload className="w-6 h-6" />,
      title: "Upload Your Inspection Report",
      description:
        "Upload your property inspection report (PDF or other supported formats). AI analysis begins immediately.",
    },
    {
      number: 2,
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI-Powered Features",
      description: (
        <ul className="text-left space-y-2 mt-3">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Summarized insights</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Severity ratings (high, moderate, low)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Chatbot assistance for instant answers</span>
          </li>
        </ul>
      ),
    },
    {
      number: 3,
      icon: <LayoutDashboard className="w-6 h-6" />,
      title: "Interactive Dashboard",
      description:
        "See issues, severity ratings, and recommendations in a streamlined and intuitive dashboard.",
    },
    {
      number: 4,
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Make Confident Decisions",
      description: (
        <ul className="text-left space-y-2 mt-3">
          <li className="flex items-start gap-2">
            <span className="font-semibold">Homebuyers:</span>
            <span>prioritize repairs & negotiate confidently</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">Agents:</span>
            <span>communicate clearly with clients</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold">Inspectors:</span>
            <span>deliver AI-enhanced clarity</span>
          </li>
        </ul>
      ),
    },
    {
      number: 5,
      icon: <Share2 className="w-6 h-6" />,
      title: "Download or Share Results",
      description:
        "Share or download an AI-summarized version of your report.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-32 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From upload to insights in minutes — a seamless, AI-powered workflow
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 md:space-y-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col md:flex-row items-start gap-6 md:gap-8 group ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Step Number & Icon */}
              <div className="flex-shrink-0 w-full md:w-auto">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-900 via-green-600 to-blue-600 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-blue-500 shadow-lg">
                    <span className="text-sm font-bold text-blue-600">
                      {step.number}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group-hover:border-blue-200">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <div className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {typeof step.description === "string" ? (
                    <p>{step.description}</p>
                  ) : (
                    step.description
                  )}
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





