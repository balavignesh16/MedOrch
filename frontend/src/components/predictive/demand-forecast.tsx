import React from 'react';

interface DemandForecastProps {
  forecast: any[];
}

export const DemandForecast: React.FC<DemandForecastProps> = ({ forecast }) => {
  // Render a simple illustrative chart using flex bars to represent the time-series forecast
  const maxDemand = Math.max(...forecast.map(f => f.bedDemand));

  return (
    <div className="bg-brand-surface border border-brand-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4 flex justify-between">
        <span>Hospital Bed Demand Forecast (7-Day)</span>
        <span className="text-xs text-brand-warning font-normal">+13% Trend</span>
      </h3>
      <div className="h-32 flex items-end justify-between space-x-2">
        {forecast.map((f, i) => (
          <div key={i} className="flex flex-col items-center flex-1 group">
            <div className="w-full flex justify-center space-x-1 items-end h-full relative">
              <div 
                className="w-1/2 bg-brand-cyan/80 rounded-t hover:bg-brand-cyan transition-all"
                style={{ height: `${(f.bedDemand / maxDemand) * 100}%` }}
              />
              <div 
                className="w-1/2 bg-brand-warning/80 rounded-t hover:bg-brand-warning transition-all"
                style={{ height: `${(f.erVolume / maxDemand) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-brand-gray mt-2">{new Date(f.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center space-x-4 text-[10px] text-brand-gray">
        <div className="flex items-center"><div className="w-2 h-2 rounded bg-brand-cyan mr-1"/> Inpatient Beds</div>
        <div className="flex items-center"><div className="w-2 h-2 rounded bg-brand-warning mr-1"/> ER Volume</div>
      </div>
    </div>
  );
};
