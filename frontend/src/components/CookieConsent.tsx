// CookieConsent.tsx — Simple cookie consent banner (client-side only)
// Notes:
// - Stores user preference in localStorage under `cookie-consent`
// - Minimal compliance UI; update content to match actual cookie usage
import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Delay showing to not interrupt initial page load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 shadow-lg animate-slide-up">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Cookie className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p>
              We use cookies to enhance your experience, remember preferences, and analyze site traffic.
              By clicking "Accept", you consent to our use of cookies.{" "}
              <Link to="/privacy" className="text-green-400 hover:underline">
                Learn more
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
