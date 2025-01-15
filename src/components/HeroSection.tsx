import React, { useEffect, useState } from "react";

interface HeroProps {
  words: String[];
}

const HeroSection: React.FC<HeroProps> = ({ words }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

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
          <div className="max-w-3xl mx-auto mb-4 sm:mb-8">
            <h2 className="text-3xl lg:text-5xl lg:leading-normal mb-4 font-extrabold font-heading">
              Inspect <span className="text-blue-500">Smarter</span> <br />
              Buy <span className="text-blue-500">Better</span>
            </h2>
            <p className="text-gray-400 leading-relaxed min-h-20 sm:min-h-fit">
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
  );
};

export default HeroSection;
