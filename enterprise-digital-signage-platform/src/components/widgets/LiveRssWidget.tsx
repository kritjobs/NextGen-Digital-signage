import React from 'react';
import { Rss } from 'lucide-react';
import { useRssData } from '../../hooks/useWidgetData';
import { LayoutZone } from '../../types/signage';

export const LiveRssWidget: React.FC<{ zone: LayoutZone }> = ({ zone }) => {
  const rssUrl = zone.contentData?.rssUrl || '';
  const maxItems = zone.contentData?.rssMaxItems || 5;

  const { data, error, loading } = useRssData(rssUrl, maxItems, !!rssUrl);

  if (!rssUrl) {
    return (
      <div className="h-full bg-gradient-to-br from-orange-950 to-slate-950 p-2 flex flex-col items-center justify-center">
        <Rss className="h-5 w-5 text-orange-400/50 mb-1" />
        <div className="text-orange-300/60 text-[8px] text-center">Set RSS Feed URL in Widget Settings</div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="h-full bg-gradient-to-br from-orange-950 to-slate-950 p-2 flex flex-col items-center justify-center">
        <Rss className="h-5 w-5 text-orange-400 mb-1 animate-pulse" />
        <div className="text-orange-300/60 text-[8px]">Loading feed...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="h-full bg-gradient-to-br from-orange-950 to-slate-950 p-2 flex flex-col items-center justify-center">
        <Rss className="h-4 w-4 text-orange-400/50 mb-1" />
        <div className="text-red-300/80 text-[7px] text-center">{error}</div>
      </div>
    );
  }

  const items = data?.items || [];
  const feedTitle = data?.title || 'RSS Feed';

  return (
    <div className="h-full bg-gradient-to-br from-orange-950 to-slate-950 p-2 flex flex-col overflow-hidden">
      <div className="flex items-center space-x-1 mb-1.5 shrink-0">
        <Rss className="h-3 w-3 text-orange-400" />
        <span className="text-orange-300 text-[8px] font-bold uppercase truncate">{feedTitle}</span>
      </div>
      <div className="flex-1 overflow-hidden space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start space-x-1">
            <span className="text-orange-400/60 text-[7px] shrink-0">●</span>
            <p className="text-orange-200/80 text-[7px] line-clamp-1">{item.title}</p>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-orange-300/40 text-[7px]">No items found</p>
        )}
      </div>
      <div className="text-orange-400/30 text-[6px] mt-1 truncate shrink-0">
        {data?.fetchedAt ? `Updated: ${new Date(data.fetchedAt).toLocaleTimeString()}` : ''}
      </div>
    </div>
  );
};
