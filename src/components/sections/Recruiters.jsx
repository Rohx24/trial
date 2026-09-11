import { useEffect, useMemo, useRef, useState } from "react";
import Eyebrow from "../ui/Eyebrow";
import Words from "../ui/Words";
import { buildRecruiterField, UPCOMING, DOMAINS } from "../../data/placements";
import "./Recruiters.css";

function shortSector(s) {
  return s.replace(" & Software", "").replace(" & Fintech", "").replace(" & Analytics", "")
    .replace("Energy, Industrial & Health", "Industrial").replace(" & Startups", "");
}

// nk-style card: logo (contained, not zoomed) -> company -> sector
function RecruiterCard({ c }) {
  const mono = c.co.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "RV";
  const domain = DOMAINS[c.co];
  // Paste a free logo.dev publishable token here → every card renders a crisp,
  // full-colour logo. Empty = falls back to favicon-grade sources.
  const LOGO_TOKEN = "";
  const sources = domain
    ? [
        ...(LOGO_TOKEN
          ? [`https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&size=256&format=png&retina=true`]
          : []),
        `https://unavatar.io/${domain}?fallback=false`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
      ]
    : [];
  const [idx, setIdx] = useState(0);
  const showLogo = idx < sources.length;
  return (
    <article className="rf-card" data-hot>
      <div className={`rf-pic ${showLogo ? "" : "mono"}`}>
        {showLogo ? (
          <img src={sources[idx]} alt={c.co} loading="lazy" draggable="false"
               onError={() => setIdx((i) => i + 1)} />
        ) : (
          <span className="rf-picmono">{mono}</span>
        )}
      </div>
      <div className="rf-body">
        <div className="rf-name serif">{c.co}</div>
        <div className="rf-sector mono">{shortSector(c.sector)}</div>
      </div>
    </article>
  );
}

// scroll-driven marquee: page scroll pushes it, gentle drift at rest, grab to swipe
function LogoMarquee({ items, dir = -1, speed = 0.28 }) {
  const trackRef = useRef(null);
  const st = useRef({ pos: 0, vel: 0, dragging: false, lastX: 0, half: 0, init: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const s = st.current;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const measure = () => {
      s.half = track.scrollWidth / 2;
      if (!s.init) { s.pos = dir > 0 ? -s.half : 0; s.init = true; }
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(track);

    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY, dy = y - lastY; lastY = y;
      if (reduce || s.dragging) return;
      s.vel += dy * 0.3 * dir;
      s.vel = Math.max(-46, Math.min(46, s.vel));
    };
    addEventListener("scroll", onScroll, { passive: true });

    let raf;
    const base = speed * dir;
    const loop = () => {
      if (!s.dragging) {
        if (reduce) s.vel = 0;
        else s.vel += (base - s.vel) * 0.06;
        s.pos += s.vel;
      }
      if (s.half > 0) {
        if (s.pos <= -s.half) s.pos += s.half;
        else if (s.pos > 0) s.pos -= s.half;
      }
      track.style.transform = `translate3d(${s.pos.toFixed(2)}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener("scroll", onScroll); };
  }, [dir, speed]);

  const onDown = (e) => { const s = st.current; s.dragging = true; s.lastX = e.clientX; s.vel = 0; trackRef.current.classList.add("grabbing"); trackRef.current.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => { const s = st.current; if (!s.dragging) return; const dx = e.clientX - s.lastX; s.lastX = e.clientX; s.pos += dx; s.vel = dx; };
  const onUp = () => { const s = st.current; s.dragging = false; trackRef.current?.classList.remove("grabbing"); };

  return (
    <div className="lm">
      <div className="lm-track" ref={trackRef}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {items.concat(items).map((c, i) => <RecruiterCard key={i} c={c} />)}
      </div>
    </div>
  );
}

export default function Recruiters() {
  const { cards } = useMemo(() => buildRecruiterField(), []);
  const rowA = useMemo(() => cards.filter((_, i) => i % 2 === 0), [cards]);
  const rowB = useMemo(() => cards.filter((_, i) => i % 2 === 1), [cards]);

  return (
    <section className="section recruiters" id="recruiters">
      <div className="wrap">
        <Eyebrow idx="01">Recruiters</Eyebrow>
        <h2 className="serif rec-h">
          <Words text="Who recruits from RV University." mark />
        </h2>
        <p className="lede rec-lede">
          {cards.length} organisations across six sectors engaged with our students this cycle.
          Scroll to swipe, or grab a row to browse.
        </p>
      </div>

      <div className="lm-band" role="region" aria-label="Recruiting companies">
        <LogoMarquee items={rowA} dir={-1} speed={0.28} />
        <LogoMarquee items={rowB} dir={1} speed={0.24} />
      </div>

      <div className="wrap">
        <div className="rec-upcoming">
          <span className="mono rec-up-label"><span className="rec-up-dot" /> In the pipeline</span>
          <p className="rec-up-list">
            {UPCOMING.map((c, i) => (
              <span className="rec-up-co" key={c}>{c}{i < UPCOMING.length - 1 ? <span className="sep">·</span> : null}</span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
