import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFacebookF,
  faInstagram,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { SectionRefs } from "../types";

interface HeaderProps {
  scrollToSection: (ref: React.RefObject<HTMLElement>, offset: number) => void;
  refs: SectionRefs;
}

const Header: React.FC<HeaderProps> = ({ scrollToSection, refs }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleMenuOptionClick = (
    section: React.RefObject<HTMLElement>,
    offset: number
  ) => {
    scrollToSection(section, offset);
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY >= 100) {
        if (!headerRef.current?.classList.contains("translate-y-0")) {
          headerRef.current?.classList.add("translate-y-[-100%]");
        }
        setTimeout(() => {
          headerRef.current?.classList.remove("translate-y-[-100%]");
          headerRef.current?.classList.add("translate-y-0");
          setIsSticky(true); // Trigger sticky header after scrolling 100px
        });
      } else {
        setIsSticky(false); // Remove sticky header when back to top
        headerRef.current?.classList.remove("translate-y-[-100%]");
        headerRef.current?.classList.remove("translate-y-0");
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Header */}
      <header
        ref={headerRef}
        className={`${
          isSticky
            ? "sticky top-0 z-50 bg-white shadow-md transition-transform duration-500 transform "
            : "relative bg-transparent "
        }`}
      >
        <div className="container mx-auto px-4 md:px-8 xl:px-16 2xl:px-32">
          <nav className="flex justify-between items-center py-3">
            {/* Logo */}
            <a
              onClick={() => scrollToSection(refs.heroRef, 0)}
              className="text-3xl font-semibold"
            >
              Inspectly
            </a>

            {/* Desktop Menu */}
            <ul className="hidden lg:flex lg:items-center lg:space-x-12 text-gray-600">
              <li className="py-4">
                <a
                  onClick={() => scrollToSection(refs.heroRef, 0)}
                  className="text-sm font-semibold hover:text-gray-500 cursor-pointer"
                >
                  Home
                </a>
              </li>
              <li className="py-4">
                <a
                  onClick={() => scrollToSection(refs.featuresRef, -50)}
                  className="text-sm font-semibold hover:text-gray-500 cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li className="py-4">
                <a
                  onClick={() => scrollToSection(refs.howItWorksRef, -10)}
                  className="text-sm font-semibold hover:text-gray-500 cursor-pointer"
                >
                  How It Works
                </a>
              </li>
              <li className="py-4">
                <a
                  onClick={() => scrollToSection(refs.teamRef, -50)}
                  className="text-sm font-semibold hover:text-gray-500 cursor-pointer"
                >
                  The Team
                </a>
              </li>
              <li className="py-4">
                <a
                  onClick={() => scrollToSection(refs.plansRef, -20)}
                  className="text-sm font-semibold hover:text-gray-500 cursor-pointer"
                >
                  Plans
                </a>
              </li>
              <li className="py-4">
                <a
                  onClick={() => scrollToSection(refs.faqsRef, -80)}
                  className="text-sm font-semibold hover:text-gray-500 cursor-pointer"
                >
                  FAQs
                </a>
              </li>
            </ul>

            {/* Buttons */}
            <div className="hidden lg:flex space-x-4">
              <a className="py-2 px-4 text-sm font-semibold text-white bg-blue-400 hover:bg-blue-500 rounded-lg transform transition hover:-translate-y-1 hover:shadow-lg">
                Log In
              </a>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="py-2 px-3 text-blue-500 hover:text-blue-700 rounded border border-blue-300 hover:border-blue-400"
              >
                <svg
                  className="fill-current h-4 w-4"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Mobile menu</title>
                  <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
                </svg>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu (Slide-in from the Left) */}
      <div
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      <div
        className={`fixed top-0 left-0 z-50 h-full w-5/6 max-w-sm bg-white border-r overflow-y-auto shadow-lg transform transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="py-6 px-6">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between mb-8">
            <a
              onClick={() => handleMenuOptionClick(refs.heroRef, 0)}
              className="mr-auto text-3xl font-semibold"
            >
              Inspectly
            </a>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-blue-500"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Menu Links */}
          <ul className="space-y-1">
            <li className="menu-item-has-children">
              <a
                onClick={() => handleMenuOptionClick(refs.heroRef, 0)}
                className="block p-4 text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer"
              >
                Home
              </a>
            </li>
            <li>
              <a
                onClick={() => handleMenuOptionClick(refs.featuresRef, -50)}
                className="block p-4 text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer"
              >
                Features
              </a>
            </li>
            <li>
              <a
                onClick={() => handleMenuOptionClick(refs.howItWorksRef, -10)}
                className="block p-4 text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer"
              >
                How It Works
              </a>
            </li>
            <li>
              <a
                onClick={() => handleMenuOptionClick(refs.teamRef, -50)}
                className="block p-4 text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer"
              >
                The Team
              </a>
            </li>
            <li>
              <a
                onClick={() => handleMenuOptionClick(refs.plansRef, -20)}
                className="block p-4 text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer"
              >
                Plans
              </a>
            </li>
            <li>
              <a
                onClick={() => handleMenuOptionClick(refs.faqsRef, -80)}
                className="block p-4 text-sm text-gray-500 hover:bg-blue-50 hover:text-blue-700 rounded-xl cursor-pointer"
              >
                FAQs
              </a>
            </li>
          </ul>

          {/* Signup and Login Buttons */}
          <div className="mt-4 pt-6 border-t border-gray-100">
            <a className="block px-4 py-3 mb-3 text-xs text-center font-semibold leading-none bg-blue-400 hover:bg-blue-500 text-white rounded">
              Log In
            </a>
          </div>

          {/* Footer with Social Links */}
          <div className="mt-auto">
            <p className="my-4 text-xs text-gray-400">
              <span>Get in Touch </span>
              <a className="text-blue-400 hover:text-blue-500 underline">
                inspectlyai@gmail.com
              </a>
            </p>
            <div className="flex space-x-2">
              <a className="inline-block px-1 text-blue-400 hover:text-blue-500">
                <FontAwesomeIcon icon={faFacebookF} className="fa-lg " />
              </a>
              <a className="inline-block px-1 text-blue-400 hover:text-blue-500">
                <FontAwesomeIcon icon={faTwitter} className="fa-lg" />
              </a>
              <a className="inline-block px-1 text-blue-400 hover:text-blue-500">
                <FontAwesomeIcon icon={faInstagram} className="fa-lg" />
              </a>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default Header;
