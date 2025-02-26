import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { faFacebookF, faInstagram } from "@fortawesome/free-brands-svg-icons";
import Tooltip from "./Tooltip";

interface TeamMember {
  image: string;
  name: string;
  company: string;
  quote: string;
}

interface TeamProps {
  team: TeamMember[];
}

const Realtors: React.FC<TeamProps> = ({ team }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [shouldShowTooltip, setShouldShowTooltip] = useState<boolean[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
  });
  const [currentIndex, setCurrentIndex] = useState(0); // Track current visible index
  const [cardsPerView, setCardsPerView] = useState(3); // Default to 3 cards for large screens
  const [isTeamInView, setIsTeamInView] = useState(false);
  const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = (
    index: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    // Clear any existing timeout to prevent multiple tooltips from appearing unexpectedly
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }

    // Delay showing tooltip
    const timeoutId = setTimeout(() => {
      setHoveredIndex(index);

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const tooltipTop = rect.top - rect.height + window.scrollY;
      const tooltipLeft = rect.left + rect.width / 2;

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
      setShouldShowTooltip((prev) => ({ ...prev, [index]: true }));
    }, 800); // **Tooltip delay**

    setTooltipTimeout(timeoutId);
  };

  const handleMouseLeave = (index: number) => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout); // Prevent tooltip from appearing
    }

    setHoveredIndex(null);
    setShouldShowTooltip((prev) => ({ ...prev, [index]: false }));
  };

  const startAutoSlide = () => {
    stopAutoSlide(); // Clear any existing auto-slide
    autoSlideRef.current = setInterval(() => {
      setHoveredIndex(null);
      setCurrentIndex((prevIndex) =>
        prevIndex < Math.max(team.length - cardsPerView, 0) ? prevIndex + 1 : 0
      );
    }, 3000); // Change slide every 3 seconds
  };

  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
  };

  const handleNext = () => {
    stopAutoSlide(); // Stop auto-slide
    setHoveredIndex(null);
    setCurrentIndex((prevIndex) =>
      prevIndex < Math.max(team.length - cardsPerView, 0) ? prevIndex + 1 : 0
    );
    delayTimeoutRef.current = setTimeout(() => {
      startAutoSlide(); // Restart auto-slide after 3 seconds
    }, 3000);
  };

  const handlePrev = () => {
    stopAutoSlide(); // Stop auto-slide
    setHoveredIndex(null);
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : Math.max(team.length - cardsPerView, 0)
    );
    delayTimeoutRef.current = setTimeout(() => {
      startAutoSlide(); // Restart auto-slide after 3 seconds
    }, 3000);
  };

  const handleResize = () => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;

    if (containerWidth <= 910) {
      setCardsPerView(1); // For small screens
    } else if (containerWidth <= 1174) {
      setCardsPerView(2); // For medium screens
    } else {
      setCardsPerView(3); // For large screens
    }
  };

  useEffect(() => {
    handleResize(); // Set initial cardsPerView
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Auto-translate logic
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    startAutoSlide(); // Start auto-slide on mount

    return () => {
      window.removeEventListener("resize", handleResize);
      stopAutoSlide(); // Clean up on unmount
    };
  }, [team]);

  useEffect(() => {
    // Check if descriptions exceed 3 lines
    const checkDescriptions = () => {
      if (window.innerWidth < 1024) {
        setShouldShowTooltip([false]);
        return;
      }

      const results = team.map((member, index) => {
        const el = document.getElementById(`quote-${index}`);
        if (el) {
          const lineHeight = parseFloat(
            window.getComputedStyle(el).lineHeight || "0"
          );
          const maxHeight = lineHeight * 3; // Height for 3 lines
          return el.scrollHeight > maxHeight;
        }
        return false;
      });
      setShouldShowTooltip(results);
    };

    checkDescriptions();
    window.addEventListener("resize", checkDescriptions); // Recalculate on resize

    return () => {
      window.removeEventListener("resize", checkDescriptions);
    };
  }, [team]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTeamInView(entry.isIntersecting); // Set to true when in view
      },
      { threshold: 0.1 } // Trigger when 10% of the section is visible
    );

    if (teamRef.current) {
      observer.observe(teamRef.current);
    }

    return () => {
      if (teamRef.current) {
        observer.unobserve(teamRef.current);
      }
    };
  }, [isTeamInView]);

  return (
    <>
      <div className="grid relative grid-cols-1">
        {/* Slideshow */}
        <div className="overflow-hidden" ref={containerRef}>
          <div
            className="flex transition-transform duration-500"
            style={{
              transform: `translateX(-${(currentIndex * 100) / cardsPerView}%)`,
            }}
          >
            {team.map((member, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full lg:w-1/2 2xl:w-1/3"
              >
                <div className="lg:flex h-full lg:h-56 lg:p-0 relative px-6 py-10 bg-white shadow-sm rounded-md border border-gray-100 hover:border-gray-200 hover:shadow-md scale-95">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-56 h-56 object-cover object-top lg:rounded-tr-none lg:rounded-br-none lg:rounded-tl-md lg:rounded-bl-md rounded-full mx-auto lg:mx-0"
                  />
                  <div className="space-x-2 absolute bottom-3 lg:left-2 left-[calc(50%-35px)]">
                    <a
                      href="#"
                      className="inline-block px-1 text-blue-400 hover:text-blue-500"
                    >
                      <FontAwesomeIcon icon={faFacebookF} className="fa-lg " />
                    </a>
                    <a
                      href="#"
                      className="inline-block px-1 text-blue-400 hover:text-blue-500"
                    >
                      <FontAwesomeIcon icon={faInstagram} className="fa-lg" />
                    </a>
                  </div>
                  <div className="pt-6 lg:p-6 text-center lg:text-start space-y-4">
                    <div>
                      <span className="block text-lg font-bold">
                        {member.name}
                      </span>
                      <span className="block text-blue-600 text-sm">
                        {member.company}
                      </span>
                    </div>

                    {/* Quote */}
                    <p
                      id={`quote-${index}`}
                      className="leading-6 text-gray-400 mb-5 text-sm mt-4 sm:line-clamp-3 max-w-xs mx-auto text-center lg:text-start before:content-['“'] after:content-['”']"
                      onMouseEnter={(event) => handleMouseEnter(index, event)}
                      onMouseLeave={() => handleMouseLeave(index)}
                    >
                      {member.quote}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hoveredIndex !== null && shouldShowTooltip[hoveredIndex] && (
            <Tooltip
              quote={team[hoveredIndex].quote}
              position={tooltipPosition}
              onClose={() => setHoveredIndex(null)}
            />
          )}
        </div>

        {/* Navigation Arrows */}
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
          <button
            onClick={handlePrev}
            className="absolute pointer-events-auto left-0 text-gray-500 hover:text-gray-700 shadow-md bg-white hover:bg-gray-50 py-1 px-3 rounded-full"
          >
            <FontAwesomeIcon icon={faChevronLeft} size="xs" />
          </button>
          <button
            onClick={handleNext}
            className="absolute pointer-events-auto right-0 text-gray-500 hover:text-gray-700 shadow-md bg-white hover:bg-gray-50 py-1 px-3 rounded-full"
          >
            <FontAwesomeIcon icon={faChevronRight} size="xs" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Realtors;
