import { Home, Wrench, Rocket, Target, Eye, UserCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";

const AboutHero = () => {
    const { ref, isVisible } = useScrollAnimation();
    return (
        <section
            ref={ref as React.RefObject<HTMLElement>}
            className="pt-32 pb-20 bg-background relative overflow-hidden text-center"
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
            <div className="container mx-auto px-4 lg:px-8 relative z-10 max-w-4xl">
                <div
                    className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-5 py-2 mb-6"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.5s ease-out",
                    }}
                >
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-primary font-semibold text-sm uppercase tracking-wider">About Inspectly AI</span>
                </div>
                <h1
                    className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-8"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.1s",
                    }}
                >
                    Built to Bring <span className="text-primary italic">Trust</span> to Home Projects
                </h1>
                <p
                    className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.2s",
                    }}
                >
                    We’re fixing the broken experience between a problem found and a project finished. No more guessing. No more opacity.
                </p>
            </div>
        </section>
    );
};

const WhyWeExist = () => {
    const { ref, isVisible } = useScrollAnimation();
    const values = [
        { id: "01", label: "AI Extraction™" },
        { id: "02", label: "Vetted Pros" },
        { id: "03", label: "Transparency" },
        { id: "04", label: "Accountability" },
    ];

    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-24 bg-white text-black">
            <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateX(0)" : "translateX(-30px)",
                            transition: "all 0.7s ease-out",
                        }}
                    >
                        <h2 className="text-4xl font-display font-bold mb-6">Why We Exist</h2>
                        <p className="text-lg text-gray-600 mb-10 leading-relaxed font-light">
                            Maintaining a home is a massive financial decision, yet the process remains fragmented and outdated. We built Inspectly to bridge the gap.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start group">
                                <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors duration-300">
                                    <Home className="w-6 h-6" />
                                </div>
                                <div className="ml-5">
                                    <h4 className="text-lg font-bold">The Homeowner Struggle</h4>
                                    <p className="text-gray-500 text-base leading-relaxed">Opaque reports, apple-to-orange quotes, and the risk of unverified contractors.</p>
                                </div>
                            </div>
                            <div className="flex items-start group">
                                <div className="w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0 text-black group-hover:border-primary group-hover:text-primary transition-colors duration-300">
                                    <Wrench className="w-6 h-6" />
                                </div>
                                <div className="ml-5">
                                    <h4 className="text-lg font-bold">The Contractor Friction</h4>
                                    <p className="text-gray-500 text-base leading-relaxed">Sifting through low-quality leads and price-shopping customers instead of doing great work.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {values.map((value, idx) => (
                            <div
                                key={value.id}
                                className={`p-8 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-primary/50 hover:shadow-lg transition-all duration-300 ${idx % 2 !== 0 ? 'mt-8' : ''}`}
                                style={{
                                    opacity: isVisible ? 1 : 0,
                                    transform: isVisible ? "translateY(0)" : "translateY(40px)",
                                    transition: `all 0.6s ease-out ${0.3 + idx * 0.1}s`,
                                }}
                            >
                                <h3 className="text-3xl font-display font-bold text-primary mb-3">{value.id}</h3>
                                <p className="font-bold text-zinc-900">{value.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const ExtractionBanner = () => {
    const { ref, isVisible } = useScrollAnimation();
    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-24 px-4">
            <div className="max-w-7xl mx-auto bg-zinc-900 rounded-3xl p-10 md:p-16 relative overflow-hidden border border-white/5 shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Sparkles className="w-[300px] h-[300px] text-primary" />
                </div>
                <div
                    className="md:w-2/3 relative z-10"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(30px)",
                        transition: "all 0.7s ease-out",
                    }}
                >
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-6">
                        Inspectly <span className="text-primary italic">AI Extraction™</span>
                    </h2>
                    <p className="text-zinc-400 text-lg mb-10 leading-relaxed font-light">
                        Turn messy PDFs into clear action. Upload your home inspection report and our AI automatically pulls out key issues, categorizes by severity, and converts them into a ready-to-quote project list instantly.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button variant="gold" size="lg" onClick={() => (window.location.href = '/signup')}>
                            Post Your Project
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/5" onClick={() => (window.location.href = '/signup')}>
                            Broadcast to Pros
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const MissionSection = () => {
    const { ref, isVisible } = useScrollAnimation();
    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-24 px-4 bg-background">
            <div className="max-w-4xl mx-auto text-center">
                <h2
                    className="text-4xl font-display font-bold mb-10"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out",
                    }}
                >
                    Our Mission
                </h2>
                <p
                    className="text-2xl md:text-3xl font-light leading-relaxed text-muted-foreground italic mb-20"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.2s",
                    }}
                >
                    "To make home repairs and renovations <span className="text-foreground border-b-2 border-primary font-medium px-2">simple, transparent, and trustworthy</span>—from inspection to completion."
                </p>

                <div className="grid md:grid-cols-2 gap-12 text-left">
                    <div
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateY(0)" : "translateY(20px)",
                            transition: "all 0.6s ease-out 0.4s",
                        }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Rocket className="w-5 h-5 text-primary" />
                            <h4 className="text-primary font-bold uppercase tracking-widest text-xs">The Approach</h4>
                        </div>
                        <p className="text-muted-foreground leading-relaxed leading-relaxed font-light">
                            We are launching as a Beta platform, building <strong>with</strong> our users. We value quality over volume and trust over scale.
                        </p>
                    </div>
                    <div
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateY(0)" : "translateY(20px)",
                            transition: "all 0.6s ease-out 0.5s",
                        }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Eye className="w-5 h-5 text-primary" />
                            <h4 className="text-primary font-bold uppercase tracking-widest text-xs">The Vision</h4>
                        </div>
                        <p className="text-muted-foreground leading-relaxed leading-relaxed font-light">
                            Becoming the trusted infrastructure behind home projects where inspections, payments, and accountability live in one place.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

const BetaCTA = () => {
    const { ref, isVisible } = useScrollAnimation();
    return (
        <section ref={ref as React.RefObject<HTMLElement>} className="py-24 px-4 text-center bg-zinc-900 overflow-hidden relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-0" />
            <div
                className="max-w-3xl mx-auto relative z-10"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "scale(1)" : "scale(0.95)",
                    transition: "all 0.8s ease-out",
                }}
            >
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6 leading-tight">
                    Homes deserve better systems.
                </h2>
                <p className="text-xl text-zinc-400 mb-12 max-w-xl mx-auto font-light">
                    Join the Inspectly Beta today and help us shape the future of home ownership.
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Button variant="gold" size="xl" className="w-full sm:w-auto shadow-2xl shadow-primary/20" onClick={() => window.location.href = '/signup'}>
                        JOIN THE BETA
                    </Button>
                    <Button variant="outline" size="xl" className="w-full sm:w-auto border-white hover:bg-white hover:text-black text-white" onClick={() => window.location.href = '/signup'}>
                        JOIN AS VENDOR
                        <UserCheck className="ml-2 w-5 h-5 transition-transform group-hover:scale-110" />
                    </Button>
                </div>
            </div>
        </section>
    );
};

const About = () => {
    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            <AboutHero />
            <WhyWeExist />
            <ExtractionBanner />
            <MissionSection />
            <BetaCTA />
        </div>
    );
};

export default About;
