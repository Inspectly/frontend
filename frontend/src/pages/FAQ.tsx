import { HelpCircle, MessageSquare, ArrowRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/components/hooks/useScrollAnimation";
const faqs = [
    {
        question: "Is AI Extraction™ free?",
        answer: "During beta, we offer free uploads for early users. Pricing will evolve as we add more features.",
    },
    {
        question: "Does this replace my home inspector?",
        answer: "No—it helps you act on the report faster. It does not replace professional inspection services.",
    },
    {
        question: "Is my report secure?",
        answer: "Yes. We treat inspection reports as sensitive documents with secure storage and access controls.",
    },
];

const FAQItem = ({ question, answer, index }: { question: string; answer: string; index: number }) => {
    const [isOpen, setIsOpen] = useState(index === 0);
    const { ref, isVisible } = useScrollAnimation();

    return (
        <div
            ref={ref as React.RefObject<HTMLDivElement>}
            className="border-b border-border last:border-0"
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.5s ease-out ${index * 0.1}s`,
            }}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-6 text-left group"
            >
                <span className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {question}
                </span>
                <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : ""
                        }`}
                />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 pb-6" : "max-h-0"
                    }`}
            >
                <p className="text-muted-foreground leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    );
};

const FAQHero = () => {
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
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <span className="text-primary font-semibold text-sm">Common Questions</span>
                </div>
                <h1
                    className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.1s",
                    }}
                >
                    Frequently Asked <span className="text-primary">Questions</span>
                </h1>
                <p
                    className="text-lg text-muted-foreground max-w-xl mx-auto"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? "translateY(0)" : "translateY(20px)",
                        transition: "all 0.6s ease-out 0.2s",
                    }}
                >
                    Everything you need to know about AI Extraction™, report security, and our process.
                </p>
            </div>
        </section>
    );
};

const FAQ = () => {
    const { ref, isVisible } = useScrollAnimation();

    return (
        <div className="min-h-screen bg-background">
            <FAQHero />

            <section className="pb-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-8 md:p-12 shadow-sm">
                        {faqs.map((faq, index) => (
                            <FAQItem key={index} {...faq} index={index} />
                        ))}
                    </div>

                    {/* Still have questions? */}
                    <div
                        ref={ref as React.RefObject<HTMLDivElement>}
                        className="mt-12 text-center"
                        style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? "translateY(0)" : "translateY(20px)",
                            transition: "all 0.6s ease-out 0.4s",
                        }}
                    >
                        <div className="inline-flex flex-col items-center gap-4 p-8 bg-primary/5 rounded-2xl border border-primary/10 w-full">
                            <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center">
                                <MessageSquare className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-1">Still have questions?</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Can't find the answer you're looking for? Please chat with our team.
                                </p>
                            </div>
                            <Button
                                variant="gold"
                                onClick={() => window.location.href = '/contact'}
                                className="gap-2"
                            >
                                Contact Support
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FAQ;
