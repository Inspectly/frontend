import React, { useEffect, useRef, useState } from "react";
import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

interface Feature {
  text: string;
  isAvailable: boolean;
}

interface Plan {
  title: string;
  description: string;
  price: string;
  bgColor: string;
  textColor: string;
  priceTextColor: string;
  buttonBg: string;
  buttonTextColor: string;
  buttonHover: string;
  features: Feature[];
}

interface PriceProps {
  plans: Plan[];
}

const PriceSection: React.FC<PriceProps> = ({ plans }) => {
  const navigate = useNavigate();

  const [isPriceInView, setIsPriceInView] = useState(false);
  const [hasAnimatedEnterprise, setHasAnimatedEnterprise] = useState(false);
  const [hasAnimatedCards, setHasAnimatedCards] = useState(false);

  const priceRef = useRef<HTMLDivElement | null>(null);

  const enterpriseRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPriceInView(entry.isIntersecting); // Set to true when in view
      },
      { threshold: 0.1 } // Trigger when 10% of the section is visible
    );

    if (priceRef.current) {
      observer.observe(priceRef.current);
    }

    return () => {
      if (priceRef.current) {
        observer.unobserve(priceRef.current);
      }
    };
  }, [isPriceInView]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedEnterprise) {
          setHasAnimatedEnterprise(true); // Trigger animation once
        }
      },
      { threshold: 0.1 }
    );

    if (enterpriseRef.current) {
      observer.observe(enterpriseRef.current);
    }

    return () => {
      if (enterpriseRef.current) {
        observer.unobserve(enterpriseRef.current);
      }
    };
  }, [hasAnimatedEnterprise]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedCards) {
          setHasAnimatedCards(true); // Trigger animation once
        }
      },
      { threshold: 0.1 }
    );

    if (cardsRef.current) {
      observer.observe(cardsRef.current);
    }

    return () => {
      if (cardsRef.current) {
        observer.unobserve(cardsRef.current);
      }
    };
  }, [hasAnimatedCards]);

  return (
    <section className="bg-top bg-no-repeat pt-8 pb-20 bg-[url('/images/intersect.svg')] xl:bg-contain">
      <div className="container mx-auto sm:pt-16 sm:pb-4 px-4 md:px-8 xl:px-16 2xl:px-32">
        <div className="max-w-xl mx-auto mb-16 text-center" ref={priceRef}>
          <div
            className={`transition-all duration-700 ${
              isPriceInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <h2 className="text-3xl md:text-4xl mt-2 mb-4 font-bold font-heading">
              Start saving time today and{" "}
              <span className="text-blue-500">choose</span> your best plan
            </h2>
          </div>
          <div
            className={`transition-all duration-1000 delay-500 ${
              isPriceInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-10"
            }`}
          >
            <p className="text-gray-400 leading-loose">
              Experience seamless inspections with flexible pricing tailored to
              your needs. No hidden fees, just reliable value for homebuyers and
              professionals alike.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap -mx-3" ref={cardsRef}>
          {/* Price Cards */}
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`w-full lg:w-1/3 md:w-1/2 px-3 mb-6 transition-all duration-700 
               ${
                 hasAnimatedCards
                   ? "opacity-100 translate-y-0"
                   : "opacity-0 translate-y-40"
               }`}
              style={{
                transition: "transform 1s ease, opacity 1s ease",
                transitionDelay: `${index * 0.2}s`,
              }}
            >
              <div
                className={`hover:-translate-y-2 hover:shadow-lg transition duration-300 transform pt-16 pb-8 px-4 text-center rounded shadow ${plan.bgColor}`}
                style={{ willChange: "transform" }} // Optimize for hover effects
              >
                <img
                  className="h-20 mb-6 mx-auto"
                  src={`images/${plan.title.toLowerCase()}.svg`}
                  alt={plan.title}
                />
                <h3 className="mb-4 text-4xl font-bold font-heading">
                  {plan.title}
                </h3>
                <span
                  className={`text-4xl font-bold font-heading ${plan.priceTextColor}`}
                >
                  ${plan.price}
                </span>
                <div className="flex flex-col items-center mt-12 mb-8">
                  <div className={plan.textColor}>
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center mb-3">
                        {feature.isAvailable ? (
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="text-green-400 w-5 h-5"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faCircleXmark}
                            className="text-red-400 w-5 h-5"
                          />
                        )}
                        <span className="ml-3">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    className={`block sm:inline-block py-4 px-6 mb-4 sm:mb-0 sm:mr-3 text-xs text-center font-semibold leading-none ${plan.buttonBg} ${plan.buttonHover} ${plan.buttonTextColor} rounded`}
                    onClick={() =>
                      navigate("/login", { state: { selectedPlan: plan } })
                    }
                    style={{ transition: "all 0.3s ease" }} // Add a smooth transition
                  >
                    Order Now
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Enterprise Plan */}
          <div
            ref={enterpriseRef}
            className={`flex w-full lg:w-1/3 px-3 mb-6 justify-center items-center transition-all duration-1000 ${
              hasAnimatedEnterprise
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-20"
            }`}
          >
            <div className="lg:text-center text-center">
              <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">
                Enterprise Plan
              </h3>
              <p className="text-slate-400 max-w-xl mx-auto">
                Your favorite home inspection report assistant, designed for
                enterprises with cutting-edge AI.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate("/login")}
                  className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-400 hover:bg-blue-500 text-white rounded-md me-2 mt-2"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PriceSection;
