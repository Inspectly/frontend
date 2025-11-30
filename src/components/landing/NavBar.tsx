import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface NavBarProps {
  onScrollToSection: (sectionId: string) => void;
}

const NavBar: React.FC<NavBarProps> = ({ onScrollToSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "features", label: "Product" },
    { id: "how-it-works", label: "How it works" },
    { id: "faq", label: "FAQ" },
  ];

  const handleNavClick = (sectionId: string) => {
    onScrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              onClick={() => handleNavClick("hero")}
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-900 via-green-600 to-blue-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Inspectly
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200 text-sm lg:text-base"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick("waitlist")}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-900 via-green-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm lg:text-base"
            >
              Join waitlist
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-gray-900 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4 border-t border-gray-200 mt-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className="block w-full text-left px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => handleNavClick("waitlist")}
              className="block w-full text-left px-4 py-2.5 bg-gradient-to-r from-blue-900 via-green-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Join waitlist
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;





