
'use client'
import React, { useEffect, useState } from 'react';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Heart
} from 'lucide-react';

const Footer = () => {
  const [currentYear, setTimestamp] = useState(2025);

  useEffect(() => {
    setTimestamp(new Date().getFullYear());
  }, []);

  const legalLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Refund Policy', href: '#' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="bg-white border-t border-gray-200 w-full">
      {/* Social Media Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-medium">Follow Us:</span>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 bg-gray-100 hover:bg-black text-gray-600 hover:text-white rounded-full flex items-center justify-center transition-all duration-200"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* App Download Button */}
          <div>
            <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm font-medium">
              Download App
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
              <p className="flex items-center gap-1">
                © {currentYear} Vectra. Made with 
                <Heart className="w-4 h-4 text-red-600 fill-current" /> 
                for amazing customers.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {legalLinks.map((link, index) => (
                <React.Fragment key={link.label}>
                  <a 
                    href={link.href}
                    className="text-gray-600 hover:text-red-600 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                  {index < legalLinks.length - 1 && (
                    <span className="text-gray-300">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Secure payments:</span>
              <div className="flex gap-2">
                {['Visa', 'MC', 'PayPal', 'Apple Pay'].map((method) => (
                  <div 
                    key={method}
                    className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>🔒 SSL Secured</span>
              <span>📦 Free Shipping Over $50</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;