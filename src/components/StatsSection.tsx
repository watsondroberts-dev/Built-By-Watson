import { motion } from 'motion/react';
import { TrendingUp, Search, BarChart3, Target } from 'lucide-react';

interface StatsSectionProps {
  setTab: (tab: 'home' | 'about' | 'contact') => void;
}

const STATS_CARDS = [
  {
    stat: '90%',
    label: 'Local Intent Searches',
    description: 'Of homeowners turn to Google Search first when they need an immediate home repair, inspection, or improvement project.',
    icon: Search,
    highlightColor: 'text-[#4c8dff]',
    bgColor: 'bg-[#4c8dff]/10',
  },
  {
    stat: '14.2%',
    label: 'Lead Conversion Rate',
    description: 'High-intent Google Search traffic converts at up to 7x higher rates than passive social media scroll ads.',
    icon: TrendingUp,
    highlightColor: 'text-green-600',
    bgColor: 'bg-green-500/10',
  },
  {
    stat: '4.5x+',
    label: 'Average ROAS Return',
    description: 'Home service companies running hyper-targeted search ads generate an average of $4.50+ for every $1 invested.',
    icon: BarChart3,
    highlightColor: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
  },
  {
    stat: '89%',
    label: 'Top Spot Search Clicks',
    description: 'Of active homeowners click on top-ranked Google Search ads first when experiencing urgent home repair or remodeling needs.',
    icon: Target,
    highlightColor: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
  },
];

export default function StatsSection({ setTab: _setTab }: StatsSectionProps) {
  return (
    <section className="py-24 bg-slate-900 text-white border-b border-slate-800 overflow-hidden" id="google-ads-stats-section">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* Section Header with Ultra-Smooth Upward Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-16 border-b border-slate-800 pb-8"
        >
          <span className="font-mono text-xs uppercase text-[#4c8dff] font-bold tracking-widest block mb-2">
            Industry Benchmarks & Impact
          </span>
          <h2 className="font-display-lg text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tighter text-white">
            Why Google Search Ads Outperform Everything Else
          </h2>
          <p className="text-slate-300 text-sm md:text-base mt-3 leading-relaxed">
            When a homeowner's roof leaks or when they are ready for a major home renovation, they don't wait for a social media ad — they open Google and search.
          </p>
        </motion.div>

        {/* 4 Core Stat Cards with Smooth Staggered Vertical Elevation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS_CARDS.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
                className="bg-slate-800/70 rounded-2xl p-6 border border-slate-700/80 hover:border-[#4c8dff]/50 shadow-lg transition-all flex flex-col justify-between space-y-4 backdrop-blur-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 ${card.highlightColor}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="font-mono text-3xl lg:text-4xl font-black text-white tracking-tight mb-1.5">
                    {card.stat}
                  </div>

                  <h3 className="font-bold text-sm text-slate-100 font-sans mb-2">
                    {card.label}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
