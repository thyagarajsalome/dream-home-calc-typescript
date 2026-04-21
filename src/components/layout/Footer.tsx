// src/components/layout/Footer.tsx
import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer bg-white border-t border-gray-100 pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-start">
          
          {/* Column 1: Brand Info */}
          <div className="text-center md:text-left">
            <Link to="/" className="flex items-center justify-center md:justify-start gap-2 text-xl font-bold text-secondary mb-4">
              <img src="/bg-logo.png" alt="HDE Logo" className="w-10 h-10 object-contain" />
              <span className="text-primary uppercase tracking-tighter">HDE</span>
            </Link>
            <p className="text-gray-500 text-sm max-w-xs mx-auto md:mx-0">
              India's leading platform for construction cost estimation, material BOQ reports, and modern architectural house planning.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-center">
            <h4 className="font-bold text-gray-800 mb-4 uppercase text-xs tracking-widest">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="text-gray-500 hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/disclaimer" className="text-gray-500 hover:text-primary transition-colors">Disclaimer</Link></li>
              <li><Link to="/privacy" className="text-gray-500 hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-500 hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Column 3: Play Store Apps */}
          <div className="text-center md:text-right flex flex-col items-center md:items-end">
            <h4 className="font-bold text-gray-800 mb-4 uppercase text-xs tracking-widest">Get Our Mobile Apps</h4>
            <div className="flex flex-col gap-3">
              {/* App 1: HDE Construction */}
              <a 
                href="https://play.google.com/store/apps/details?id=in.toolwebsite.twa" 
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black transition-all border border-gray-700 w-56"
              >
                <i className="fab fa-google-play text-2xl text-primary"></i>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-gray-400 leading-none">Get it on</p>
                  <p className="text-sm font-bold">HDE Construction</p>
                </div>
              </a>
              
              {/* App 2: AI Home Decorator */}
              <a 
                href="https://play.google.com/store/apps/details?id=com.aihomedecorator.twa&pcampaignid=web_share" 
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-black transition-all border border-gray-700 w-56"
              >
                <i className="fab fa-google-play text-2xl text-green-400"></i>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold text-gray-400 leading-none">Download Now</p>
                  <p className="text-sm font-bold">AI Home Decorator</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 text-center">
          <p className="text-gray-400 text-xs font-medium">
            &copy; 2025 Home Design English (HDE). All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}