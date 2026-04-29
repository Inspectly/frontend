import React, { useState, useRef, useEffect } from "react";

interface Faq {
  question: string;
  answer: string;
}

interface FaqProps {
  faqs: Faq[];
}

const FaqSection: React.FC<FaqProps> = ({ faqs }) => {
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true); // Trigger animation when section is in view
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section
      className="mt-20 pt-12 pb-20 bg-top bg-no-repeat bg-gray-50"
      style={{
        backgroundImage: "url('assets/imgs/backgrounds/intersect.svg')",
      }}
      ref={sectionRef}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* FAQ Title with animation */}
          <h3
            className={`mb-8 text-4xl font-bold text-center transition-all duration-700 ${
              isInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            FAQs
          </h3>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`transition-all duration-700 delay-500 ${
                  isInView
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left font-bold border-b border-gray-200 py-3 flex justify-between items-center"
                >
                  {faq.question}
                </button>
                {/* {openIndex === index && ( */}
                <div className="text-gray-700 text-sm mt-2">{faq.answer}</div>
                {/* )} */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
