import { images } from '../../data/assets';

export type ExperienceSceneData = {
  key: string;
  image: string;
  kind: 'intro' | 'step';
  number?: string;
  title: string;
  subtitle?: string;
  description?: string;
  side?: 'left' | 'right';
  accent?: 'sage' | 'rose';
};

export const experienceScenes: ExperienceSceneData[] = [
  {
    key: 'reconnect',
    image: images.experience,
    kind: 'intro',
    title: 'Restore. Relax. Reconnect.',
  },
  {
    key: 'arrive',
    image: images.arrive,
    kind: 'step',
    number: '01',
    title: 'Arrive',
    subtitle: 'Leave the outside world behind.',
    description: 'Step into a space prepared for you, slow down, and settle into your moment.',
    side: 'right',
    accent: 'sage',
  },
  {
    key: 'exhale',
    image: images.exhale,
    kind: 'step',
    number: '02',
    title: 'Exhale',
    subtitle: 'Release what you’ve been carrying.',
    description: 'Slow your breathing, quiet your mind, and allow the tension to begin to fade.',
    side: 'left',
    accent: 'sage',
  },
  {
    key: 'restore',
    image: images.restore,
    kind: 'step',
    number: '03',
    title: 'Restore',
    subtitle: 'Give your body what it needs.',
    description: 'Personalized care helps release tension, ease tired muscles, and restore a sense of balance.',
    side: 'right',
    accent: 'rose',
  },
];
