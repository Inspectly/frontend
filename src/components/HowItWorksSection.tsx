import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

interface Step {
  number: number;
  title: string;
  description: string | JSX.Element;
  image: string;
  delay: string;
}

interface HowItWorksProps {
  steps: Step[];
}

const HowItWorksSection: React.FC<HowItWorksProps> = ({ steps }) => {
  const [isHowitworksInView, setIsHowitworksInView] = useState(false);
  const [visibleStepCards, setVisibleStepCards] = useState<number[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const howitworksRef = useRef<HTMLDivElement | null>(null);
  const stepsCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const descriptionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleCardClick = (index: number) => {
    const descriptionElement = descriptionRefs.current[index];
    if (descriptionElement) {
      const lineHeight = parseFloat(
        window.getComputedStyle(descriptionElement).lineHeight || "0"
      );
      const maxHeight = lineHeight * 4; // Height for 4 lines
      if (descriptionElement.scrollHeight <= maxHeight) {
        // If description fits within 4 lines, do not open modal
        return;
      }
    }
    setExpandedCard((prev) => (prev === index ? null : index));
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHowitworksInView(entry.isIntersecting); // Set to true when in view
      },
      { threshold: 0.1 }
    );

    if (howitworksRef.current) {
      observer.observe(howitworksRef.current);
    }

    return () => {
      if (howitworksRef.current) {
        observer.unobserve(howitworksRef.current);
      }
    };
  }, [isHowitworksInView]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(
            entry.target.getAttribute("data-index") || "0",
            10
          );

          if (entry.isIntersecting) {
            setVisibleStepCards((prev) => [...new Set([...prev, index])]);
          }
        });
      },
      { threshold: 0.1 }
    );

    stepsCardsRef.current.forEach((card, index) => {
      if (card) {
        card.setAttribute("data-index", index.toString());
        observer.observe(card);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const renderExpandedCard = () => {
    if (expandedCard === null) return null;

    const step = steps[expandedCard];

    return ReactDOM.createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
        onClick={() => setExpandedCard(null)} // Close on backdrop click
      >
        <div
          className="relative bg-white p-6 shadow-lg rounded-lg z-50 w-full max-w-3xl"
          onClick={(e) => e.stopPropagation()} // Prevent backdrop close
        >
          <div className="flex w-12 h-12 mx-auto items-center justify-center text-blue-800 font-bold font-heading bg-blue-200 rounded-full">
            {step.number}
          </div>
          <img
            className="h-48 mx-auto my-4 object-cover rounded-lg"
            src={step.image}
            alt={step.title}
          />
          <h3 className="mb-2 font-bold font-heading text-center">
            {step.title}
          </h3>
          <div className="text-sm text-gray-400 leading-relaxed">
            {step.description}
          </div>
          <button
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
            onClick={() => setExpandedCard(null)} // Close on button click
          >
            ✕
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <section
      ref={howitworksRef}
      className="relative pt-16 pb-20 bg-gradient-to-r from-gray-100/70 to-gray-100"
    >
      <div className="absolute top-0 inset-x-0 hidden sm:block">
        <img
          src="/images/white-wave.svg"
          alt="svg"
          className="w-full -scale-x-100"
        />
      </div>
      <div className="container mx-auto sm:pt-16 sm:pb-4 px-4 md:px-8 xl:px-16 2xl:px-32">
        <div className="flex flex-wrap justify-center">
          <div className="flex flex-wrap items-center justify-center container px-4 mx-auto mb-12">
            <div
              className={`w-full lg:w-1/2 mb-4 lg:mb-0 transition-all duration-700 ${
                isHowitworksInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-10"
              }`}
            >
              <h2 className="text-3xl md:text-4xl font-bold font-heading">
                <span>Trusted by early adopters revolutionizing </span>
                <span className="text-blue-500">home buying decisions</span>
              </h2>
            </div>
            <div
              className={`w-full lg:w-1/2 transition-all duration-700 ${
                isHowitworksInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <p className="text-gray-400 leading-loose">
                Join the journey with our early adopters and visionary
                collaborators who share our passion for revolutionizing the
                home-buying experience. Together, we're setting the foundation
                for the future.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center -mx-3 -mb-6 text-center">
          {steps.map((step, index) => (
            <div
              key={index}
              ref={(el) => (stepsCardsRef.current[index] = el)}
              onClick={() => handleCardClick(index)}
              className={`relative cursor-pointer w-full h-auto sm:w-1/2 lg:w-1/3 px-3 mb-6 transition-all duration-500 ${
                visibleStepCards.includes(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-20"
              }`}
              style={{
                transition: "transform 1s ease, opacity 1s ease",
                transitionDelay: `${index * 0.2}s`,
              }}
            >
              <div className="p-6 bg-white shadow rounded flex flex-col justify-between hover:scale-105 hover:shadow-lg transition-transform duration-500">
                <div className="flex w-12 h-12 mx-auto items-center justify-center text-blue-800 font-bold font-heading bg-blue-200 rounded-full">
                  {step.number}
                </div>
                <img
                  className="h-48 mx-auto my-4"
                  src={step.image}
                  alt={step.title}
                />
                <h3 className="mb-2 font-bold font-heading">{step.title}</h3>
                <div
                  ref={(el) => (descriptionRefs.current[index] = el)}
                  className="text-sm text-gray-400 leading-relaxed transition-all duration-500 line-clamp-4"
                >
                  {step.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {renderExpandedCard()}
      <div className="absolute bottom-0 inset-x-0 hidden sm:block">
        <img
          src="/images/white-wave.svg"
          alt="svg"
          className="w-full scale-x-100 -scale-y-100"
        />
      </div>
    </section>
  );
};

export default HowItWorksSection;
