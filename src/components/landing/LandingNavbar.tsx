import { useState } from "react";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: "Home", href: "/#hero" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Features", href: "/#features" },
    { label: "Testimonials", href: "/#testimonials" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname === "/" && href.startsWith("/#")) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      setIsOpen(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <nav className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <img src={logo} alt="InspectlyAI" className="h-12 w-auto" />
          </a>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors duration-200 relative group"
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Log In
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              size="sm"
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-5 font-medium"
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-up">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-sm font-medium py-3 px-2 rounded-lg transition-colors"
                  onClick={(e) => handleNavClick(e, link.href)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-gray-600"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  className="bg-gray-900 text-white hover:bg-gray-800 rounded-full"
                  onClick={() => navigate("/signup")}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default LandingNavbar;
