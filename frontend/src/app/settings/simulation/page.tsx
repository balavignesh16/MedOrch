"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, Zap, Activity, Users, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function SimulationSettingsPage() {
  const [icuDemand, setIcuDemand] = useState(85);
  const [casualtyEvent, setCasualtyEvent] = useState(false);
  const [budgetConstraint, setBudgetConstraint] = useState(100);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      alert("Simulation parameters deployed! In a fully integrated environment, all charts on the dashboard and prediction models would instantly recalculate.");
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col space-y-8">
      <header className="mb-4">
        <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-orange to-brand-rose">Presenter Simulation Control</h2>
        <p className="text-slate-400 mt-2 text-lg">Dynamically alter the hospital's operating environment to showcase real-time AI recalibration.</p>
      </header>

      <div className="glass-card rounded-3xl p-8 space-y-10">
        
        {/* Environment Sliders */}
        <div className="space-y-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-semibold flex items-center"><Activity className="w-5 h-5 mr-2 text-brand-teal" /> Baseline ICU Demand</label>
              <span className="text-brand-teal font-mono text-xl">{icuDemand}%</span>
            </div>
            <input 
              type="range" 
              min="50" max="150" 
              value={icuDemand} 
              onChange={(e) => setIcuDemand(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-teal"
            />
            <p className="text-sm text-slate-500 mt-2">Pushing this above 95% will trigger the Staffing Agent to recommend float pool nurses.</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="text-lg font-semibold flex items-center"><Users className="w-5 h-5 mr-2 text-brand-indigo" /> Budget / Resource Constraint</label>
              <span className="text-brand-indigo font-mono text-xl">{budgetConstraint}%</span>
            </div>
            <input 
              type="range" 
              min="20" max="100" 
              value={budgetConstraint} 
              onChange={(e) => setBudgetConstraint(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-indigo"
            />
            <p className="text-sm text-slate-500 mt-2">Lowering this forces the Health Economics Agent to optimize for extreme cost savings.</p>
          </div>
        </div>

        {/* Global Events */}
        <div className="border-t border-slate-700/50 pt-8">
          <h3 className="text-xl font-bold mb-6 flex items-center"><AlertOctagon className="w-6 h-6 mr-2 text-brand-rose" /> Critical Global Events</h3>
          
          <label className={`flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all ${
            casualtyEvent ? 'bg-brand-rose/10 border-brand-rose' : 'bg-slate-800/50 border-transparent hover:border-slate-700'
          }`}>
            <div>
              <h4 className="font-bold text-lg text-white">Mass Casualty Event (Code Orange)</h4>
              <p className="text-slate-400 mt-1">Simulate a massive influx of 500+ trauma patients in the next hour.</p>
            </div>
            <div className={`w-14 h-8 rounded-full p-1 transition-colors ${casualtyEvent ? 'bg-brand-rose' : 'bg-slate-700'}`}>
              <motion.div 
                animate={{ x: casualtyEvent ? 24 : 0 }}
                className="w-6 h-6 bg-white rounded-full shadow-md"
                onClick={() => setCasualtyEvent(!casualtyEvent)}
              />
            </div>
          </label>
        </div>

        {/* Deploy Button */}
        <div className="border-t border-slate-700/50 pt-8 flex justify-end">
          <button 
            onClick={handleSimulate}
            disabled={isSimulating}
            className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center shadow-lg transition-all ${
              isSimulating 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-brand-orange to-brand-rose text-white hover:scale-105 hover:shadow-brand-rose/25'
            }`}
          >
            {isSimulating ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-3" />
                Injecting Parameters...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 mr-2" /> Deploy Simulation Parameters
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
