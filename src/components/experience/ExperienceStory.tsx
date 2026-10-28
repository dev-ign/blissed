import { useRef } from 'react';
import { useExperienceScroll } from '../../hooks/useExperienceScroll';
import { ExperienceScene } from './ExperienceScene';
import { experienceScenes } from './experienceScenes';

export function ExperienceStory() {
  const root = useRef<HTMLElement>(null);
  useExperienceScroll(root);

  return (
    <section className="story" id="experience" aria-label="The Blissed experience" ref={root}>
      <div className="story-viewport">
        <div className="story-backgrounds" aria-hidden="true">
          {experienceScenes.map((scene, index) => (
            <div className={`story-backdrop ${index === 0 ? 'story-backdrop--first' : ''}`} key={scene.key}>
              <img src={scene.image} alt="" loading="eager" decoding="async" />
            </div>
          ))}
        </div>
        <div className="story-scenes">
          {experienceScenes.map((scene) => <ExperienceScene key={scene.key} scene={scene} />)}
        </div>
      </div>
    </section>
  );
}
