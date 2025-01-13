import React, { useEffect, useState } from "react";

const Home: React.FC = () => {
  const words = ["accelerated", "accurate", "intelligent"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false); // Tracks if the animation is paused

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

  return (
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

      <div className="container px-4 mx-auto">
        <div className="flex flex-wrap justify-between pt-8 pb-16">
          {[
            { count: 132, text: "Annual Partner", icon: "user-group" },
            { count: "51k", text: "Completed Projects", icon: "archive" },
            { count: 442, text: "Happy Customers", icon: "smile" },
            { count: 281, text: "Research Work", icon: "light-bulb" },
          ].map((item, index) => (
            <div
              key={index}
              className={`hover-up-5 flex w-1/2 lg:w-auto py-4`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="flex justify-center items-center bg-gray-50 text-blue-500 rounded-xl h-12 w-12 sm:h-20 sm:w-20">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Add SVG path specific to your icons */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="..."
                  />
                </svg>
              </div>
              <div className="sm:py-2 ml-2 sm:ml-6">
                <span className="sm:text-2xl font-bold font-heading">+ </span>
                <span className="sm:text-2xl font-bold font-heading">
                  {item.count}
                </span>
                <p className="text-xs sm:text-base text-gray-400">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Home;
