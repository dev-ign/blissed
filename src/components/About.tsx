import { icons, images } from '../data/assets';

const benefits = [
  { icon: icons.shield, title: 'Licensed Professional', description: 'Professional massage expertise' },
  { icon: icons.care, title: 'Personalized Care', description: 'Every session tailored to your unique needs' },
  { icon: icons.location, title: 'Mobile Massage', description: 'We come to you — at home, hotel, or office' },
];

export function About() {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="about-image"><img alt="Mayi outdoors surrounded by greenery" src={images.mayi} loading="lazy" /></div>
      <div className="about-content">
        <h2 id="about-title">Meet Mayi</h2>
        <p className="about-tagline">Your comfort. Your space. Your moment.</p>
        <div className="about-body">
          <p>Wellness should fit into your life, not the other way around.</p>
          <p>Mayi brings personalized massage therapy directly to you, transforming the comfort of your own space into a moment of relaxation and renewal.</p>
          <p>Every session begins with understanding your needs, whether you're looking to release tension, recover from a busy week, or simply take a moment for yourself.</p>
          <p>Because the best place to unwind is wherever you feel most at ease.</p>
        </div>
        <div className="about-benefits">
          {benefits.map((benefit) => (
            <div className="benefit" key={benefit.title}>
              <span className="benefit-icon"><img alt="" src={benefit.icon} width="26" height="26" /></span>
              <strong>{benefit.title}</strong>
              <span>{benefit.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
