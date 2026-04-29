import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileSearch,
  ShieldCheck,
  Home,
  Wrench,
  Upload,
  MessageSquare,
  Milestone,
  ChevronRight,
} from "lucide-react";

/* ── Hero ─────────────────────────────────────────────── */
const AboutHero = () => {
  const words = ["chaos", "guessing", "frustration"];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-28 pb-0 lg:pt-36 overflow-hidden bg-foreground">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="pb-16 lg:pb-24">
            <span className="inline-block px-3 py-1 border border-primary/40 text-primary rounded-full text-xs font-semibold tracking-wide uppercase mb-6 animate-fade-up">
              Our story
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-[3.4rem] font-display font-bold text-background leading-[1.15] mb-5 animate-fade-up"
              style={{ animationDelay: "0.08s" }}
            >
              Home repairs shouldn't
              <br />
              be full of{" "}
              <span
                className={`text-primary inline-block transition-all duration-300 ${
                  isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                }`}
              >
                {words[currentIndex]}
              </span>
            </h1>
            <p
              className="text-base lg:text-lg text-background/65 max-w-md animate-fade-up"
              style={{ animationDelay: "0.16s" }}
            >
              Inspectly connects homeowners with licensed contractors through a single,
              honest platform — no middlemen, no mystery pricing, no headaches.
            </p>
          </div>

          <div className="hidden lg:block relative">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=700&h=700&fit=crop"
              alt="Modern home exterior"
              className="w-full h-[420px] object-cover rounded-t-3xl"
            />
            <div className="absolute bottom-0 left-6 right-6 bg-background/95 backdrop-blur-sm rounded-xl p-4 shadow-xl translate-y-4">
              <div className="flex items-center gap-3">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" alt="" className="h-10 w-10 rounded-full object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">"Got 3 quotes in under 24 hours"</p>
                  <p className="text-xs text-muted-foreground">Marcus T. — First-time homeowner, Toronto</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Why We Exist ─────────────────────────────────────── */
const WhyWeExist = () => {
  const { ref, isVisible } = useScrollAnimation();

  const struggles = [
    {
      icon: Home,
      title: "The Homeowner Struggle",
      body: "Opaque reports, apples-to-oranges quotes, and the risk of unverified contractors. You shouldn't need a general contractor just to understand your own inspection report.",
    },
    {
      icon: Wrench,
      title: "The Contractor Friction",
      body: "Sifting through low-quality leads and price-shopping customers instead of doing great work. Good contractors deserve better leads.",
    },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <div
          className="mb-12"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease-out",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Why We Exist
          </h2>
          <p className="text-muted-foreground text-lg">
            Maintaining a home is a massive financial decision, yet the process remains fragmented and outdated. We built Inspectly to bridge the gap.
          </p>
        </div>

        <div className="space-y-8">
          {struggles.map((item, i) => (
            <div
              key={i}
              className="flex gap-5 items-start"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease-out ${0.15 * (i + 1)}s`,
              }}
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center">
                <item.icon className="h-6 w-6 text-background" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── The Problem ──────────────────────────────────────── */
const TheProblem = () => {
  const { ref, isVisible } = useScrollAnimation();

  const stats = [
    { value: "72%", label: "of homeowners say getting repair quotes is stressful" },
    { value: "$1,200", label: "average overpay when you can't compare bids" },
    { value: "3 weeks", label: "typical wait just to get a contractor to show up" },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 lg:py-28 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div
          className="max-w-2xl mb-14"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease-out",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            The home repair industry is broken
          </h2>
          <p className="text-muted-foreground text-lg">
            Homeowners get vague quotes, chase down contractors, and hope for the best. 
            Contractors waste time on tire-kickers. Everyone loses.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-background rounded-2xl p-6 border border-border"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease-out ${0.15 * (i + 1)}s`,
              }}
            >
              <p className="text-3xl font-display font-bold text-primary mb-2">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── How We Fix It ────────────────────────────────────── */
const HowWeFixIt = () => {
  const { ref, isVisible } = useScrollAnimation();

  const steps = [
    {
      icon: Upload,
      title: "Post a job or upload your inspection report",
      body: "Describe what you need done — or upload your home inspection report and we'll extract every issue automatically. No manual data entry required.",
      img: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=500&h=300&fit=crop",
    },
    {
      icon: MessageSquare,
      title: "Get real quotes from real people",
      body: "Licensed, reviewed contractors in your area see your project on our marketplace and send you bids. Compare pricing, timelines, and reviews side-by-side.",
      img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&h=300&fit=crop",
    },
    {
      icon: Milestone,
      title: "Track every step to completion",
      body: "Milestone-based progress, in-app messaging, and payment protection mean no one gets ghosted. Pay securely through the platform when you're satisfied.",
      img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=300&fit=crop",
    },
  ];

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 lg:py-28 bg-foreground">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div
          className="text-center mb-16"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.7s ease-out",
          }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold text-background mb-3">
            A better way to handle home projects
          </h2>
          <p className="text-background/60 max-w-lg mx-auto">
            Three steps. Zero runaround.
          </p>
        </div>

        <div className="space-y-16">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.7s ease-out ${0.2 * (i + 1)}s`,
              }}
            >
              <div className="md:w-1/2">
                <img src={step.img} alt={step.title} className="w-full h-56 object-cover rounded-2xl" />
              </div>
              <div className="md:w-1/2 space-y-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold text-background">{step.title}</h3>
                <p className="text-background/60 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ── CTA ──────────────────────────────────────────────── */
const AboutCTA = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-0 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl py-16 lg:py-24">
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.98)",
            transition: "all 0.8s ease-out",
          }}
        >
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&h=600&fit=crop"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/70" />

          <div className="relative z-10 text-center py-16 lg:py-20 px-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-background mb-4">
              Ready to skip the runaround?
            </h2>
            <p className="text-base text-background/80 mb-8 max-w-md mx-auto">
              Join hundreds of homeowners and contractors who are already doing home projects the right way.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/contact">
                <Button variant="gold" size="lg" className="h-12 px-8 gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 border-background/30 text-background hover:bg-background hover:text-foreground gap-2"
                >
                  Join as a Contractor
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Page ─────────────────────────────────────────────── */
const About = () => (
  <main className="min-h-screen bg-background">
    <Navbar />
    <AboutHero />
    <WhyWeExist />
    <TheProblem />
    <HowWeFixIt />
    <AboutCTA />
    <Footer />
  </main>
);

export default About;
