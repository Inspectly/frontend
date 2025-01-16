import {
  faCircleCheck,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";

interface Feature {
  text: string;
  isAvailable: boolean;
}

interface Plan {
  title: string;
  price: string;
  bgColor: string;
  textColor: string;
  priceTextColor: string;
  buttonBg: string;
  buttonTextColor: String;
  buttonHover: string;
  features: Feature[];
}

interface PriceProps {
  plans: Plan[];
}

const PriceSection: React.FC<PriceProps> = ({ plans }) => {
  const [isPriceInView, setIsPriceInView] = useState(false);

  const priceRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <section
      className="bg-top bg-no-repeat pt-8 pb-20 bg-[url('/images/intersect.svg')] w-full bg-contain"
      ref={priceRef}
    >
      <div className="container mx-auto sm:pt-16 sm:pb-4 px-4 md:px-8 xl:px-16 2xl:px-32">
        <div className="max-w-xl mx-auto mb-16 text-center">
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
        <div className="flex flex-wrap -mx-3">
          <div className="flex w-full md:w-1/2 lg:w-1/3 px-3 mb-6 justify-center items-center">
            <div className="lg:text-start text-center">
              <h3 className="mb-6 md:text-3xl text-2xl md:leading-normal leading-normal font-semibold">
                Enterprise Plan
              </h3>
              <p className="text-slate-400 max-w-xl mx-auto">
                Your favorite home inspection report assistant, designed for
                enterprises with cutting-edge AI.
              </p>
              <div className="mt-6">
                <a
                  href="page-pricing.html"
                  className="py-2 px-5 inline-block font-semibold tracking-wide border align-middle duration-500 text-base text-center bg-blue-400 hover:bg-blue-500 text-white rounded-md me-2 mt-2"
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
          {plans.map((plan, index) => (
            <div key={index} className="w-full md:w-1/2 lg:w-1/3 px-3 mb-6">
              <div
                className={`hover-up-5 pt-16 pb-8 px-4 text-center rounded shadow ${plan.bgColor}`}
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
                            size="lg"
                            className="text-green-400"
                          />
                        ) : (
                          <FontAwesomeIcon
                            icon={faCircleXmark}
                            size="lg"
                            className="text-red-400"
                          />
                        )}
                        <span className="ml-3">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <a
                    className={`block sm:inline-block py-4 px-6 mb-4 sm:mb-0 sm:mr-3 text-xs text-center font-semibold leading-none ${plan.buttonBg} ${plan.buttonHover} ${plan.buttonTextColor} rounded`}
                    href="#"
                  >
                    Order Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PriceSection;
