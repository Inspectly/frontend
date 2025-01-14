import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faLightbulb,
  faEye,
  faClipboard,
  faCreditCard,
  faSmile,
} from "@fortawesome/free-regular-svg-icons";

const Home: React.FC = () => {
  const words = ["accelerated", "accurate", "intelligent"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false); // Tracks if the animation is paused
  const [isFeatureTitleInView, setIsFeatureTitleInView] = useState(false);
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const featuresRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]); // Refs for each card

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

  useEffect(() => {
    let typingInterval: ReturnType<typeof setTimeout>;
    let cursorInterval: ReturnType<typeof setInterval>;

    const currentWord = words[currentWordIndex];

    if (isPaused) {
      // Skip typing/deleting logic while paused
      return;
    }

    // Typing or deleting logic
    if (!isDeleting) {
      typingInterval = setTimeout(() => {
        setDisplayedText(currentWord.slice(0, displayedText.length + 1));
        if (displayedText.length + 1 === currentWord.length) {
          setIsDeleting(true);
          setIsPaused(true); // Pause after finishing the word
          setTimeout(() => setIsPaused(false), 2000); // Wait 2 seconds before deleting
        }
      }, 250);
    } else {
      typingInterval = setTimeout(() => {
        setDisplayedText(currentWord.slice(0, displayedText.length - 1));
        if (displayedText.length - 1 === 0) {
          setIsDeleting(false);
          setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
          setTimeout(() => setIsPaused(false), 2000); // Wait 2 seconds before typing
        }
      }, 100);
    }

    // Cursor blinking logic
    cursorInterval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 250);

    return () => {
      clearTimeout(typingInterval);
      clearInterval(cursorInterval);
    };
  }, [displayedText, isDeleting, currentWordIndex, isPaused]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFeatureTitleInView(entry.isIntersecting); // Set to true when in view
      },
      { threshold: 0.2 } // Trigger when 20% of the section is visible
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(
            entry.target.getAttribute("data-index") || "0",
            10
          );

          if (entry.isIntersecting) {
            // Card is in view; add its index to `visibleCards`
            setVisibleCards((prev) => [...new Set([...prev, index])]);
          } else {
            // Card is out of view; remove its index to reset animation
            setVisibleCards((prev) => prev.filter((i) => i !== index));
          }
        });
      },
      { threshold: 0.1 } // Adjust threshold to trigger earlier or later
    );

    // Observe each card
    cardsRef.current.forEach((card, index) => {
      if (card) {
        card.setAttribute("data-index", index.toString());
        observer.observe(card);
      }
    });

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) observer.unobserve(card);
      });
    };
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="xl:bg-contain bg-top bg-no-repeat -mt-24 pt-24 bg-[url('/images/intersect.svg')]">
        <div className="container px-4 mx-auto">
          <div className="pt-16 text-center">
            <div className="max-w-3xl mx-auto mb-8">
              <h2 className="text-3xl lg:text-5xl lg:leading-normal mb-4 font-extrabold font-heading">
                Inspect <span className="text-blue-500">Smarter</span> <br />
                Buy <span className="text-blue-500">Better</span>
              </h2>
              <p className="text-gray-400 leading-relaxed">
                We are <strong className="text-blue-500">Inspectly</strong>, an{" "}
                <span className="text-blue-500">
                  {displayedText}
                  <span
                    className={`inline-block ${
                      cursorVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    |
                  </span>
                </span>{" "}
                AI Platform for Home Inspections and Buyer Confidence
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <a
                className="text-xs font-semibold btn-white py-4 px-8 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                href="#how-we-work"
              >
                Key Features
              </a>
              <a
                className="text-xs font-semibold btn-primary py-4 px-8 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                href="#key-features"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>

        <div className="relative max-w-6xl mt-16 md:mt-8 mb-8 mx-auto">
          <img src="images/pattern.png" alt="Pattern" />
          <div className="absolute top-[9%] left-[14%] w-[72%] h-[66%]">
            <img
              className="rounded animate-slideInThenBounce"
              src="images/dashboard.png"
              alt="Dashboard"
              style={{ animationDelay: "1s" }} // Delays animation by 1 seconds
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        ref={featuresRef}
        className="container pt-16 pb-20 mx-auto px-4 xl:px-32"
      >
        <div className="flex flex-wrap justify-center">
          <div className="flex flex-wrap items-center justify-center container px-4 mx-auto mb-12">
            {/* Heading */}
            <div
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
                Effortlessly enhance your home-buying journey. Seamlessly
                designed for clarity, confidence, and peace of mind in every
                decision. Navigate challenges with ease and precision.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className={`border border-gray-100 pt-8 px-6 pb-6 bg-white text-center rounded shadow hover:shadow-lg flex flex-col h-full ${
                visibleCards.includes(index)
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
    </>
  );
};

export default Home;
