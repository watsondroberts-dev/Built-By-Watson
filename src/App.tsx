/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TopNavBar from './components/TopNavBar';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import AboutView from './components/AboutView';
import ContactView from './components/ContactView';
import { updatePageSeo } from './seo';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'about' | 'contact'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#about') return 'about';
      if (hash === '#contact') return 'contact';
    }
    return 'home';
  });

  // Keep SEO Title, Meta Descriptions, and Canonical links synchronized dynamically
  useEffect(() => {
    updatePageSeo(currentTab);
    
    // Update hash for deep linking without reload
    const targetHash = currentTab === 'home' ? '' : `#${currentTab}`;
    if (window.location.hash !== targetHash) {
      const newUrl = targetHash 
        ? `${window.location.pathname}${window.location.search}${targetHash}`
        : `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [currentTab]);

  // Listen to browser back/forward or external anchor clicks
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#about') setCurrentTab('about');
      else if (hash === '#contact') setCurrentTab('contact');
      else if (hash === '' || hash === '#home') setCurrentTab('home');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'home':
        return <HomeView setTab={setCurrentTab} />;
      case 'about':
        return <AboutView setTab={setCurrentTab} />;
      case 'contact':
        return <ContactView />;
      default:
        return <HomeView setTab={setCurrentTab} />;
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col antialiased selection:bg-[#4c8dff]/20 selection:text-primary">
      {/* Dynamic Header Nav Bar */}
      <TopNavBar currentTab={currentTab} setTab={setCurrentTab} />

      {/* Main Container with smooth page transitions */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Consistent Dark Brand Footer */}
      <Footer setTab={setCurrentTab} />
    </div>
  );
}

