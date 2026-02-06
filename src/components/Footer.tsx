import { Linkedin, Twitter, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const mainLinks = [
    { label: "About Us", action: () => navigate("/signup") },
    { label: "FAQ", action: () => navigate("/signup") },
    { label: "Contact", action: () => navigate("/signup") },
  ];

  const authLinks = [
    { label: "Log In", action: () => navigate("/login") },
    { label: "Sign Up", action: () => navigate("/signup") },
  ];

  const legalLinks = [
    { label: "Privacy Policy", action: () => navigate("/signup") },
    { label: "Terms of Service", action: () => navigate("/signup") },
  ];

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 lg:px-8 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Logo and description */}
          <div className="max-w-xs">
            <img src={logo} alt="InspectlyAI" className="h-10 w-auto mb-4" />
            <p className="text-gray-600 text-sm mb-5">
              Connecting homeowners with trusted contractors.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-900 flex items-center justify-center text-gray-600 hover:text-white transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Company</h4>
              <ul className="space-y-3">
                {mainLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Account</h4>
              <ul className="space-y-3">
                {authLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-4">Legal</h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} InspectlyAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
