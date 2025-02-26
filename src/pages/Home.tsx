import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import {
  faClock,
  faLightbulb,
  faEye,
  faClipboard,
  faCreditCard,
  faSmile,
} from "@fortawesome/free-regular-svg-icons";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import HowItWorksSection from "../components/HowItWorksSection";
import TeamSection from "../components/TeamSection";
import PriceSection from "../components/PriceSection";
import NewsletterSection from "../components/NewsletterSection";
import FaqSection from "../components/FaqsSection";

import { SectionRefs } from "../types";

interface HomeProps {
  refs: SectionRefs;
  plans: any[];
}

const Home: React.FC<HomeProps> = ({ refs, plans }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType(); // PUSH, POP, or REPLACE

  const [hasScrolled, setHasScrolled] = useState(false); // Prevent scroll on initial load

  const { heroRef, featuresRef, howItWorksRef, teamRef, plansRef, faqsRef } =
    refs;

  const sectionOffsets: { [key: string]: number } = {
    heroRef: 0,
    featuresRef: -50,
    howItWorksRef: -10,
    teamRef: -50,
    plansRef: -20,
    faqsRef: -80,
  };

  const scrollToSection = (section?: string) => {
    let target;
    if (location.state) {
      const { targetSection } = location.state;
      target = targetSection;
    } else {
      target = section;
    }

    if (target in refs) {
      const targetRef = refs[target];
      if (targetRef && targetRef.current) {
        setTimeout(() => {
          const yPosition =
            targetRef.current!.getBoundingClientRect().top +
            window.scrollY +
            sectionOffsets[target];

          window.scrollTo({ top: yPosition, behavior: "smooth" });
          setHasScrolled(true);
        }, 100); // Delay the scroll slightly to ensure rendering
      }
    }

    // Clear location state after handling
    navigate(location.pathname, { replace: true });
  };

  useEffect(() => {
    const navigationEntries = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];

    const isPageRefreshed =
      navigationEntries[0]?.type === "reload" && navigationType === "POP";

    console.log(isPageRefreshed);
    if (isPageRefreshed) {
      setTimeout(() => {
        window.scrollTo(0, 0); // Reset scroll position on component mount
      }, 1000); // Wait for loading to finish
    }
  }, []);

  useEffect(() => {
    if (
      location.state &&
      typeof location.state.targetSection === "string" &&
      !hasScrolled
    ) {
      scrollToSection();
    }
  }, [location.state, refs, navigate, hasScrolled]);

  const words = ["accelerated", "accurate", "intelligent"];

  const features = [
    {
      icon: faClock,
      title: "Efficiency",
      description:
        "Save time and effort with our streamlined process that delivers comprehensive insights into property issues in a fraction of the time compared to traditional methods.",
    },
    {
      icon: faEye,
      title: "Transparency",
      description:
        "Understand every detail with clarity. Our tool translates complex inspection data into easy-to-understand severity levels and actionable recommendations.",
    },
    {
      icon: faCreditCard,
      title: "Cost-Effectiveness",
      description:
        "Avoid unexpected repair costs with our proactive insights, helping buyers make informed decisions and realtors provide enhanced client value.",
    },
    {
      icon: faLightbulb,
      title: "AI-driven insights",
      description:
        "Harness the power of artificial intelligence to identify patterns, assess risks, and predict long-term property maintenance needs.",
    },
    {
      icon: faClipboard,
      title: "Reliability",
      description:
        "Our AI-powered analysis ensures consistent, accurate, and data-driven severity assessments, giving homebuyers and realtors the confidence they need in inspection reports.",
    },
    {
      icon: faSmile,
      title: "User-friendly experience",
      description:
        "Intuitive design tailored for both realtors and homebuyers ensures a seamless experience, making property assessments accessible to everyone.",
    },
  ];

  const steps = [
    {
      number: 1,
      title: "Upload Your Inspection Report",
      description: (
        <div className="text-center">
          Easily upload your property inspection report (PDF or other supported
          formats) to our platform. Our AI-driven system starts analyzing the
          document immediately.
        </div>
      ),
      image: "images/undraw_upload.svg",
      delay: "0.3s",
    },
    {
      number: 2,
      title: "AI-Powered Features",
      description: (
        <div className="text-left">
          Our platform utilizes advanced AI tools to provide:
          <ul className="list-disc text-left ml-4">
            <li>
              Summarized Insights: Extract and simplify the most important
              details from your report for quick understanding.
            </li>
            <li>
              Severity Ratings: Issues are categorized as high, moderate, or low
              severity, helping you prioritize repairs.
            </li>
            <li>
              Chatbot Assistance: Ask specific questions about the report and
              receive instant, tailored responses for better clarity.
            </li>
          </ul>
        </div>
      ),
      image: "images/undraw_artificial-intelligence.svg",
      delay: "0.5s",
    },
    {
      number: 3,
      title: "Interactive Dashboard",
      description: (
        <div className="text-left">
          Access a streamlined dashboard where all the data is presented in an
          easy-to-navigate format.
          <ul className="list-disc text-left ml-4">
            <li>
              View summarized issues, severity ratings, and actionable
              recommendations.
            </li>
            <li>
              Gain a complete understanding of the inspection report in minutes.
            </li>
          </ul>
        </div>
      ),
      image: "images/undraw_dashboard.svg",
      delay: "0.7s",
    },
    {
      number: 4,
      title: "Make Confident Decisions",
      description: (
        <>
          <ul className="list-disc text-left ml-4">
            <li>
              <strong>Homebuyers:</strong> Prioritize critical repairs and
              negotiate with confidence using simplified insights and real-time
              chatbot assistance.
            </li>
            <li>
              <strong>Agents:</strong> Present clear and concise details to
              clients, saving time and improving communication.
            </li>
            <li>
              <strong>Inspectors:</strong> Deliver AI-enhanced reports that
              increase client satisfaction and credibility.
            </li>
          </ul>
        </>
      ),
      image: "images/undraw_business-decisions.svg",
      delay: "0.9s",
    },
    {
      number: 5,
      title: "Download or Share Your Results",
      description: (
        <div className="text-center">
          Once the report is processed, you can download the summarized results
          or share them directly with stakeholders, ensuring everyone is aligned
          for smarter decisions.
        </div>
      ),
      image: "images/undraw_sharing-articles.svg",
      delay: "1.1s",
    },
  ];

  const team = [
    {
      image: "images/Manzur.jpeg",
      quote:
        "It seems that only fragments of the original text remain in the Lorem Ipsum texts used today.",
      name: "Manzur Mulk",
      position: "Staff Engineer, Algolia",
    },
    {
      image: "images/Sharhad.jpg",
      quote:
        "The most well-known dummy text is the 'Lorem Ipsum', which is said to have originated in the 16th century.",
      name: "Sharhad Bashar",
      position: "Staff Engineer, Algolia",
    },
    {
      image: "images/Yousef.png",
      quote:
        "One disadvantage of Lorem Ipsum is that in Latin certain letters appear more frequently than others.",
      name: "Yousef Ouda",
      position: "Staff Engineer, Algolia",
    },
    {
      image: "images/Mohammed_Hussein.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Mohammed Hussein",
      position: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "One disadvantage of Lorem Ipsum is that in Latin certain letters appear more frequently than others.",
      name: "Abdel Malek Fadel",
      position: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Moe Mohasseb",
      position: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Abdullah Anwar",
      position: "Staff Engineer, Algolia",
    },
    {
      image: "images/placeholder.jpg",
      quote:
        "Thus, Lorem Ipsum has only limited suitability as a visual filler for German texts.",
      name: "Mohammed Alaa",
      position: "Staff Engineer, Algolia",
    },
  ];

  const faqs = [
    {
      question: "What is Inspectly?",
      answer:
        "Inspectly is an AI powered platform that simplifies property inspection reports.",
    },
    {
      question: "Can I upload any type of inspection report?",
      answer:
        "Yes, Inspectly supports a wide range of formats, including PDFs.",
    },
    {
      question: "How much does it cost to use Inspectly?",
      answer:
        "Our pricing is simple and flexible, starting at $69.95 per report.",
    },
    {
      question: "Is my data secure?",
      answer:
        "All uploaded reports are processed securely and handled in compliance with industry standards.",
    },
    {
      question: "How long does it take to process a report?",
      answer:
        "Reports are processed in minutes, giving you instant access to insights and recommendations.",
    },
  ];

  return (
    <>
      <div ref={heroRef}>
        <HeroSection
          words={words}
          scrollToSection={() => scrollToSection("plansRef")}
        />
      </div>
      <div ref={featuresRef}>
        <FeaturesSection features={features} />
      </div>
      <div ref={howItWorksRef}>
        <HowItWorksSection steps={steps} />
      </div>
      <div ref={teamRef}>
        <TeamSection team={team} />
      </div>
      <div ref={plansRef}>
        <PriceSection plans={plans} />
      </div>
      <NewsletterSection />
      <div ref={faqsRef}>
        <FaqSection faqs={faqs} />
      </div>
    </>
  );
};

export default Home;
