import React from 'react';
import { Calendar } from 'lucide-react';
import { useCalendarData } from '../../hooks/useWidgetData';
import { useApiKeysStore } from '../../store/useApiKeysStore';
import { LayoutZone } from '../../types/signage';

export const LiveCalendarWidget: React.FC<{ zone: LayoutZone }> = ({ zone }) => {
  const calendarId = zone.contentData?.googleCalendarId || '';
  const globalApiKey = useApiKeysStore((s) => s.googleApiKey);
  const apiKey = zone.contentData?.googleCalendarApiKey || globalApiKey;
  const daysAhead = zone.contentData?.googleCalendarDaysAhead || 7;

  const { data, error, loading } = useCalendarData(calendarId, apiKey, daysAhead, !!(calendarId && apiKey));

  if (!calendarId || !apiKey) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-950 to-slate-950 p-2 flex flex-col items-center justify-center">
        <Calendar className="h-5 w-5 text-blue-400/50 mb-1" />
        <div className="text-blue-300/60 text-[8px] text-center">
          {!calendarId ? 'Set Calendar ID' : 'Set Google API key'}
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-950 to-slate-950 p-2 flex flex-col items-center justify-center">
        <Calendar className="h-5 w-5 text-blue-400 mb-1 animate-pulse" />
        <div className="text-blue-300/60 text-[8px]">Loading events...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-950 to-slate-950 p-2 flex flex-col items-center justify-center">
        <Calendar className="h-4 w-4 text-blue-400/50 mb-1" />
        <div className="text-red-300/80 text-[7px] text-center">{error}</div>
      </div>
    );
  }

  const events = data?.events || [];

  return (
    <div className="h-full bg-gradient-to-br from-blue-950 to-slate-950 p-2 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <div className="flex items-center space-x-1">
          <Calendar className="h-3 w-3 text-blue-400" />
          <span className="text-blue-300 text-[8px] font-bold">Upcoming Events</span>
        </div>
        <span className="text-blue-400/50 text-[7px]">{daysAhead}d</span>
      </div>
      <div className="flex-1 overflow-hidden space-y-1">
        {events.length > 0 ? events.map((ev, i) => {
          const startDate = new Date(ev.start);
          const timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const dayStr = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          return (
            <div key={i} className="flex items-center space-x-1.5 bg-blue-900/20 rounded px-1.5 py-0.5">
              <div className="shrink-0">
                <span className="text-blue-400/80 text-[7px] font-mono block">{timeStr}</span>
                <span className="text-blue-400/40 text-[6px] block">{dayStr}</span>
              </div>
              <span className="text-blue-200/80 text-[7px] truncate">{ev.title}</span>
            </div>
          );
        }) : (
          <p className="text-blue-300/40 text-[7px]">No upcoming events</p>
        )}
      </div>
      <div className="text-blue-400/30 text-[6px] mt-1 shrink-0">
        {data?.fetchedAt ? `Updated: ${new Date(data.fetchedAt).toLocaleTimeString()}` : ''}
      </div>
    </div>
  );
};
