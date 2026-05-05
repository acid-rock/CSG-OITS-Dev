# Officer Section — JSX additions

Pull the president out of the grid and wrap with `.officer-pres` + add a "President" crown badge.

## In `layout/officer-layout/Officer.tsx` (the homepage section)

```tsx
import "./officer.css";
import OfficerCard from "../../components/officer-card/Officer-card";
import { officerConfig } from "../../config/officerConfig"; // your existing config

export default function Officer() {
  const president = officerConfig.find(o => /president/i.test(o.position) && !/vice/i.test(o.position));
  const others = officerConfig.filter(o => o !== president);

  return (
    <section className="officer-section" id="officers">
      <div className="section-head">
        <div className="kicker">Elected by the student body</div>
        <h2>Meet your <em>executive</em> officers</h2>
        <p>AY 2025–2026 · CSG-CVSU Imus Campus</p>
      </div>

      {president && (
        <div className="officer-pres">
          <article className="officer-card is-president">
            <span className="officer-pres-crown">President</span>
            <OfficerCard {...president} />
          </article>
        </div>
      )}

      <div className="officers-grid">
        {others.map(o => (
          <OfficerCard key={o.name} {...o} />
        ))}
      </div>
    </section>
  );
}
```

## In `components/officer-card/Officer-card.tsx`

Make sure the rendered markup uses the canonical class names so the new CSS applies:

```tsx
return (
  <article className="officer-card">
    <div className="officer-avatar">
      {avatarUrl ? <img src={avatarUrl} alt={name} /> : initials}
    </div>
    <h3 className="officer-name">{name}</h3>
    <p className="officer-pos">{position}</p>
    <p className="officer-term">{term}</p>
    {fbUrl && <a className="officer-fb" href={fbUrl} target="_blank" rel="noreferrer">f</a>}
  </article>
);
```

If your existing component already wraps its own `<article>`, the wrapping `<article className="officer-card is-president">` in the section file will conflict — instead, pass a `variant="president"` prop and conditionally apply the class inside the card.
