import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Laptop, MousePointerClick, LineChart, Shield, Target, Zap } from 'lucide-react';
import { ETHOS_CARDS } from '../data';
// @ts-ignore
import ABOUT_TOOLBAR_IMG from '../assets/images/google_ads_toolbar_1781573636242.jpg';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
}

function AnimatedCounter({ target, duration = 1500, suffix = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number | null = null;
          
          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            setCount(Math.floor(easeProgress * target));
            
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(target);
            }
          };
          
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [target, duration]);

  return (
    <span ref={elementRef} className="inline-block">
      {count}{suffix}
    </span>
  );
}

interface AboutViewProps {
  setTab: (tab: 'home' | 'about' | 'contact') => void;
}

export default function AboutView({ setTab }: AboutViewProps) {
  // Map our dynamic icon names to actual components
  const iconMap: Record<string, any> = {
    Laptop: Laptop,
    MousePointerClick: MousePointerClick,
    LineChart: LineChart,
  };

  return (
    <div id="about-view" className="bg-background min-h-screen">
      {/* Hero Section / Architectural Background */}
      <section className="relative bg-on-primary-fixed pt-28 pb-16 md:pb-20 overflow-hidden text-white border-b border-white/5">
        <div className="absolute inset-0 opacity-15 overflow-hidden">
          <svg className="w-full h-full text-white/5" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-white font-display-lg text-[40px] md:text-display-lg leading-[1.1] mb-8 font-bold tracking-tight"
            >
              Strategic local lead generation for high-margin service enterprises.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-primary-fixed-dim/90 font-body-lg text-body-lg leading-relaxed max-w-2xl mx-auto"
            >
              We specialize in building precision Google Search campaigns exclusively for established home improvement, remodeling, and trade contractors. When your business operates on high-ticket contract values—such as roofing, HVAC, siding, windows, or custom remodeling—your economics are uniquely built for massive profitability. Closing just 1 or 2 additional jobs per month easily pays for your entire ad spend, turning search intent into exponential net returns.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Our Approach: Bento Grid */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-left mb-12 border-b border-slate-200/60 pb-6">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#4c8dff] mb-2 block">Our DNA</span>
            <h2 className="text-primary font-headline-lg text-3xl font-bold tracking-tight">The Digital Architect Ethos</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ETHOS_CARDS.map((card, idx) => {
              const IconComponent = iconMap[card.iconName] || Laptop;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="bg-white hover:bg-surface-container-low p-8 rounded-xl border border-outline-variant/30 transition-all duration-200 shadow-sm"
                >
                  <div className="p-3 bg-surface-container rounded-lg inline-block text-[#4c8dff] mb-6">
                    <IconComponent className="h-7 w-7" />
                  </div>
                  <h3 className="text-primary font-headline-md text-xl font-bold tracking-tight mb-3.5">
                    {card.title}
                  </h3>
                  <p className="text-on-surface-variant font-body-md text-secondary leading-relaxed">
                    {card.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Simplified About Section */}
      <section className="py-28 bg-surface-container-low border-y border-outline-variant/20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-primary font-headline-lg text-3xl font-bold tracking-tight mb-2">Built to Scale Nationwide</h2>
            
            <div className="space-y-6 text-on-surface-variant font-body-md text-secondary leading-relaxed max-w-2xl mx-auto">
              <p>
                Founded in Delray Beach, Florida and serving clients across the country, Built By Watson doesn’t build pretty websites or write fluffy blog posts. We do one thing: write and optimize aggressive Google Ads campaigns that force high-intent local homeowners to click, call, and book jobs.
              </p>
              <p>
                We work directly with roofing, siding, and home improvement companies who are tired of paying search agencies for generic "brand awareness" or vanity impressions. Your budget is treated as fuel to win market share, not an agency fee to fill monthly reports.
              </p>
            </div>

            {/* Counter details */}
            <div className="mt-10 flex flex-wrap justify-center gap-10">
              <div className="bg-white/80 p-5 rounded-xl border border-outline-variant/20 min-w-[150px]">
                <div className="text-[#4c8dff] font-sans text-3xl font-black tracking-tight" id="counter-partners">
                  <AnimatedCounter target={20} suffix="+" />
                </div>
                <div className="text-secondary font-mono text-[11px] uppercase tracking-wider font-bold mt-1">Active Partners</div>
              </div>
              <div className="bg-white/80 p-5 rounded-xl border border-outline-variant/20 min-w-[150px]">
                <div className="text-[#4c8dff] font-sans text-3xl font-black tracking-tight" id="counter-presence">
                  <AnimatedCounter target={3} suffix="+" />
                </div>
                <div className="text-secondary font-mono text-[11px] uppercase tracking-wider font-bold mt-1">Years of Scale</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background border-t border-slate-200/60">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <div className="max-w-2xl mx-auto">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-[#4c8dff] mb-2 block">
              Take The Next Step
            </span>
            <h2 className="text-primary font-display-lg text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
              Ready to scale your local business?
            </h2>
            <p className="text-secondary text-sm md:text-base leading-relaxed mb-8 max-w-xl mx-auto">
              Let's discuss the structural requirements and revenue strategy for your next high-converting Google Ads campaign.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setTab('contact')}
                className="bg-[#4c8dff] hover:bg-primary text-white border border-[#4c8dff] hover:border-primary px-8 py-3.5 font-mono text-[13px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all duration-200 shadow-sm"
              >
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
