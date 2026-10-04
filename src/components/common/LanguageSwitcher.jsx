import { useState, useEffect, useRef } from "react";
import { Globe } from "lucide-react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" }
];

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Add Google Translate script if not exists
    if (!document.getElementById("google-translate-script")) {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element'
        );
      };

      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
      
      const style = document.createElement("style");
      style.innerHTML = `
        body { top: 0 !important; }
        .skiptranslate, .goog-te-banner-frame, #google_translate_element { display: none !important; }
        .goog-tooltip { display: none !important; }
        .goog-tooltip:hover { display: none !important; }
        .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
      `;
      document.head.appendChild(style);
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    if (code === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/;`;
    } else {
      document.cookie = `googtrans=/en/${code}; path=/`;
      document.cookie = `googtrans=/en/${code}; domain=${window.location.hostname}; path=/`;
    }
    window.location.reload();
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", marginRight: "16px", display: "flex", alignItems: "center" }}>
      <div id="google_translate_element" style={{ display: "none" }}></div>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center", padding: "8px", borderRadius: "50%" }}
        title="Change Language"
      >
        <Globe size={24} />
      </button>
      
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          right: 0,
          background: "var(--paper-1)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-3)",
          overflow: "hidden",
          zIndex: 100,
          minWidth: "120px"
        }}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                setIsOpen(false);
                changeLanguage(lang.code);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "10px 16px",
                background: "none",
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                color: "var(--text)",
                borderBottom: lang.code !== "bn" ? "1px solid var(--line)" : "none",
                fontFamily: "var(--font-body)",
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
