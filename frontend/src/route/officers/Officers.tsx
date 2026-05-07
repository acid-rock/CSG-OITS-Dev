import "./officers.css";
import { useOutletContext } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";
import { useState, useEffect } from "react";
import type { Officer, OutletContext } from "../../root-layout/Root-layout";

/* ── Initials helper ── */
function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* ── Inline officer card (full control over size and layout) ── */
interface OfficerCardProps {
  officer: Officer;
  avatarSize?: number;   /* px */
  isAdviser?: boolean;
}

function OCard({ officer, avatarSize = 80, isAdviser = false }: OfficerCardProps) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => { setImgError(false); }, [officer.avatar]);

  const initials = getInitials(officer.full_name);   /* locked: full_name binding */
  const pos = Array.isArray(officer.position) ? officer.position[0] : officer.position;

  return (
    <div className="oc-card card">
      {/* Avatar — locked: avatar binding + CSG logo fallback for broken URLs */}
      <div
        className="oc-avatar"
        style={{ width: avatarSize, height: avatarSize, fontSize: avatarSize * 0.33 }}
      >
        {!officer.avatar ? (
          <div className="oc-initials" style={{ fontSize: avatarSize * 0.33 }}>
            {initials}
          </div>
        ) : imgError ? (
          <img
            src="/CSG_logo.svg"
            alt={officer.full_name}
            className="oc-avatar-img"
            onError={(e) => { e.currentTarget.src = "/CSG_logo.svg"; }}
          />
        ) : (
          <img
            src={officer.avatar}                    /* locked: avatar binding */
            alt={officer.full_name}
            className="oc-avatar-img"
            onError={() => setImgError(true)}       /* locked: onError fallback */
          />
        )}
      </div>

      {/* Text */}
      <h3 className="oc-name">{officer.full_name}</h3>  {/* locked: full_name */}
      <p className="oc-pos">{pos}</p>                    {/* locked: position */}
      {officer.year_serving && (
        <p className="oc-year">{officer.year_serving}</p>
      )}

      {/* Facebook — locked: socials binding; hidden for advisers */}
      {!isAdviser && (
        <a
          href={officer.socials || "#"}              /* locked: socials binding */
          target={officer.socials ? "_blank" : undefined}
          rel={officer.socials ? "noopener noreferrer" : undefined}
          className="oc-fb"
          style={!officer.socials ? { opacity: 0.3, cursor: "default", pointerEvents: "none" } : undefined}
          onClick={(e) => { if (!officer.socials) e.preventDefault(); }}
          aria-label={`${officer.full_name} on Facebook`}
        >
          <FaFacebook size={16} />
        </a>
      )}
    </div>
  );
}

/* ── Main Officers page ── */
const Officers = () => {
  /* ══════════════════════════════════════════
     LOCKED DATA BINDINGS — do not modify
     ══════════════════════════════════════════ */
  const { officers } = useOutletContext<OutletContext>();

  /* Group by type field — locked */
  const executives = officers?.filter((o) => o.type === "executive") ?? [];
  const board      = officers?.filter((o) => o.type === "board")     ?? [];
  const advisers   = officers?.filter((o) => o.type === "adviser")   ?? [];

  /* Find president — locked: position field */
  const president = executives.find((o) => {
    const pos = Array.isArray(o.position) ? o.position[0] : o.position;
    return /president/i.test(pos) && !/vice/i.test(pos);
  });
  const otherExecs = president
    ? executives.filter((o) => o !== president)
    : executives;

  return (
    <div className="op-page">

      {/* ════════════════════════════════════
          PAGE HEADER
          ════════════════════════════════════ */}
      <header className="op-header">
        <span className="section-label op-kicker">Elected by the student body</span>
        <h1 className="op-heading">
          Meet your <em className="italic-accent">executive</em> officers
        </h1>
        <p className="op-subtext">AY 2025–2026 · CSG-CVSU Imus Campus</p>
      </header>

      <div className="op-content">

        {/* ════════════════════════════════════
            PRESIDENT (centered, single card)
            ════════════════════════════════════ */}
        {president && (
          <div className="op-pres-wrap">
            <div className="op-pres-card card">
              {/* Badge */}
              <span className="op-pres-badge">President</span>

              {/* Avatar — 96px */}
              <div className="op-pres-avatar">
                {!president.avatar ? (
                  <div className="oc-initials op-pres-initials">
                    {getInitials(president.full_name)}
                  </div>
                ) : (
                  <img
                    src={president.avatar}                  /* locked: avatar */
                    alt={president.full_name}
                    className="oc-avatar-img"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/CSG_logo.svg"; }}
                  />
                )}
              </div>

              <h3 className="op-pres-name">{president.full_name}</h3>
              <p className="op-pres-pos">
                {Array.isArray(president.position) ? president.position[0] : president.position}
              </p>
              {president.year_serving && (
                <p className="op-pres-year">{president.year_serving}</p>
              )}
              <a
                href={president.socials || "#"}             /* locked: socials */
                target={president.socials ? "_blank" : undefined}
                rel={president.socials ? "noopener noreferrer" : undefined}
                className="oc-fb op-pres-fb"
                style={!president.socials ? { opacity: 0.3, pointerEvents: "none" } : undefined}
                onClick={(e) => { if (!president.socials) e.preventDefault(); }}
              >
                <FaFacebook size={16} />
              </a>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            EXECUTIVE OFFICERS
            ════════════════════════════════════ */}
        {otherExecs.length > 0 && (
          <div className="op-group">
            <span className="section-label op-group-label">Executive Officers</span>
            <div className="op-exec-grid">
              {otherExecs.map((o) => (
                <OCard key={o.id} officer={o} avatarSize={80} />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            BOARD MEMBERS
            ════════════════════════════════════ */}
        {board.length > 0 && (
          <div className="op-group">
            <span className="section-label op-group-label">Board Members</span>
            <div className="op-board-grid">
              {board.map((o) => (
                <OCard key={o.id} officer={o} avatarSize={80} />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ADVISERS
            ════════════════════════════════════ */}
        {advisers.length > 0 && (
          <div className="op-group">
            <span className="section-label op-group-label">Advisers</span>
            <div className="op-adviser-grid">
              {advisers.map((o) => (
                <OCard key={o.id} officer={o} avatarSize={80} isAdviser={true} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Officers;
