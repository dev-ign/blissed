import { icons, images } from '../data/assets';

export function Testimonial() {
  return (
    <section className="testimonial" aria-label="Client testimonial placeholder">
      <blockquote>
        <p>“[Client testimonial will go here — a few sentences about how their session felt and what changed for them.]”</p>
        <footer>
          <img src={images.reviewer} alt="" width="40" height="40" />
          <cite>— [First Name], [Service received]</cite>
        </footer>
      </blockquote>
      <img aria-hidden="true" className="testimonial-dots" src={icons.testimonialDots} width="248" height="32" />
    </section>
  );
}
