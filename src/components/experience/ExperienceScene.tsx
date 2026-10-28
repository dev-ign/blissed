import type { ExperienceSceneData } from './experienceScenes';

type Props = { scene: ExperienceSceneData };

export function ExperienceScene({ scene }: Props) {
  const headingId = `experience-${scene.key}-title`;

  if (scene.kind === 'intro') {
    return (
      <section className="experience story-panel story-scene" aria-labelledby={headingId} data-scene={scene.key}>
        <div className="story-image-wrap"><img className="story-image" src={scene.image} alt="" loading="lazy" decoding="async" /></div>
        <div className="experience-copy">
          <h2 id={headingId}>Restore. <span>Relax.</span> <span>Reconnect.</span></h2>
          <p><em>Wellness</em> should feel like a <em>reset.</em> Step away from the noise and give your body space to slow down, release tension, and reconnect.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`story-step story-step--${scene.side} story-panel story-scene`} aria-labelledby={headingId} data-scene={scene.key}>
      <div className="story-image-wrap"><img className="story-image" src={scene.image} alt="" loading="lazy" decoding="async" /></div>
      <div className="story-step-content page-gutter">
        <div className={`story-step-copy story-step-copy--${scene.accent}`}>
          <div className="story-step-heading">
            <span className="story-number">{scene.number}</span>
            <span className="story-divider" aria-hidden="true" />
            <h2 id={headingId}>{scene.title}</h2>
          </div>
          <p className="story-subtitle">{scene.subtitle}</p>
          <p className="story-description">{scene.description}</p>
        </div>
      </div>
    </section>
  );
}
