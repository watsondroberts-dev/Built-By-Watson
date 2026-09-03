import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface TopNavBarProps {
  currentTab: 'home' | 'about' | 'contact';
  setTab: (tab: 'home' | 'about' | 'contact') => void;
}

export default function TopNavBar({ currentTab, setTab }: TopNavBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tabs: { id: 'home' | 'about' | 'contact'; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleTabClick = (tabId: 'home' | 'about' | 'contact') => {
    setTab(tabId);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/30 fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto h-full">
        {/* Logo */}
        <button 
          onClick={() => handleTabClick('home')}
          className="text-headline-md font-headline-md font-bold tracking-tight text-primary hover:opacity-80 transition-opacity cursor-pointer bg-transparent border-none p-0 flex items-center"
          id="nav-logo"
        >
          Built By Watson
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-10">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`text-label-md font-label-md transition-all duration-200 cursor-pointer bg-transparent border-none py-1 relative ${
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-secondary hover:text-on-tertiary-container'
                }`}
                id={`nav-desktop-${tab.id}`}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-primary p-2 focus:outline-none bg-transparent border-none cursor-pointer flex items-center justify-center"
          aria-label="Toggle Menu"
          id="nav-mobile-toggle"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden fixed top-20 left-0 right-0 bg-surface border-b border-outline-variant shadow-lg animate-fade-in z-40 bg-opacity-95 backdrop-blur-md">
          <nav className="flex flex-col py-6 px-margin-mobile gap-4">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`text-left py-3 px-4 rounded-lg font-label-md transition-all duration-200 cursor-pointer border-none ${
                    isActive
                      ? 'bg-surface-container font-semibold text-primary'
                      : 'bg-transparent text-secondary hover:bg-surface-container-low hover:text-primary'
                  }`}
                  id={`nav-mobile-${tab.id}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
