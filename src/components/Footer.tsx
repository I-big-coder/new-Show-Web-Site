import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const INFO_PAGES: Record<string, { title: string; content: string }> = {
  about: {
    title: 'About STEPZONE – Step Into Your Style',
    content:
      'Founded with a singular obsession for biomechanical comfort and architectural design, STEPZONE crafts performance running shoes, court sneakers, training footwear, and hand-burnished formal silhouettes tailored for Indian roads, studios, and boardrooms.',
  },
  contact: {
    title: 'Contact STEPZONE Concierge',
    content:
      'Headquarters: Floor 14, One BKC Tower, Bandra Kurla Complex, Mumbai 400051.\nCustomer Care: support@stepzone.in | Toll-Free: 1800-209-STEP (Mon–Sat, 9 AM – 8 PM IST).',
  },
  careers: {
    title: 'Careers at STEPZONE',
    content:
      'We are hiring Footwear Industrial Designers, Last Engineers, E-Commerce Technologists, and Retail Experience Leads across Mumbai and Bengaluru. Send your portfolio to careers@stepzone.in.',
  },
  shipping: {
    title: 'Shipping & Delivery Information',
    content:
      'Enjoy FREE Express Shipping across India on all orders above ₹1,999. Standard shipping is ₹149 for orders below ₹1,999. Metro orders arrive in 2–3 business days; rest of India in 3–5 business days via BlueDart & Delhivery Air.',
  },
  returns: {
    title: '7-Day Easy Return & Size Exchange Policy',
    content:
      'Unworn footwear in original packaging with tags intact can be exchanged for another UK size or returned within 7 days of delivery at zero reverse-pickup cost.',
  },
  refunds: {
    title: 'Refund Policy',
    content:
      'Prepaid Razorpay orders are refunded to the original payment source within 3–5 business days after quality inspection. COD refunds are processed via instant UPI or NEFT transfer.',
  },
  faq: {
    title: 'Frequently Asked Questions',
    content:
      '1. How do STEPZONE UK sizes fit? True to standard UK sizing (UK 6 to UK 12). Use the interactive Size Guide on any product page.\n2. Is Cash on Delivery available? Yes, COD is available across 19,000+ Indian PIN codes.\n3. Can I cancel my order? Yes, any order in Order Placed, Order Confirmed, or Processing status can be cancelled with 1 click from My Orders.',
  },
  privacy: {
    title: 'Privacy Policy',
    content:
      'STEPZONE protects your personal data with end-to-end TLS encryption, scrypt password hashing, and PCI-DSS compliant Razorpay tokenization. We never sell customer data to third parties.',
  },
  terms: {
    title: 'Terms & Conditions',
    content:
      'All product prices are inclusive of applicable packaging fees; 12% GST is itemized clearly at checkout. Limited Edition Archive drops are limited to 2 pairs per customer.',
  },
};

export const Footer: React.FC = () => {
  const { navigateTo, showToast } = useStore();
  const [activeInfoKey, setActiveInfoKey] = useState<string | null>(null);

  return (
    <footer className="bg-[#111111] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <span className="font-display text-3xl font-bold tracking-tight text-white block">
              STEPZONE
            </span>
            <p className="text-sm text-white/70 max-w-sm leading-relaxed">
              Step Into Your Style. Architectural performance footwear engineered for road
              runners, urban athletes, and modern minimalists across India.
            </p>
            <div className="flex items-center gap-3 text-xs text-white/60 pt-1">
              <span>Razorpay Verified</span>
              <span aria-hidden="true">·</span>
              <span>Cash on Delivery</span>
              <span aria-hidden="true">·</span>
              <span>7-Day Size Exchange</span>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('about')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('contact')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('careers')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Careers
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('admin')}
                  className="hover:text-[#FF5A1F] transition-colors text-white/60"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">
              Customer Support
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('track-order')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Track Order
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('shipping')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Shipping Information
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('returns')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Return Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('refunds')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Refund Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('faq')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  FAQ
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">
              Legal & Connect
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('privacy')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActiveInfoKey('terms')}
                  className="hover:text-[#FF5A1F] transition-colors"
                >
                  Terms and Conditions
                </button>
              </li>
              <li className="pt-2">
                <div className="flex items-center gap-4 text-xs font-semibold text-white/70">
                  <button
                    type="button"
                    onClick={() =>
                      showToast('Following @STEPZONE.IN on Instagram!', 'info')
                    }
                    className="hover:text-[#FF5A1F]"
                  >
                    Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Connected with STEPZONE on Facebook!', 'info')}
                    className="hover:text-[#FF5A1F]"
                  >
                    Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Subscribed to STEPZONE Run Lab on YouTube!', 'info')}
                    className="hover:text-[#FF5A1F]"
                  >
                    YouTube
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <p>© {new Date().getFullYear()} STEPZONE Footwear Pvt. Ltd. All rights reserved.</p>
          <p>Designed for Comfort, Performance & Everyday Street Style.</p>
        </div>
      </div>

      {/* Policy / Company Modal */}
      {activeInfoKey && INFO_PAGES[activeInfoKey] && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white text-[#111111] max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="font-display text-2xl font-bold uppercase">
                {INFO_PAGES[activeInfoKey].title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveInfoKey(null)}
                aria-label="Close modal"
                className="p-1.5 text-[#777777] hover:text-[#111111]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[#222222] whitespace-pre-line leading-relaxed">
              {INFO_PAGES[activeInfoKey].content}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveInfoKey(null)}
                className="px-4 py-2 bg-[#111111] text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
