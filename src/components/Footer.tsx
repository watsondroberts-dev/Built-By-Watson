interface FooterProps {
  setTab: (tab: 'home' | 'about' | 'contact') => void;
}

export default function Footer({ setTab }: FooterProps) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();

  const handleLinkClick = (tab: 'home' | 'about' | 'contact') => {
    setTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-on-primary-fixed border-t border-outline-variant/30 py-12 text-surface-container-lowest" id="app-footer">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto gap-8">
        <div className="flex flex-col items-center md:items-start gap-1">
          <button
            onClick={() => handleLinkClick('home')}
            className="text-label-md font-label-md font-bold text-surface-container-lowest uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity"
            id="footer-logo"
          >
            Built By Watson
          </button>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
          <div className="flex gap-8">
            <button
              onClick={() => handleLinkClick('home')}
              className="text-label-sm font-label-sm uppercase tracking-wider text-secondary-fixed-dim hover:text-white bg-transparent border-none cursor-pointer transition-colors"
              id="footer-nav-home"
            >
              Home
            </button>
            <button
              onClick={() => handleLinkClick('about')}
              className="text-label-sm font-label-sm uppercase tracking-wider text-secondary-fixed-dim hover:text-white bg-transparent border-none cursor-pointer transition-colors"
              id="footer-nav-about"
            >
              About
            </button>
            <button
              onClick={() => handleLinkClick('contact')}
              className="text-label-sm font-label-sm uppercase tracking-wider text-secondary-fixed-dim hover:text-white bg-transparent border-none cursor-pointer transition-colors"
              id="footer-nav-contact"
            >
              Contact
            </button>
          </div>
          
          <div className="text-body-md font-body-md text-secondary-fixed-dim/50" id="footer-copyright">
            © {year} Built By Watson
          </div>
        </div>
      </div>
    </footer>
  );
}
