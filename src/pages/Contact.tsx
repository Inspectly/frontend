import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Mail, MapPin, Clock, HelpCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";
import { toast } from "react-hot-toast";

const rotatingWords = ["help", "assist", "support", "listen", "connect"];

const Contact = () => {
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

  const { ref: formRef, isVisible: formVisible } = useScrollAnimation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    category: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(form.subject || "Contact from Inspectly");
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nRole: ${form.role}\nCategory: ${form.category}\n\n${form.message}`
    );
    window.location.href = `mailto:inspectlyai@gmail.com?subject=${subject}&body=${body}`;
    toast.success("Thank you! Your message has been sent.");
    setForm({ name: "", email: "", role: "", category: "", subject: "", message: "" });
  };

  const contactInfo = [
    { icon: Mail, label: "Email", value: "inspectlyai@gmail.com" },
    { icon: MapPin, label: "Location", value: "London, Ontario" },
    { icon: Clock, label: "Response time", value: "Within 24 hours" },
  ];

  return (
    <main className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative bg-[#0d1117] pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left copy */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-primary border border-primary/30 rounded-full px-4 py-1.5 mb-6">
                <Mail className="w-3.5 h-3.5" />
                Get in Touch
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-[1.15] mb-6">
                We're here to
                <br />
                <span
                  className={`text-primary inline-block transition-all duration-300 ${
                    isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                >
                  {rotatingWords[wordIndex]}
                </span>
              </h1>
              <p
                className="text-base md:text-lg text-gray-400 max-w-md leading-relaxed mb-10 animate-fade-up"
                style={{ animationDelay: "0.15s" }}
              >
                Whether you're a homeowner with a question or a contractor looking to join, we're ready to help.
              </p>

              <div className="space-y-5 animate-fade-up" style={{ animationDelay: "0.25s" }}>
                {contactInfo.map((item, i) => (
                  <div key={item.label} className="flex items-center gap-4" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                    <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right image */}
            <div className="relative animate-fade-up" style={{ animationDelay: "0.15s" }}>
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&q=80"
                  alt="Team high-fiving"
                  className="w-full h-[340px] lg:h-[420px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ── */}
      <section
        ref={formRef as React.RefObject<HTMLElement>}
        className={`py-16 lg:py-24 bg-white section-animate ${formVisible ? "visible" : ""}`}
      >
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left: Form (3 cols) */}
            <div
              className="lg:col-span-3"
              style={{
                opacity: formVisible ? 1 : 0,
                transform: formVisible ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s ease-out",
              }}
            >
              <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
                Send a Message
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Fill out the form and we'll be in touch.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Row 1: Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="h-11 px-4 rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="h-11 px-4 rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Row 2: Role + Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <select
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      required
                      className="h-11 w-full px-4 rounded-lg border border-border bg-white text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="" disabled>I am a...</option>
                      <option value="Homeowner">Homeowner</option>
                      <option value="Vendor / Contractor">Vendor / Contractor</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                      className="h-11 w-full px-4 rounded-lg border border-border bg-white text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="" disabled>Issue category</option>
                      <option value="General">General</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Technical">Technical</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>

                {/* Row 3: Subject */}
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="h-11 w-full px-4 rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />

                {/* Row 4: Message */}
                <textarea
                  name="message"
                  placeholder="Your message..."
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-white text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />

                {/* Submit */}
                <Button type="submit" variant="gold" className="w-full">
                  Send Message
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Right: Sidebar Cards (2 cols) */}
            <div className="lg:col-span-2 space-y-5">
              {/* FAQ Card */}
              <div
                className="rounded-2xl bg-[#0d1117] p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                style={{
                  opacity: formVisible ? 1 : 0,
                  transform: formVisible ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.6s ease-out 0.15s",
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-display font-bold text-white mb-2">
                  Frequently Asked Questions
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Get answers about memberships, pricing, and how our vendors are screened.
                </p>
                <button
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-colors"
                >
                  Browse FAQs
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Join the Beta Card */}
              <div
                className="rounded-2xl bg-[#fefcf7] border border-border p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                style={{
                  opacity: formVisible ? 1 : 0,
                  transform: formVisible ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.6s ease-out 0.3s",
                }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">
                  Join the Beta
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Be part of shaping the future of home projects as a homeowner or contractor.
                </p>
                <Button variant="gold" size="sm" onClick={() => navigate("/signup")}>
                  Get Started
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Support Hours Card */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 h-44"
                style={{
                  opacity: formVisible ? 1 : 0,
                  transform: formVisible ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.6s ease-out 0.45s",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80"
                  alt="Support"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
                <div className="relative z-10 flex flex-col items-center justify-end h-full pb-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-base font-display font-bold text-white">Mon – Fri, 9am–6pm</p>
                  <p className="text-xs text-gray-300">Support hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
