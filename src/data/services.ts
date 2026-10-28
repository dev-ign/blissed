export type ServiceId = 'reset' | 'deep-restore' | 'active-recovery' | 'prenatal' | 'your-way';

export type ServiceContent = {
  id: ServiceId;
  title: string;
  subtitle: string;
  description: string;
  startingPriceMinor: number;
  imageKey: 'reset' | 'deepRestore' | 'activeRecovery' | 'prenatal' | 'yourWay';
};

// Published homepage content. Starting prices are not quotes for a specific duration.
export const massageServices: readonly ServiceContent[] = [
  { id: 'reset', title: 'The Reset', subtitle: 'Relax. Breathe. Let go.', description: 'A personalized full-body session for slowing down, releasing everyday tension and resetting.', startingPriceMinor: 6000, imageKey: 'reset' },
  { id: 'deep-restore', title: 'Deep Restore', subtitle: 'Release. Recover. Restore.', description: 'Focused, deeper-pressure bodywork designed to target stubborn tension, tight muscles, and areas that need extra attention.', startingPriceMinor: 7500, imageKey: 'deepRestore' },
  { id: 'active-recovery', title: 'Active Recovery', subtitle: 'Recover. Rebuild. Keep moving.', description: 'Targeted bodywork for active bodies, designed to ease post-workout soreness, improve mobility, and help you feel ready to move again.', startingPriceMinor: 6000, imageKey: 'activeRecovery' },
  { id: 'prenatal', title: 'Prenatal Comfort', subtitle: 'Supported. Nurtured. At ease.', description: 'Gentle, personalized bodywork designed to ease everyday tension and provide added comfort throughout pregnancy.', startingPriceMinor: 7500, imageKey: 'prenatal' },
  { id: 'your-way', title: 'Blissed Your Way', subtitle: 'Every body is differnt. Every session should be too', description: 'Tell us what your body needs, choose your preferences, and let us create a massage experience centered entirely around you.', startingPriceMinor: 6000, imageKey: 'yourWay' },
];
