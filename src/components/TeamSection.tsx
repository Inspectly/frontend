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
  quote: string;
  name: string;
  position: string;
}

interface TeamProps {
  team: TeamMember[];
}

const TeamSection: React.FC<TeamProps> = ({ team }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [shouldShowTooltip, setShouldShowTooltip] = useState<boolean[]>([]);
  const [tooltipPosition, setTooltipPosition] = useState({
    top: 0,
    left: 0,
  });
  const [currentIndex, setCurrentIndex] = useState(0); // Track current visible index
  const [cardsPerView, setCardsPerView] = useState(3); // Default to 3 cards for large screens
  const [isTeamInView, setIsTeamInView] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const teamRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = (
    index: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    setHoveredIndex(index);

    // Get the bounding rectangle of the card
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const tooltipTop = rect.top - rect.height + window.scrollY; // Below the card
    const tooltipLeft = rect.left + rect.width / 2; // Center horizontally

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
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

    if (containerWidth <= 736) {
      setCardsPerView(1); // For small screens
    } else if (containerWidth <= 1248) {
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

      const results = team.map((_, index) => {
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
    <section className="container pt-16 pb-20 mx-auto px-4">
      <div className="max-w-3xl mx-auto mb-12 text-center" ref={teamRef}>
        <div
          className={`transition-all duration-700 ${
            isTeamInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10"
          }`}
        >
          <h2 className="text-3xl md:text-4xl mt-2 mb-4 font-bold font-heading">
            Meet our <span className="text-blue-500">Awesome</span> Team
          </h2>
        </div>
        <div
          className={`transition-all duration-1000 delay-500 ${
            isTeamInView
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-10 "
          }`}
        >
          <p className="text-gray-400 leading-loose">
            Driven by passion and expertise, our team is dedicated to delivering
            excellence. Each member brings unique skills and innovative ideas,
            working together to achieve extraordinary results.
          </p>
        </div>
      </div>

      <div className="grid relative grid-cols-1 mt-8">
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
                <div className="lg:flex h-full lg:p-0 relative px-6 py-10 bg-white shadow-sm rounded-md border border-gray-100 hover:border-gray-200 hover:shadow-md scale-95">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-56 h-56 object-cover object-top lg:rounded-tr-none lg:rounded-br-none lg:rounded-tl-md lg:rounded-bl-md rounded-full mx-auto lg:mx-0"
                  />
                  <div className="pt-6 lg:p-6 text-center lg:text-start space-y-4">
                    <div>
                      <span className="block text-lg font-bold">
                        {member.name}
                      </span>
                      <span className="block text-blue-600 text-sm">
                        {member.position}
                      </span>
                    </div>

                    {/* Quote */}
                    <p
                      id={`quote-${index}`}
                      className="leading-6 text-gray-400 mb-5 text-sm mt-4 sm:line-clamp-3 max-w-xs mx-auto text-center lg:text-start before:content-['“'] after:content-['”']"
                      onMouseEnter={(event) => handleMouseEnter(index, event)}
                    >
                      {member.quote}
                    </p>

                    <div className="space-x-2">
                      <a
                        href="#"
                        className="inline-block px-1 text-blue-400 hover:text-blue-500"
                      >
                        <FontAwesomeIcon
                          icon={faFacebookF}
                          className="fa-lg "
                        />
                      </a>
                      <a
                        href="#"
                        className="inline-block px-1 text-blue-400 hover:text-blue-500"
                      >
                        <FontAwesomeIcon icon={faInstagram} className="fa-lg" />
                      </a>
                    </div>
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
    </section>
  );
};

export default TeamSection;
