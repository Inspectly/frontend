import React, { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);
    setEmail("");

    // Reset success message after 5 seconds
    setTimeout(() => {
      setIsSuccess(false);
    }, 5000);
  };

  return (
    <section
      id="waitlist"
      className="py-20 md:py-32 bg-gradient-to-br from-blue-900 via-green-600 to-blue-600 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Heading */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
          Stay ahead of every inspection
        </h2>
        <p className="text-lg sm:text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
          Join the waitlist for early access, updates, and exclusive features
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isSubmitting || isSuccess}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/95 backdrop-blur-sm border-2 border-white/20 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 text-gray-900 placeholder-gray-500 disabled:opacity-50 transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isSuccess || !email}
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Joining...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Joined!</span>
                </>
              ) : (
                "Join waitlist"
              )}
            </button>
          </div>

          {/* Success Message */}
          {isSuccess && (
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5" />
                <p className="font-medium">
                  Thanks! We'll notify you when Inspectly launches.
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Trust Indicators */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-blue-100 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Early access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Product updates</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Exclusive features</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </section>
  );
};

export default Waitlist;





