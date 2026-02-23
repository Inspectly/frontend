import { Linkedin, Twitter, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  const mainLinks = [
    { label: "About Us", action: () => navigate("/about") },
    { label: "FAQ", action: () => navigate("/faq") },
    { label: "Contact", action: () => navigate("/contact") },
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
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Logo and description */}
          <div className="max-w-xs">
            <img src={logo} alt="InspectlyAI" className="h-12 w-auto mb-4" />
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
                    <button
                      onClick={link.action}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Account</h4>
              <ul className="space-y-2">
                {authLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm mb-3">Legal</h4>
              <ul className="space-y-2">
                {legalLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={link.action}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
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
        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} InspectlyAI. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ in Canada
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;