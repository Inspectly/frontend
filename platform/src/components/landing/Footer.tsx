import { Linkedin, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  const mainLinks = [
    { label: "About Us", to: "/about" },
    { label: "FAQ", to: "/faqs" },
    { label: "Contact", to: "/contact" },
  ];

  const authLinks = [
    { label: "Log In", to: "/login" },
    { label: "Sign Up", to: "/signup" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms of Service", to: "/terms" },
  ];

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Logo and description */}
          <div className="max-w-xs">
            <Link to="/">
              <img src={logo} alt="Inspectly" className="h-12 w-auto mb-4" />
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              Connecting homeowners with trusted contractors.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-foreground flex items-center justify-center text-foreground hover:text-background transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-12 gap-y-6">
            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Company</h4>
              <ul className="space-y-2">
                {mainLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Account</h4>
              <ul className="space-y-2">
                {authLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Legal</h4>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-8 pt-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Inspectly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
