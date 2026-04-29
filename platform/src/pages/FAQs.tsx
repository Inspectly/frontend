import { HelpCircle, Search, MessageCircle, Shield, CreditCard, Home, Wrench, Users } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQCategory {
  title: string;
  icon: typeof HelpCircle;
  faqs: { question: string; answer: string }[];
}

const categories: FAQCategory[] = [
  {
    title: "Getting Started",
    icon: Home,
    faqs: [
      { question: "How do I add a property?", answer: "Navigate to the Properties page and click 'Add Property.' Enter your address and upload any inspection reports you have. Your property will appear in your dashboard immediately." },
      { question: "What is an inspection report?", answer: "An inspection report is a detailed document produced by a certified home inspector. It lists issues found during a property inspection, categorized by trade type and severity." },
      { question: "Can I add multiple properties?", answer: "Yes! You can add as many properties as you'd like. Each property gets its own dedicated page with issues, offers, and history." },
    ],
  },
  {
    title: "Issues & Repairs",
    icon: Wrench,
    faqs: [
      { question: "How are issues categorized?", answer: "Issues are organized by trade type (Electrical, Plumbing, Structural, etc.) and severity (High, Medium, Low). This helps you prioritize what needs attention first." },
      { question: "Can I post a job for an issue?", answer: "Absolutely. Click 'Post a Job' from any property page. You'll fill out details about the issue, and verified vendors in your area will be able to submit quotes." },
      { question: "How do I track the status of a repair?", answer: "Each issue has a status indicator: Open, In Progress, or Completed. You'll receive notifications as vendors update job progress." },
    ],
  },
  {
    title: "Vendors & Offers",
    icon: Users,
    faqs: [
      { question: "How are vendors verified?", answer: "All vendors on Inspectly go through a verification process including license checks, insurance verification, and background screening before they can submit offers." },
      { question: "Can I compare multiple offers?", answer: "Yes. When you post a job, multiple vendors can submit quotes. You can compare pricing, ratings, reviews, and estimated timelines side by side." },
      { question: "What happens after I accept an offer?", answer: "Once accepted, the vendor will contact you to schedule the work. You can communicate through the platform and track progress in real time." },
    ],
  },
  {
    title: "Billing & Payments",
    icon: CreditCard,
    faqs: [
      { question: "How much does Inspectly cost?", answer: "Inspectly offers a free tier for managing up to 2 properties. Premium plans start at $9.99/month and include unlimited properties, priority vendor matching, and advanced analytics." },
      { question: "Do I pay vendors through Inspectly?", answer: "Payment arrangements are made directly between you and the vendor. Inspectly facilitates the connection and provides a secure messaging platform." },
    ],
  },
  {
    title: "Privacy & Security",
    icon: Shield,
    faqs: [
      { question: "Is my property data secure?", answer: "Yes. All data is encrypted in transit and at rest. We never share your personal information with third parties without your explicit consent." },
      { question: "Can I delete my account?", answer: "You can request account deletion at any time from your profile settings. All associated data will be permanently removed within 30 days." },
    ],
  },
];

const FAQs = () => {
  const [search, setSearch] = useState("");
  const location = useLocation();
  const isStandalone = location.pathname === "/faqs";

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      faqs: cat.faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.faqs.length > 0);

  const totalFaqs = categories.reduce((s, c) => s + c.faqs.length, 0);

  const content = (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-up">
      <div className="text-center mb-8">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {totalFaqs} answers to help you get the most out of Inspectly
        </p>
      </div>

      <div className="relative max-w-md mx-auto mb-10">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filteredCategories.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground">Try a different search term or browse all categories.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card key={cat.title} className="border-border overflow-hidden">
                <div className="flex items-center gap-3 px-5 pt-5 pb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-foreground text-sm">{cat.title}</h2>
                </div>
                <CardContent className="px-5 pb-5 pt-0">
                  <Accordion type="single" collapsible className="w-full">
                    {cat.faqs.map((faq, i) => (
                      <AccordionItem key={i} value={`${cat.title}-${i}`} className="border-border">
                        <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary py-3">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-10 border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-8 w-8 text-primary mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-1">Still have questions?</h3>
          <p className="text-sm text-muted-foreground mb-4">Our support team is here to help you.</p>
          <a href="/contact" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Contact Support
          </a>
        </CardContent>
      </Card>
    </div>
  );

  if (isStandalone) {
    return (
      <>
        <Navbar />
        {content}
        <Footer />
      </>
    );
  }

  return content;
};

export default FAQs;
