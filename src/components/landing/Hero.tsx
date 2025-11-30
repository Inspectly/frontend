import React, { useState, useEffect } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroProps {
  onJoinWaitlist: () => void;
}

const Hero: React.FC<HeroProps> = ({ onJoinWaitlist }) => {
  const words = ["accelerated", "accurate", "intelligent", "easier"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const currentWord = words[currentWordIndex];
    const typeSpeed = isDeleting ? 50 : 100;
    const pauseDuration = 2000;

    if (isPaused) {
      const pauseTimer = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimer);
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (currentText.length < currentWord.length) {
          setCurrentText(currentWord.slice(0, currentText.length + 1));
        } else {
          // Word complete, pause then delete
          setIsPaused(true);
        }
      } else {
        // Deleting
        if (currentText.length > 0) {
          setCurrentText(currentWord.slice(0, currentText.length - 1));
        } else {
          // Move to next word
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [currentText, currentWordIndex, isDeleting, isPaused, words]);
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 -z-10" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-10 text-center relative z-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 backdrop-blur-sm border border-blue-200/50 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">
            AI-Powered Property Inspection Platform
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-2xl sm:text-5xl md:text-4xl lg:text-6xl font-bold mb-6 leading-tight">
          <span className="block text-gray-900">
            AI that makes managing properties
          </span>
          <span className="inline-block bg-gradient-to-r from-blue-900 via-green-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient animate-text-reveal">
              {currentText}
              <span className="inline-block w-0.5 h-[1em] bg-gradient-to-b from-blue-900 via-green-600 to-blue-600 ml-1 animate-blink align-middle" />
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
          Turn complex inspection reports into clear, actionable insights — instantly.
          <br className="hidden sm:block" />
          <span className="text-gray-500 text-base sm:text-lg mt-2 block">
            Upload your report • AI analyzes it • Get severity levels, insights, and recommendations
            <br />
            Make confident decisions in minutes, not hours.
          </span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onJoinWaitlist}
            className="group px-8 py-4 bg-gradient-to-r from-blue-900 via-green-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            Join waitlist
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => {
              const element = document.getElementById("how-it-works");
              element?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            View demo
          </button>
        </div>

        {/* Visual Element Placeholder */}
        <div className="mt-16 relative">
          <div className="relative max-w-4xl mx-auto">
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-blue-100 to-green-100 border border-gray-200 shadow-2xl flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-900 via-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <p className="text-gray-500 font-medium">Interactive Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        @keyframes text-reveal {
          from {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        .animate-text-reveal {
          animation: text-reveal 0.5s ease-out;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </section>
  );
};

export default Hero;





