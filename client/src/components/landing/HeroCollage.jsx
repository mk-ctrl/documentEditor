import { useEffect, useRef } from 'react';
import Avatar from '../Avatar.jsx';
import { Lines } from './Mockups.jsx';
import { prefersReducedMotion } from './motion.js';

/**
 * Wraps the auth sheet with a collage of small floating cards (doc thumbnail, share chip,
 * "Saved" pill, torn snippet). As the page scrolls the cards drift outward — the hero
 * "breaks apart" like the reference — via a single --sy custom property set in rAF.
 * Each card's direction comes from --dx/--dy (px moved per px scrolled).
 */
export default function HeroCollage({ children }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // cap so the cards never fly off once the hero is out of view
      el.style.setProperty('--sy', Math.min(window.scrollY, 700));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="lp-stage" ref={ref}>
      <div className="lp-collage" aria-hidden="true">
        <div className="lp-par lp-par-doc" style={{ '--dx': -0.18, '--dy': -0.1 }}>
          <div className="paper lp-card lp-card-doc">
            <p className="lp-eyebrow">Client: Northwind</p>
            <p className="lp-title">Q3 plan</p>
            <Lines widths={[92, 74, 86, 60]} />
          </div>
        </div>
        <div className="lp-par lp-par-saved" style={{ '--dx': 0.16, '--dy': -0.14 }}>
          <span className="lp-card lp-card-saved">
            <i /> Saved
          </span>
        </div>
        <div className="lp-par lp-par-share" style={{ '--dx': -0.22, '--dy': 0.06 }}>
          <span className="lp-card lp-card-share">
            <Avatar name="Bob Rivera" email="bob@example.com" size={24} />
            Shared with Bob <span className="chip chip-viewer">Viewer</span>
          </span>
        </div>
        <div className="lp-par lp-par-snip" style={{ '--dx': 0.2, '--dy': 0.1 }}>
          <div className="paper lp-card lp-card-snip">
            <i className="lp-line lp-line-hl" style={{ '--w': '88%' }} />
            <Lines widths={[70, 80]} />
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
