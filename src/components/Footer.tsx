import { icons } from '../data/assets';

export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src={icons.footerLogo} alt="" width="58" height="34" />
          <strong>Blissed by Mayi</strong>
          <span>Mobile Massage Therapy</span>
        </div>
        <div className="footer-col">
          <strong>Explore</strong>
          <a href="#experience">Experience</a>
          <a href="#services">Services</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </div>
        <div className="footer-col">
          <strong>Connect</strong>
          <span>Instagram: [handle]</span>
          <span>Phone: [phone number]</span>
          <span>Email: [email address]</span>
        </div>
        <div className="footer-col">
          <strong>Service Area</strong>
          <span>[Service area to be confirmed]</span>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Adding wellness to your routine.</p>
        <div><span>Privacy Policy [placeholder]</span><span>Terms [placeholder]</span></div>
      </div>
    </footer>
  );
}
