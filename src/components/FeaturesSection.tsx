import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface Feature {
  title: string;
  description: string;
  icon: IconProp;
}

interface FeaturesProps {
  features: Feature[];
}

const FeaturesSection: React.FC<FeaturesProps> = ({ features }) => {
  const [isFeatureTitleInView, setIsFeatureTitleInView] = useState(false);
  const [visibleFeatureCards, setVisibleFeatureCards] = useState<number[]>([]);
  const [hasAnimated, setHasAnimated] = useState(false); // Track if animation has already occurred

  const featuresRef = useRef<HTMLDivElement | null>(null);
  const featureCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFeatureTitleInView(entry.isIntersecting); // Set to true when in view
      },
      { threshold: 0.1 } // Trigger when 10% of the section is visible
    );

    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }

    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, [isFeatureTitleInView]);

  useEffect(() => {
    if (hasAnimated) return; // Prevent further animations after the first run

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(
            entry.target.getAttribute("data-index") || "0",
            10
          );

          if (entry.isIntersecting) {
            setVisibleFeatureCards((prev) => [...new Set([...prev, index])]);

            // Stop observing individual card after it's animated
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the card is visible
    );

    featureCardsRef.current.forEach((card, index) => {
      if (card) {
        card.setAttribute("data-index", index.toString());
        observer.observe(card);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [hasAnimated]);

  return (
    <section className="container pt-16 pb-20 mx-auto px-4 md:px-8 xl:px-16 2xl:px-32">
      <div className="flex flex-wrap justify-center">
        <div className="flex flex-wrap items-center justify-center container px-4 mx-auto mb-12">
          {/* Heading */}
          <div
            ref={featuresRef}
            className={`w-full lg:w-1/2 mb-4 lg:mb-0 transition-all duration-700 ${
              isFeatureTitleInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-10"
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold font-heading">
              <span>Crafted by </span>
              <span className="text-blue-500">homebuyers</span>
              <br />
              <span>for </span>
              <span className="text-blue-500">homebuyers</span>
            </h2>
          </div>

          {/* Paragraph */}
          <div
            className={`w-full lg:w-1/2 transition-all duration-700 ${
              isFeatureTitleInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <p className="text-gray-400 leading-loose">
              Effortlessly enhance your home-buying journey. Seamlessly designed
              for clarity, confidence, and peace of mind in every decision.
              Navigate challenges with ease and precision.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            ref={(el) => (featureCardsRef.current[index] = el)}
            className={`border border-gray-50 pt-8 px-6 pb-6 bg-white text-center rounded shadow hover:shadow-lg flex flex-col h-full ${
              visibleFeatureCards.includes(index)
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-40"
            }`}
            style={{
              transition: "transform 0.5s ease, opacity 0.5s ease", // Smooth animation for translate and opacity
              transitionDelay: `${index * 0.1}s`, // Stagger animation
            }}
          >
            <FontAwesomeIcon
              icon={feature.icon}
              className="text-3xl text-blue-500 mb-4"
            />
            <h3 className="mb-2 font-bold font-heading">{feature.title}</h3>
            <p className="text-sm text-gray-400 flex-grow">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
