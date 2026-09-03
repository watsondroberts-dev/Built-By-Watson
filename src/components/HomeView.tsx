import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, ChevronDown, CheckCircle2, Search, Smartphone, Monitor } from 'lucide-react';
import { SEARCH_ADS } from '../data';
import RoiCalculatorSection from './RoiCalculatorSection';
import StatsSection from './StatsSection';
// @ts-ignore
import HERO_BACKGROUND_IMG from '../assets/images/office_laptop_ads_1781573622045.jpg';

interface HomeViewProps {
  setTab: (tab: 'home' | 'about' | 'contact') => void;
}

export default function HomeView({ setTab }: HomeViewProps) {
  // Toggle states for the interactive Google Ad simulator
  const [activeAdId, setActiveAdId] = useState<string>('bell-roofing');
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  const scrollToPortfolio = () => {
    const portfolioSection = document.getElementById('search-ads-showcase');
    if (portfolioSection) {
      portfolioSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const selectedAd = SEARCH_ADS.find(ad => ad.id === activeAdId) || SEARCH_ADS[0];

  return (
    <div id="home-view" className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-start overflow-hidden">
        {/* Background Image / Underlay */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Built By Watson professional workspace"
            className="w-full h-full object-cover select-none pointer-events-none"
            src={HERO_BACKGROUND_IMG}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-primary/80 backdrop-grayscale-[0.1]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full text-white">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-label-sm uppercase tracking-[0.25em] text-[#ffffff] mb-5"
            >
              ESTABLISHED IN 2023
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display-lg text-[40px] md:text-[56px] leading-[1.08] font-bold tracking-tight mb-6"
            >
              Built By Watson <br />
              <span className="text-[#ffffff] font-semibold opacity-95">Google Ads Management</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-body-lg font-body-lg text-primary-fixed-dim max-w-xl mb-10 leading-relaxed"
            >
              We engineer hyper-targeted, high-converting Google Ads campaigns for home service companies.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => setTab('contact')}
                className="text-white px-8 py-3.5 font-mono text-[13px] uppercase tracking-widest bg-[#4c8dff] border border-[#4c8dff] hover:bg-[#4c8dff]/90 transition-all text-center font-bold rounded cursor-pointer duration-200"
              >
                Book Now
              </button>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToPortfolio}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 hover:text-white flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer group transition-colors z-10"
        >
          <span className="font-mono text-label-sm uppercase tracking-widest text-[10px] select-none">LEARN MORE</span>
          <ChevronDown className="h-5 w-5 animate-bounce group-hover:translate-y-1 transition-transform" />
        </button>
      </section>

      {/* Google Ads Benefits & Industry Statistics Section (High-Contrast Proof Band) */}
      <StatsSection setTab={setTab} />

      {/* Live Google Search Ads Showcase */}
      <section className="py-24 bg-surface-container-lowest border-b border-outline-variant/20" id="search-ads-showcase">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 border-b border-outline-variant/30 pb-8 gap-4">
            <div>
              <span className="font-mono text-xs uppercase text-[#4c8dff] font-bold tracking-widest block mb-2">Live Examples</span>
              <h2 className="font-display-lg text-headline-lg lg:text-3xl font-bold uppercase tracking-tighter text-primary">
                Google Search Ad Showcase
              </h2>
            </div>

            {/* Selector bar */}
            <div className="flex flex-wrap gap-2 pt-4 lg:pt-0">
              {SEARCH_ADS.map((ad) => (
                <button
                  key={ad.id}
                  onClick={() => setActiveAdId(ad.id)}
                  className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all border cursor-pointer ${
                    activeAdId === ad.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-secondary border-outline-variant/50 hover:border-primary/30'
                  }`}
                >
                  {ad.companyName}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Device Simulation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Ad Information & Highlights */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-outline-variant/30 p-6 space-y-4 shadow-sm">
                <h3 className="text-xl font-bold text-primary font-sans">
                  {selectedAd.companyName}
                </h3>
                <div className="text-xs text-secondary space-y-2.5">
                  <p>
                    <strong className="text-primary">Industry:</strong> {selectedAd.industry}
                  </p>
                  <p>
                    <strong className="text-primary">Regional Targets:</strong> {selectedAd.location}
                  </p>
                  <p>
                    <strong className="text-primary">Active Search Query:</strong> <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-primary">"{selectedAd.query}"</span>
                  </p>
                </div>

              </div>

              {/* Strategy Card */}
              <div className="bg-slate-50 rounded-xl border border-outline-variant/20 p-6 space-y-3">
                <h4 className="text-xs uppercase font-mono font-bold text-primary">Campaign Performance Mechanics</h4>
                <ul className="text-xs text-secondary space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span><strong>100% Mobile Optimized:</strong> Over 82% of emergency localized roofing services start on a smartphone search.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span><strong>Negative Keyword Shielding:</strong> Prevents wasting your ad spend on irrelevant searchers or DIY inquiries.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                    <span><strong>High Quality Score Structures:</strong> Maximizes ad relevance to secure lower bid-costs.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Beautiful CSS Google Ad Simulator */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Simulator Controls */}
              <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg border border-outline-variant/30">
                <span className="text-xs font-mono font-bold text-secondary px-2">Preview Mode:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('mobile')}
                    className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      viewMode === 'mobile'
                        ? 'bg-white text-[#4c8dff] shadow-sm'
                        : 'text-secondary hover:text-primary bg-transparent'
                    }`}
                  >
                    <Smartphone className="h-4 w-4" /> Mobile
                  </button>
                  <button
                    onClick={() => setViewMode('desktop')}
                    className={`p-2 rounded-md transition-all border-none cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                      viewMode === 'desktop'
                        ? 'bg-white text-[#4c8dff] shadow-sm'
                        : 'text-secondary hover:text-primary bg-transparent'
                    }`}
                  >
                    <Monitor className="h-4 w-4" /> Desktop
                  </button>
                </div>
              </div>

              {/* The Live Google Ad replica container */}
              <div className="bg-slate-100 rounded-xl p-4 md:p-8 border border-outline-variant/20 flex justify-center items-start transition-all">
                
                {/* Mobile Shell Simulation */}
                <div className={`bg-white transition-all duration-300 w-full ${
                  viewMode === 'mobile' 
                    ? 'max-w-[400px] rounded-3xl border-[8px] border-slate-800 p-4 shadow-xl' 
                    : 'rounded-xl border border-slate-300 p-6 shadow-sm'
                }`}>
                  
                  {/* Google search header simulation */}
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[#4c8dff]">
                      <Search className="h-3 w-3" />
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full h-8 px-4 flex items-center text-xs font-mono text-primary font-bold overflow-hidden whitespace-nowrap text-ellipsis border border-outline-variant/10 select-none">
                      {selectedAd.query}
                    </div>
                  </div>

                  {/* Sponsored Badge */}
                  <div className="flex items-center justify-between mb-1.5 select-none text-[12px]">
                    <div className="flex items-center gap-1">
                      <span className="font-sans font-black text-black">Sponsored</span>
                    </div>
                    <span className="text-slate-400">⋮</span>
                  </div>

                  {/* Ad Result Box */}
                  <div className="space-y-2">
                    
                    {/* Breadcrumbs / Website URL */}
                    <div className="flex items-center gap-1 text-[11px] leading-tight text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{selectedAd.companyName}</span>
                      <span>·</span>
                      <span className="text-slate-500 font-mono tracking-tight">{selectedAd.displayUrl}</span>
                    </div>

                    {/* Google Blue Headlines */}
                    <h4 className={`text-slate-900 font-sans hover:underline cursor-pointer leading-tight font-medium ${
                      viewMode === 'mobile' ? 'text-lg' : 'text-xl font-normal'
                    }`}>
                      <a href={selectedAd.realCompanyUrl} target="_blank" rel="noopener noreferrer" className="text-[#1a0dab] inline">
                        {selectedAd.headline1} | {selectedAd.headline2} {selectedAd.headline3 && `| ${selectedAd.headline3}`}
                      </a>
                    </h4>

                    {/* Ad Description */}
                    <p className="text-slate-700 text-xs leading-relaxed font-sans">
                      {selectedAd.description1} {selectedAd.description2 && ` ${selectedAd.description2}`}
                    </p>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contractor ROI & Revenue Calculator Section */}
      <RoiCalculatorSection setTab={setTab} />

      {/* CTA Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay max-h-[350px]">
          <div className="absolute inset-0 bg-gradient-to-b from-surface-container-low via-transparent to-transparent" />
        </div>
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center relative z-10">
          <h2 className="font-display-lg text-3xl md:text-display-lg font-bold mb-6 tracking-tight text-primary">
            Ready to Dominate Your Local Market?
          </h2>
          <p className="text-on-surface-variant font-body-lg text-body-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop losing premium home improvement jobs to rivals. Get set up with custom, strategic Google Search campaigns routed to your exact target zones.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTab('contact')}
            className="inline-flex items-center gap-2 text-white px-8 py-3.5 font-mono text-[13px] font-bold uppercase tracking-widest bg-[#4c8dff] border border-[#4c8dff] hover:bg-[#4c8dff]/90 transition-all rounded shadow-md cursor-pointer duration-200"
          >
            Book Now
            <ArrowUpRight className="h-4 w-4" />
          </motion.button>
        </div>
      </section>
    </div>
  );
}
