import { Mail, MapPin, ArrowRight, Send, HelpCircle, ChevronRight, MessageSquare, Clock, Users, Headphones } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";

const ContactHero = () => {
    const { ref, isVisible } = useScrollAnimation();
    return (
        <section
            ref={ref as React.RefObject<HTMLElement>}
            className="pt-32 pb-20 bg-background relative overflow-hidden"
        >
            <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-0" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl -z-0" />
            <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-4xl text-center">
                <div
                    className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2 mb-6"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.5s ease-out",
                    }}
                >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-primary font-semibold text-sm">We'd love to hear from you</span>
                </div>
                <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.1s",
                    }}
                >
                    Get in <span className="text-primary">Touch</span>
                </h1>
                <p
                    className="text-lg text-muted-foreground max-w-xl mx-auto"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.2s",
                    }}
                >
                    Whether you're a homeowner with a question or a contractor looking to
                    join the beta, we're ready to help.
                </p>
            </div>
        </section>
    );
};

const QuickInfo = () => {
    const { ref, isVisible } = useScrollAnimation();
    const items = [
        { icon: Mail, label: "Email Us", value: "hello@inspectly.ai", href: "mailto:hello@inspectly.ai", delay: 0 },
        { icon: MapPin, label: "Headquarters", value: "Toronto, Canada", href: undefined, delay: 0.1 },
        { icon: Clock, label: "Response Time", value: "Within 24 hours", href: undefined, delay: 0.2 },
        { icon: Headphones, label: "Support", value: "Mon to Fri, 9am–6pm", href: undefined, delay: 0.3 },
    ];

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="pb-16 bg-background">
            <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.label}
                            className="group relative bg-card border border-border rounded-2xl p-6 text-center hover:border-primary/30 hover:shadow-md transition-all duration-300"
                            style={{
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? "translateY(0)" : "translateY(25px)",
                                transition: `all 0.6s ease-out ${item.delay}s`,
                            }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                <item.icon className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                                {item.label}
                            </p>
                            {item.href ? (
                                <a href={item.href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                                    {item.value}
                                </a>
                            ) : (
                                <p className="text-sm font-semibold text-foreground">{item.value}</p>
                            )}
                        </div>
                    ))}
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
        <section ref={ref as React.RefObject<HTMLElement>} className="pb-20 bg-background">
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

                    {/* Right side — FAQ card */}
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
                    </div>
                </div>
            </div>
        </section>
    );
};

const Contact = () => (
    <div className="min-h-screen bg-background">
        <ContactHero />
        <QuickInfo />
        <ContactForm />
    </div>
);

export default Contact;
