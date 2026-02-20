import React from 'react';
import type { ExtractedDesignData } from '../../shared/messaging';

interface Props {
  data: ExtractedDesignData;
}

export default function StatsBar({ data }: Props) {
  const stats = [
    { label: 'Colors', value: data.colors.length, icon: '🎨' },
    { label: 'Fonts', value: data.fonts.length, icon: '🔤' },
    { label: 'Spacing', value: data.spacing.length, icon: '📐' },
    { label: 'Breakpoints', value: data.breakpoints.length, icon: '📱' },
  ];

  return (
    <div className="flex gap-1 px-4 py-2.5">
      {stats.map(s => (
        <div key={s.label} className="flex-1 bg-card rounded-lg px-2.5 py-2 text-center">
          <div className="text-base font-bold text-primary">{s.value}</div>
          <div className="text-[9px] text-secondary uppercase tracking-wider">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
