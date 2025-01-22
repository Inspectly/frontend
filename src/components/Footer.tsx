import React from "react";
import {
  faFacebookF,
  faTwitter,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <footer className="py-20">
      <div className="container mx-auto px-4 md:px-8 xl:px-16 2xl:px-32">
        <div className="flex flex-wrap mb-12 lg:mb-20 -mx-3 text-center lg:text-left">
          {/* Logo Section */}
          <div className="w-full lg:w-1/5 px-3 mb-6 lg:mb-0">
            <a
              className="inline-block mx-auto lg:mx-0 text-3xl font-semibold leading-none"
              href="index.html"
            >
              Inspectly
            </a>
          </div>
          {/* Description Section */}
          <div className="w-full lg:w-2/5 px-3 mb-8 lg:mb-0">
            <p className="max-w-md mx-auto lg:max-w-full lg:mx-0 lg:pr-32 lg:text-lg text-gray-400 leading-relaxed">
              Empowering <strong>smarter</strong> home-buying decisions with
              cutting-edge insights.
            </p>
          </div>
          {/* Get Started Info */}
          <div className="w-full lg:w-1/5 px-3 mb-8 lg:mb-0">
            <p className="mb-2 lg:mb-4 lg:text-lg font-bold font-heading text-gray-800">
              Get Started
            </p>
            <p className="lg:text-lg text-gray-400">
              {" "}
              Ready to dive in?{" "}
              <a
                onClick={handleSignUp}
                className="text-blue-400 hover:underline cursor-pointer"
              >
                <br />
                Sign up now
              </a>
              .
            </p>
          </div>
          {/* Contact Info */}
          <div className="w-full lg:w-1/5 px-3">
            <p className="mb-2 lg:mb-4 lg:text-lg font-bold font-heading text-gray-800">
              Contacts
            </p>
            <p className="lg:text-lg text-gray-400">inspectlyai@gmail.com</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-center lg:justify-between">
          {/* Copyright */}
          <p className="text-sm text-gray-400">
            © 2025. All rights reserved. Designed by{" "}
            <a
              className="text-blue-400"
              href="https://www.inspectlyai.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              InspectlyAI.com
            </a>
          </p>
          {/* Social Media Links */}
          <div className="order-first lg:order-last -mx-2 mb-4 lg:mb-0">
            <a
              href="#"
              className="inline-block px-3 text-blue-400 hover:text-blue-500"
            >
              <FontAwesomeIcon icon={faFacebookF} className="fa-lg " />
            </a>
            <a
              href="#"
              className="inline-block px-3 text-blue-400 hover:text-blue-500"
            >
              <FontAwesomeIcon icon={faTwitter} className="fa-lg" />
            </a>
            <a
              href="#"
              className="inline-block px-3 text-blue-400 hover:text-blue-500"
            >
              <FontAwesomeIcon icon={faInstagram} className="fa-lg" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
