import React from 'react';
import { CloudSun } from 'lucide-react';
import { useWeatherData } from '../../hooks/useWidgetData';
import { useApiKeysStore } from '../../store/useApiKeysStore';
import { LayoutZone } from '../../types/signage';

export const LiveWeatherWidget: React.FC<{ zone: LayoutZone }> = ({ zone }) => {
  const city = zone.contentData?.weatherCity || 'Phuket';
  const unit = zone.contentData?.weatherUnit || 'celsius';
  const globalApiKey = useApiKeysStore((s) => s.openWeatherApiKey);
  const apiKey = zone.contentData?.weatherApiKey || globalApiKey;

  const { data, error, loading } = useWeatherData(city, unit, apiKey, true);

  const unitSymbol = unit === 'celsius' ? '°C' : '°F';

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-sky-950 to-slate-950 p-2">
        <CloudSun className="h-6 w-6 text-sky-400/50 mb-1" />
        <div className="text-sky-300/60 text-[8px] text-center">Set OpenWeather API key in Settings</div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-sky-950 to-slate-950 p-2">
        <CloudSun className="h-6 w-6 text-sky-400 mb-1 animate-pulse" />
        <div className="text-sky-300/60 text-[8px]">Loading...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-sky-950 to-slate-950 p-2">
        <CloudSun className="h-5 w-5 text-sky-400/50 mb-1" />
        <div className="text-red-300/80 text-[7px] text-center">{error}</div>
      </div>
    );
  }

  if (data) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-sky-950 to-slate-950 p-2">
        {data.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
            alt={data.description}
            className="h-10 w-10 -mt-1"
          />
        )}
        <div className="text-sky-300 font-bold text-sm">{data.temp}{unitSymbol}</div>
        <div className="text-sky-200/60 text-[8px] mt-0.5">{data.city}, {data.country}</div>
        <div className="text-sky-300/40 text-[7px] capitalize">{data.description}</div>
        <div className="text-sky-400/30 text-[6px] mt-0.5">💧 {data.humidity}% • 💨 {data.windSpeed}m/s</div>
      </div>
    );
  }

  // Fallback mock
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-sky-950 to-slate-950 p-2">
      <CloudSun className="h-7 w-7 text-sky-400 mb-1" />
      <div className="text-sky-300 font-bold text-sm">--{unitSymbol}</div>
      <div className="text-sky-200/60 text-[8px] mt-0.5">{city}</div>
    </div>
  );
};
