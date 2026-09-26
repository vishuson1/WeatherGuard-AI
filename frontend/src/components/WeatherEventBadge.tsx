import React from 'react';
import { CloudRain, Wind, Flame, AlertOctagon, CloudLightning, Waves, CheckCircle2 } from 'lucide-react';

interface Props {
  event: string;
  isInferred?: boolean;
}

export const WeatherEventBadge: React.FC<Props> = ({ event, isInferred = false }) => {
  const getStyle = () => {
    switch (event) {
      case 'Cyclone':
        return {
          icon: Waves,
          bg: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
          dot: 'bg-rose-500'
        };
      case 'Monsoon Depression':
        return {
          icon: CloudLightning,
          bg: 'bg-purple-950/80 border-purple-500/60 text-purple-300',
          dot: 'bg-purple-500'
        };
      case 'Heavy Rainfall':
        return {
          icon: CloudRain,
          bg: 'bg-blue-950/80 border-blue-500/60 text-blue-300',
          dot: 'bg-blue-500'
        };
      case 'Heat Wave':
        return {
          icon: Flame,
          bg: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
          dot: 'bg-amber-500'
        };
      case 'Western Disturbance':
        return {
          icon: Wind,
          bg: 'bg-teal-950/80 border-teal-500/60 text-teal-300',
          dot: 'bg-teal-500'
        };
      case 'Active Monsoon':
        return {
          icon: CloudRain,
          bg: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300',
          dot: 'bg-cyan-500'
        };
      case 'Rapid Transition':
        return {
          icon: AlertOctagon,
          bg: 'bg-orange-950/80 border-orange-500/60 text-orange-300',
          dot: 'bg-orange-500'
        };
      default:
        return {
          icon: CheckCircle2,
          bg: 'bg-slate-800/80 border-slate-600/60 text-slate-300',
          dot: 'bg-emerald-400'
        };
    }
  };

  const { icon: Icon, bg, dot } = getStyle();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
      <Icon className="w-3.5 h-3.5" />
      <span>{event}</span>
      {isInferred && (
        <span className="text-[10px] text-slate-400 opacity-80 border-l border-slate-600 pl-1.5 ml-0.5">
          Inferred
        </span>
      )}
    </div>
  );
};
