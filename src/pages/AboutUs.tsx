import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Home, Wrench, Upload, MessageSquare, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";

const heroImg = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";
const step1Img = "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80";
const step2Img = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80";
const step3Img = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80";
const ctaBgImg = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80";

const rotatingWords = ["frustration", "confusion", "overcharging", "runaround", "headaches"];

const AboutUs = () => {
  const navigate = useNavigate();

  const [wordIndex, setWordIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { ref: whyRef, isVisible: whyVisible } = useScrollAnimation();
  const { ref: brokenRef, isVisible: brokenVisible } = useScrollAnimation();
  const { ref: stepsRef, isVisible: stepsVisible } = useScrollAnimation();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  const stats = [
    { value: "72%", desc: "of homeowners say getting repair quotes is stressful" },
    { value: "$1,200", desc: "average overpay when you can't compare bids" },
    { value: "3 weeks", desc: "typical wait just to get a contractor to show up" },
  ];

  const steps = [
    {
      img: step1Img,
      icon: Upload,
      title: "Post a job or upload your inspection report",
      desc: "Describe what you need done — or upload your home inspection report and we'll extract every issue automatically. No manual data entry required.",
    },
    {
      img: step2Img,
      icon: MessageSquare,
      title: "Get real quotes from real people",
      desc: "Licensed, reviewed contractors in your area see your project on our marketplace and send you bids. Compare pricing, timelines, and reviews side-by-side.",
    },
    {
      img: step3Img,
      icon: ArrowRightLeft,
      title: "Track every step to completion",
      desc: "Milestone-based progress, in-app messaging, and payment protection mean no one gets ghosted. Pay securely through the platform when you're satisfied.",
    },
  ];

  return (
    <main className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative bg-[#0d1117] pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left copy */}
            <div className="animate-fade-up">
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                Our Story
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.15] mb-6">
                Home repairs{" "}
                <br className="hidden sm:block" />
                shouldn't{" "}
                <br className="hidden sm:block" />
                be full of{" "}
                <span
                  className={`text-primary inline-block transition-all duration-300 ${
                    isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                >
                  {rotatingWords[wordIndex]}
                </span>
              </h1>
              <p className="text-base md:text-lg text-gray-400 max-w-md leading-relaxed" style={{ animationDelay: "0.2s" }}>
                Inspectly connects homeowners with licensed contractors through a single, honest platform — no middlemen, no mystery pricing, no headaches.
              </p>
            </div>

            {/* Right image + testimonial card */}
            <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={heroImg} alt="Modern home exterior" className="w-full h-[340px] lg:h-[420px] object-cover" />
              </div>
              <div className="absolute -bottom-6 right-4 md:right-8 bg-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 max-w-xs">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-600">M</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">"Got 3 quotes in under 24 hours"</p>
                  <p className="text-xs text-gray-500">Marcus T. — First-time homeowner, Toronto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY WE EXIST ── */}
      <section
        ref={whyRef as React.RefObject<HTMLElement>}
        className={`py-16 lg:py-24 bg-white section-animate ${whyVisible ? "visible" : ""}`}
      >
        <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
          <div
            style={{
              opacity: whyVisible ? 1 : 0,
              transform: whyVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease-out",
            }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
              Why We Exist
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-xl">
              Maintaining a home is a massive financial decision, yet the process remains fragmented and outdated. We built Inspectly to bridge the gap.
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                icon: Home,
                title: "The Homeowner Struggle",
                desc: "Opaque reports, apples-to-oranges quotes, and the risk of unverified contractors. You shouldn't need a general contractor just to understand your own inspection report.",
              },
              {
                icon: Wrench,
                title: "The Contractor Friction",
                desc: "Sifting through low-quality leads and price-shopping customers instead of doing great work. Good contractors deserve better leads.",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className="flex items-start gap-5"
                style={{
                  opacity: whyVisible ? 1 : 0,
                  transform: whyVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `all 0.6s ease-out ${0.2 + i * 0.15}s`,
                }}
              >
                <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-background" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE HOME REPAIR INDUSTRY IS BROKEN ── */}
      <section
        ref={brokenRef as React.RefObject<HTMLElement>}
        className={`py-16 lg:py-24 bg-muted/30 section-animate ${brokenVisible ? "visible" : ""}`}
      >
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div
            className="max-w-xl mb-10"
            style={{
              opacity: brokenVisible ? 1 : 0,
              transform: brokenVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease-out",
            }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3">
              The home repair industry is broken
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Homeowners get vague quotes, chase down contractors, and hope for the best. Contractors waste time on tire-kickers. Everyone loses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {stats.map((stat, i) => (
              <div
                key={stat.value}
                className="bg-white rounded-2xl border border-border p-6 shadow-sm"
                style={{
                  opacity: brokenVisible ? 1 : 0,
                  transform: brokenVisible ? "translateY(0)" : "translateY(30px)",
                  transition: `all 0.6s ease-out ${0.2 + i * 0.12}s`,
                }}
              >
                <p className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── A BETTER WAY TO HANDLE HOME PROJECTS ── */}
      <section
        ref={stepsRef as React.RefObject<HTMLElement>}
        className={`py-16 lg:py-24 bg-[#0d1117] section-animate ${stepsVisible ? "visible" : ""}`}
      >
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div
            className="text-center mb-14"
            style={{
              opacity: stepsVisible ? 1 : 0,
              transform: stepsVisible ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s ease-out",
            }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3">
              A better way to handle home projects
            </h2>
            <p className="text-gray-400 text-base">Three steps. Zero runaround.</p>
          </div>

          <div className="space-y-16">
            {steps.map((step, i) => {
              const isReversed = i % 2 !== 0;
              return (
                <div
                  key={step.title}
                  className={`grid lg:grid-cols-2 gap-8 items-center ${isReversed ? "lg:direction-rtl" : ""}`}
                  style={{
                    opacity: stepsVisible ? 1 : 0,
                    transform: stepsVisible ? "translateY(0)" : "translateY(30px)",
                    transition: `all 0.6s ease-out ${0.2 + i * 0.15}s`,
                  }}
                >
                  <div className={`${isReversed ? "lg:order-2" : ""}`}>
                    <div className="rounded-2xl overflow-hidden shadow-xl">
                      <img src={step.img} alt={step.title} className="w-full h-[260px] md:h-[300px] object-cover" />
                    </div>
                  </div>
                  <div className={`${isReversed ? "lg:order-1" : ""}`}>
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-md">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── READY TO SKIP THE RUNAROUND? ── */}
      <section
        ref={ctaRef as React.RefObject<HTMLElement>}
        className={`py-16 lg:py-24 bg-white section-animate ${ctaVisible ? "visible" : ""}`}
      >
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              opacity: ctaVisible ? 1 : 0,
              transform: ctaVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
              transition: "all 0.8s ease-out",
            }}
          >
            <img src={ctaBgImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/30" />
            <div className="relative z-10 text-center py-16 px-6 md:py-20">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                Ready to skip the runaround?
              </h2>
              <p className="text-gray-300 text-base max-w-lg mx-auto mb-8">
                Join hundreds of homeowners and contractors who are already doing home projects the right way.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="gold" size="lg" className="text-base h-12 px-8" onClick={() => navigate("/signup")}>
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="text-base h-12 px-8 border-white/30 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => navigate("/signup")}
                >
                  Join as a Contractor
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AboutUs;
