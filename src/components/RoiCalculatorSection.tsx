import { useState, useId } from 'react';
import { motion } from 'motion/react';
import { Calculator, ArrowRight, TrendingUp, DollarSign, Target, CheckCircle2, RefreshCw } from 'lucide-react';

interface RoiCalculatorSectionProps {
  setTab: (tab: 'home' | 'about' | 'contact') => void;
}

interface TradePreset {
  id: string;
  name: string;
  avgJobValue: number;
  costPerLead: number;
  closeRate: number;
  defaultBudget: number;
}

const TRADE_PRESETS: TradePreset[] = [
  {
    id: 'roofing-remodel',
    name: 'Roofing & Major Remodel',
    avgJobValue: 12500,
    costPerLead: 65,
    closeRate: 20,
    defaultBudget: 3000,
  },
  {
    id: 'siding-windows',
    name: 'Siding, Windows & Doors',
    avgJobValue: 8500,
    costPerLead: 50,
    closeRate: 22,
    defaultBudget: 2500,
  },
  {
    id: 'hvac-plumbing',
    name: 'HVAC & Plumbing',
    avgJobValue: 4200,
    costPerLead: 35,
    closeRate: 25,
    defaultBudget: 2000,
  },
  {
    id: 'general-contracting',
    name: 'General Home Service',
    avgJobValue: 6000,
    costPerLead: 45,
    closeRate: 20,
    defaultBudget: 2500,
  },
];

