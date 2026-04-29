import { Mail, MapPin, ArrowRight, Send, HelpCircle, ChevronRight, MessageSquare, Clock, Users, Headphones, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const ContactHero = () => {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative pt-28 pb-0 lg:pt-36 overflow-hidden bg-foreground"
    >
      <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="pb-16 lg:pb-24">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 border border-primary/40 text-primary rounded-full text-xs font-semibold tracking-wide uppercase mb-6"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.5s ease-out",
              }}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Get in touch
            </span>
            <h1
              className="text-4xl md:text-5xl lg:text-[3.4rem] font-display font-bold text-background leading-[1.15] mb-5"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease-out 0.1s",
              }}
            >
              We're here to{" "}
              <span className="text-primary">help</span>
            </h1>
            <p
              className="text-base lg:text-lg text-background/65 max-w-md"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease-out 0.2s",
              }}
            >
              Whether you're a homeowner with a question or a contractor looking to
              join, we're ready to help.
            </p>

            {/* Quick contact info */}
            <div
              className="mt-8 flex flex-col gap-4"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease-out 0.3s",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-background/50">Email</p>
                  <a href="mailto:hello@inspectly.ai" className="text-sm font-semibold text-background hover:text-primary transition-colors">hello@inspectly.ai</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-background/50">Location</p>
                  <p className="text-sm font-semibold text-background">Toronto, Canada</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-background/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-background/50">Response time</p>
                  <p className="text-sm font-semibold text-background">Within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <img
              src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&h=700&fit=crop"
              alt="Team working together"
              className="w-full h-[480px] object-cover rounded-t-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactForm = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section ref={ref as React.RefObject<HTMLElement>} className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left side — form */}
          <div
            className="lg:col-span-3 bg-card border border-border rounded-2xl p-8 md:p-10"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateX(0)" : "translateX(-30px)",
              transition: "all 0.7s ease-out",
            }}
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
              Send a Message
            </h2>
            <p className="text-muted-foreground mb-8">
              Fill out the form and we'll be in touch.
            </p>

            {submitted ? (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-5">
                  <Send className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                <p className="text-muted-foreground">Thank you for reaching out. We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input placeholder="Name" required />
                  <Input type="email" placeholder="Email" required />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select required>
                    <SelectTrigger>
                      <SelectValue placeholder="I am a..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homeowner">Homeowner</SelectItem>
                      <SelectItem value="vendor">Vendor / Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Issue category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="pricing">Pricing &amp; Memberships</SelectItem>
                      <SelectItem value="beta">Beta Access</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="Subject" />
                <Textarea placeholder="Your message..." rows={5} required className="resize-none" />
                <Button variant="gold" size="lg" className="w-full text-base">
                  Send Message
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </form>
            )}
          </div>

          {/* Right side — cards */}
          <div
            className="lg:col-span-2 flex flex-col gap-5"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? "translateX(0)" : "translateX(30px)",
              transition: "all 0.7s ease-out 0.15s",
            }}
          >
            <a
              href="/faq"
              className="group bg-foreground rounded-2xl p-8 hover:shadow-xl transition-all duration-300 block"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 group-hover:scale-110 transition-all duration-300">
                <HelpCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-background mb-2">
                Frequently Asked Questions
              </h3>
              <p className="text-background/60 text-sm mb-5">
                Get answers about memberships, pricing, and how our vendors are screened.
              </p>
              <span className="inline-flex items-center gap-1 text-primary font-semibold text-sm group-hover:gap-2 transition-all duration-300">
                Browse FAQs
                <ChevronRight className="w-4 h-4" />
              </span>
            </a>

            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-8">
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">
                Join the Beta
              </h3>
              <p className="text-muted-foreground text-sm mb-5">
                Be part of shaping the future of home projects as a homeowner or contractor.
              </p>
              <Button variant="gold" size="sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Visual support card */}
            <div className="relative rounded-2xl overflow-hidden h-48">
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&h=300&fit=crop"
                alt="Contractor at work"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/60" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Headphones className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="text-background font-display font-bold">Mon – Fri, 9am–6pm</p>
                  <p className="text-background/60 text-sm">Support hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <ContactHero />
    <ContactForm />
    <Footer />
  </div>
);

export default Contact;
