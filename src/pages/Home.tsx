import React from "react";
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

const Home: React.FC = () => {
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
      description:
        "Easily upload your property inspection report (PDF or other supported formats) to our platform. Our AI-driven system starts analyzing the document immediately.",
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
      description:
        "Once the report is processed, you can download the summarized results or share them directly with stakeholders, ensuring everyone is aligned for smarter decisions.",
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

  return (
    <>
      <HeroSection words={words} />
      <FeaturesSection features={features} />
      <HowItWorksSection steps={steps} />
      <TeamSection team={team} />
      <PriceSection />
    </>
  );
};

export default Home;