export default function RoiCalculatorSection({ setTab }: RoiCalculatorSectionProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('roofing-remodel');
  const [monthlyBudget, setMonthlyBudget] = useState<number>(3000);
  const [costPerLead, setCostPerLead] = useState<number>(65);
  const [avgJobValue, setAvgJobValue] = useState<number>(12500);
  const [closeRate, setCloseRate] = useState<number>(20);

  const budgetInputId = useId();
  const jobValueInputId = useId();
  const cplInputId = useId();
  const closeRateInputId = useId();

  const handleSelectPreset = (preset: TradePreset) => {
    setSelectedPresetId(preset.id);
    setMonthlyBudget(preset.defaultBudget);
    setCostPerLead(preset.costPerLead);
    setAvgJobValue(preset.avgJobValue);
    setCloseRate(preset.closeRate);
  };

  // Calculations
  const estimatedLeads = Math.max(1, Math.round(monthlyBudget / (costPerLead || 1)));
  const estimatedJobsClosed = Math.round(estimatedLeads * (closeRate / 100) * 10) / 10;
  const grossRevenue = Math.round(estimatedJobsClosed * avgJobValue);
  const netProfit = grossRevenue - monthlyBudget;
  const roasMultiplier = monthlyBudget > 0 ? (grossRevenue / monthlyBudget).toFixed(1) : '0';
  const roiPercentage = monthlyBudget > 0 ? Math.round(((grossRevenue - monthlyBudget) / monthlyBudget) * 100) : 0;

  // Format currency helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="py-24 bg-white border-b border-outline-variant/20 overflow-hidden" id="roi-calculator-section">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        
        {/* Section Header with Upward Spring Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4c8dff]/10 text-[#4c8dff] font-mono text-xs font-bold uppercase tracking-widest mb-3">
            <Calculator className="h-3.5 w-3.5" />
            Revenue & Growth Estimator
          </div>
          <h2 className="font-display-lg text-headline-lg lg:text-3xl font-bold uppercase tracking-tighter text-primary">
            Contractor Revenue & ROI Calculator
          </h2>
          <p className="text-secondary text-sm md:text-base mt-2 leading-relaxed">
            See exactly how closing just a few high-intent Google Search leads translates into immediate monthly revenue and campaign profitability for your business.
          </p>
        </motion.div>

        {/* Trade Presets Fade & Scale */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <span className="block text-xs font-mono font-bold uppercase text-secondary mb-3">
            1. Select Your Industry Baseline or Custom Values:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TRADE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 text-left rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  selectedPresetId === preset.id
                    ? 'border-[#4c8dff] bg-[#4c8dff]/5 text-primary font-bold shadow-sm ring-2 ring-[#4c8dff]/20'
                    : 'border-outline-variant/30 bg-slate-50/60 text-secondary hover:border-primary/40 hover:bg-white'
                }`}
              >
                <span className="block text-primary font-sans font-bold text-sm mb-1">{preset.name}</span>
                <span className="block text-[11px] text-slate-500">Avg Job: {formatCurrency(preset.avgJobValue)}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Interactive Grid with Split-Directional Animation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Slide In From Left */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 bg-slate-50/80 rounded-2xl p-6 md:p-8 border border-outline-variant/30 space-y-6 flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-primary text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#4c8dff]" /> Campaign Parameters
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    const preset = TRADE_PRESETS.find(p => p.id === selectedPresetId) || TRADE_PRESETS[0];
                    handleSelectPreset(preset);
                  }}
                  className="text-[11px] font-mono text-slate-500 hover:text-primary flex items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Reset
                </button>
              </div>

              {/* Input 1: Monthly Ad Budget */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor={budgetInputId} className="text-xs font-bold text-primary font-sans">
                    Monthly Google Ad Budget ($)
                  </label>
                  <span className="font-mono font-bold text-sm text-[#4c8dff] bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    {formatCurrency(monthlyBudget)}
                  </span>
                </div>
                <input
                  id={budgetInputId}
                  type="range"
                  min="1000"
                  max="20000"
                  step="250"
                  value={monthlyBudget}
                  onChange={(e) => {
                    setMonthlyBudget(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#4c8dff]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>$1,000</span>
                  <span>$10,000</span>
                  <span>$20,000+</span>
                </div>
              </div>

              {/* Input 2: Average Job / Contract Value */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor={jobValueInputId} className="text-xs font-bold text-primary font-sans">
                    Average Job / Contract Value ($)
                  </label>
                  <span className="font-mono font-bold text-sm text-green-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    {formatCurrency(avgJobValue)}
                  </span>
                </div>
                <input
                  id={jobValueInputId}
                  type="range"
                  min="1000"
                  max="40000"
                  step="500"
                  value={avgJobValue}
                  onChange={(e) => {
                    setAvgJobValue(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>$1,000</span>
                  <span>$20,000</span>
                  <span>$40,000</span>
                </div>
              </div>

              {/* Input 3: Estimated Cost Per Lead */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor={cplInputId} className="text-xs font-bold text-primary font-sans">
                    Target Cost Per Lead ($)
                  </label>
                  <span className="font-mono font-bold text-sm text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    ${costPerLead} / lead
                  </span>
                </div>
                <input
                  id={cplInputId}
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={costPerLead}
                  onChange={(e) => {
                    setCostPerLead(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>$20</span>
                  <span>$75</span>
                  <span>$150</span>
                </div>
              </div>

              {/* Input 4: Lead Close Rate (%) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor={closeRateInputId} className="text-xs font-bold text-primary font-sans">
                    Sales Close Rate (%)
                  </label>
                  <span className="font-mono font-bold text-sm text-primary bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    {closeRate}% of leads closed
                  </span>
                </div>
                <input
                  id={closeRateInputId}
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={closeRate}
                  onChange={(e) => {
                    setCloseRate(Number(e.target.value));
                    setSelectedPresetId('custom');
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>5% (Conservative)</span>
                  <span>25% (Average)</span>
                  <span>50% (High performing)</span>
                </div>
              </div>
            </div>

            {/* Quick Summary footnote */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-[11px] text-secondary leading-relaxed">
              💡 With a <strong>{formatCurrency(monthlyBudget)}</strong> ad budget at <strong>${costPerLead}</strong>/lead, you receive ~<strong>{estimatedLeads} local inquiries</strong>/month. Closing <strong>{closeRate}%</strong> equals ~<strong>{estimatedJobsClosed} closed jobs</strong>.
            </div>
          </motion.div>

          {/* Right Column: Slide In From Right with Glow Reveal */}
          <motion.div
            initial={{ opacity: 0, x: 35, scale: 0.98 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-6 bg-primary text-white rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden"
          >
            {/* Background accent light */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#4c8dff]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#4c8dff] font-bold block">
                    ESTIMATED MONTHLY RETURNS
                  </span>
                  <h3 className="text-2xl font-bold font-display-lg uppercase tracking-tight text-white mt-0.5">
                    Projected Revenue
                  </h3>
                </div>
                <div className="bg-[#4c8dff] text-white px-3 py-1.5 rounded-lg text-right">
                  <span className="block font-mono text-[10px] uppercase tracking-widest opacity-80">ROAS Multiple</span>
                  <span className="font-mono text-lg font-bold">{roasMultiplier}x</span>
                </div>
              </div>

              {/* Big Featured Revenue Card */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/15">
                <span className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-1">
                  Estimated Gross Revenue Generated
                </span>
                <div className="text-4xl md:text-5xl font-black text-white font-mono tracking-tight flex items-baseline gap-2">
                  {formatCurrency(grossRevenue)}
                  <span className="text-xs font-sans font-normal text-slate-300">/ month</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Estimated Net Revenue (After Ad Spend):</span>
                  <span className="font-mono font-bold text-green-400 text-sm">
                    +{formatCurrency(netProfit)}
                  </span>
                </div>
              </div>

              {/* Sub Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white/5 rounded-lg p-3.5 border border-white/10">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Est. Inbound Leads</span>
                  <span className="text-xl font-bold font-mono text-white flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-[#4c8dff]" />
                    {estimatedLeads}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Exclusive local inquiries</span>
                </div>

                <div className="bg-white/5 rounded-lg p-3.5 border border-white/10">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Jobs Closed</span>
                  <span className="text-xl font-bold font-mono text-white flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    {estimatedJobsClosed}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">At {closeRate}% sales close</span>
                </div>

                <div className="bg-white/5 rounded-lg p-3.5 border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Estimated ROI</span>
                  <span className="text-xl font-bold font-mono text-green-400 flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    +{roiPercentage}%
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5 block">Return on investment</span>
                </div>
              </div>
            </div>

            {/* CTA inside calculator */}
            <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-300 text-center sm:text-left">
                Ready to capture these jobs in your primary zip codes?
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTab('contact')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-primary bg-white hover:bg-slate-100 font-mono text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-lg shadow-lg cursor-pointer transition-all shrink-0"
              >
                Claim Your Territory
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
}
