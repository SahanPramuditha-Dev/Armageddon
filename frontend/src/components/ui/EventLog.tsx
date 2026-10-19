import React, { useState, useRef, useEffect } from 'react';
import { CombatEvent } from '@/types/combat';

interface EventLogProps {
  events: CombatEvent[];
  maxEvents?: number;
  className?: string;
}

export const EventLog: React.FC<EventLogProps> = ({
  events,
  maxEvents = 30,
  className = '',
}) => {
  const [filter, setFilter] = useState<'ALL' | 'HITS' | 'THREATS' | 'DEFENSE'>('ALL');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const filteredEvents = events.filter((e) => {
    if (filter === 'HITS') return e.event_type === 'ATTACK_HIT' || e.event_type === 'VESSEL_SUNK';
    if (filter === 'THREATS') return e.event_type === 'THREAT_DETECTED' || e.event_type === 'ATTACK_LAUNCHED';
    if (filter === 'DEFENSE') return e.event_type === 'COUNTERMEASURE_DEPLOYED' || e.event_type === 'ATTACK_INTERCEPTED';
    return true;
  });

  const getEventBadge = (type: string) => {
    switch (type) {
      case 'ATTACK_HIT':
        return 'text-[#FF453A] border-[#FF453A]/30 bg-[#FF453A]/15';
      case 'VESSEL_SUNK':
        return 'text-[#FF453A] border-[#FF453A]/50 bg-[#FF453A]/25 font-bold';
      case 'ATTACK_INTERCEPTED':
        return 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/15';
      case 'THREAT_DETECTED':
        return 'text-[#FF9F0A] border-[#FF9F0A]/30 bg-[#FF9F0A]/15';
      case 'COUNTERMEASURE_DEPLOYED':
        return 'text-[#0A84FF] border-[#0A84FF]/30 bg-[#0A84FF]/15';
      default:
        return 'text-slate-400 border-white/10 bg-white/5';
    }
  };

  return (
    <div className={`flex flex-col h-full rounded-xl overflow-hidden ${className}`}>
      {/* Header and Filter Buttons */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06] text-xs">
        <span className="font-semibold text-white tracking-wide text-[11px]">
          Chronolog ({filteredEvents.length})
        </span>

        <div className="flex gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/[0.06]">
          {(['ALL', 'THREATS', 'HITS', 'DEFENSE'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                filter === cat
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pt-2 space-y-1.5 text-xs font-mono-tech"
      >
        {filteredEvents.length === 0 ? (
          <p className="text-slate-500 text-center py-6 font-sans text-xs">No events recorded in this sector.</p>
        ) : (
          filteredEvents.slice(-maxEvents).map((evt) => (
            <div
              key={evt.id}
              className="flex items-start gap-2 py-1 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[10px] text-slate-500 shrink-0 mt-0.5 font-mono-tech">
                +{evt.timestamp.toFixed(1)}s
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 border rounded-full shrink-0 font-medium ${getEventBadge(
                  evt.event_type
                )}`}
              >
                {evt.event_type.replace(/_/g, ' ')}
              </span>
              <span className="text-slate-300 text-[11px] leading-snug break-words font-sans">
                {evt.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
