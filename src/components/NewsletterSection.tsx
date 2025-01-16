import React, { useEffect, useRef, useState } from "react";

const NewsletterSection = () => {
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true); // Trigger animation when section is in view
        }
      },
      { threshold: 0.1 }
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
      className="py-20 bg-top bg-no-repeat bg-[url('/images/blob.svg')]"
      ref={sectionRef}
    >
      <div className="container px-4 mx-auto">
        <div className="relative py-20 px-4 lg:p-20">
          <div className="max-w-lg mx-auto text-center">
            {/* Title */}
            <h2
              className={`mb-4 text-3xl lg:text-4xl font-bold font-heading transition-all duration-700 ${
                isInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <span>Subscribe now to </span>
              <span className="text-blue-500">Our Newsletter</span>
              <span> to stay updated.</span>
            </h2>

            {/* Subtitle */}
            <p
              className={`mb-8 text-gray-400 transition-all duration-700 delay-500 ${
                isInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              All your information is completely confidential
            </p>

            {/* Input Section */}
            <div
              className={`p-4 bg-white rounded-lg flex flex-wrap max-w-md mx-auto transition-all duration-700 delay-1000 ${
                isInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              <div className="flex w-full md:w-2/3 px-3 mb-3 md:mb-0 md:mr-6 bg-gray-100 rounded">
                <svg
                  className="h-6 w-6 my-auto text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
                <input
                  className="w-full pl-3 py-4 text-xs text-gray-400 font-semibold leading-none bg-gray-100 outline-none"
                  type="text"
                  placeholder="Type your e-mail"
                />
              </div>
              <button
                className="w-full md:w-auto py-4 px-8 text-xs text-white font-semibold leading-none bg-blue-400 hover:bg-blue-500 rounded"
                type="submit"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
