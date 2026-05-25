import "./officers.css";
import "../committees/committees.css";
import { useOutletContext } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";
import { useState, useEffect } from "react";
import type { Officer, OutletContext, Committee } from "../../root-layout/Root-layout";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";

const CommitteeArrow = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

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
  const { officers, committees } = useOutletContext<OutletContext>();

  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [officerSearch, setOfficerSearch] = useState("");
  const [officerTerm, setOfficerTerm] = useState("");
  useLockBodyScroll(!!selectedCommittee);

  const officerTermOptions = [...new Set(officers.map((o) => o.year_serving).filter(Boolean))].sort().reverse() as string[];

  /* Separate active from former/archived */
  const activeOfficers = officers?.filter((o) => o.status !== "archived") ?? [];
  const formerOfficers = officers?.filter((o) => o.status === "archived") ?? [];

  /* Filter by search + term — active only */
  const filteredOfficers = activeOfficers.filter((o) => {
    const matchesSearch = !officerSearch || (
      o.full_name.toLowerCase().includes(officerSearch.toLowerCase()) ||
      (Array.isArray(o.position) ? o.position[0] : o.position).toLowerCase().includes(officerSearch.toLowerCase())
    );
    const matchesTerm = !officerTerm || o.year_serving === officerTerm;
    return matchesSearch && matchesTerm;
  });

  /* Group by type field — locked */
  const executives = filteredOfficers.filter((o) => o.type === "executive");
  const board      = filteredOfficers.filter((o) => o.type === "board");
  const advisers   = filteredOfficers.filter((o) => o.type === "adviser");

  /* Find president — locked: position field */
  const president = executives.find((o) => {
    const pos = Array.isArray(o.position) ? o.position[0] : o.position;
    return /president/i.test(pos) && !/vice/i.test(pos);
  });
  const otherExecs = president
    ? executives.filter((o) => o !== president)
    : executives;

  return (
    <>
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

      {/* Search + Term filter */}
      <div className="bl-toolbar-wrap">
        <div style={{ maxWidth: 600, margin: "0 auto", width: "100%", padding: "0 var(--section-padding-x)" }}>
          <SearchFilterBar
            searchValue={officerSearch}
            onSearchChange={setOfficerSearch}
            termValue={officerTerm}
            onTermChange={setOfficerTerm}
            termOptions={officerTermOptions}
            searchPlaceholder="Search officers..."
          />
        </div>
      </div>

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

        {/* ════════════════════════════════════
            FORMER MEMBERS (archived / terminated)
            ════════════════════════════════════ */}
        {formerOfficers.length > 0 && (
          <div className="op-group">
            <span className="section-label op-group-label" style={{ color: "var(--color-text-muted)" }}>
              Former Members
            </span>
            <div className="op-exec-grid">
              {formerOfficers.map((o) => (
                <div key={o.id} style={{ position: "relative" }}>
                  <OCard key={o.id} officer={o} avatarSize={80} />
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      background: "var(--color-text-muted, #6b7280)",
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      padding: "3px 7px",
                      borderRadius: 999,
                    }}
                  >
                    Former
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            COMMITTEES — CommitteesV1 banner cards
            ════════════════════════════════════ */}
        {committees.filter((c) => c.status === "active" && !c.deleted_at).length > 0 && (
          <div className="cc-section" style={{ padding: "48px 0 0" }}>
            <header className="cc-section-head">
              <span className="cc-kicker">COMMITTEES</span>
              <h2>
                Ten committees, <em>one</em> CSG.
              </h2>
              <p>Each committee runs the day-to-day work behind a slice of student life.</p>
            </header>

            <div className="cc-grid cc-grid--banner">
              {committees
                .filter((c) => c.status === "active" && !c.deleted_at)
                .map((c: Committee) => {
                  const headOfficer = officers.find(
                    (o) => o.committee === c.id && o.is_committee_official,
                  );
                  const chairName = c.chair_name || headOfficer?.full_name || null;
                  const memberCount = officers.filter((o) => o.committee === c.id).length;
                  const chairInitials = chairName
                    ? chairName.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                    : "??";

                  return (
                    <article
                      key={c.id}
                      className="cc-card cc-card--banner"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCommittee(c)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedCommittee(c)}
                    >
                      {/* Cover photo or striped fallback */}
                      {c.cover_image_url ? (
                        <div
                          className="cc-photo"
                          style={{ backgroundImage: `url(${c.cover_image_url})` }}
                          role="img"
                          aria-label="Committee cover photo"
                        />
                      ) : (
                        <div className="cc-photo cc-photo--ph" role="img" aria-label="Committee placeholder">
                          <span className="cc-photo-mark">{chairInitials}</span>
                        </div>
                      )}

                      <div className="cc-card-body">
                        <h3 className="cc-card-title">{c.name}</h3>
                        <div className="cc-chair">
                          <span
                            className="cc-avatar"
                            style={{ width: 28, height: 28, fontSize: 28 * 0.34 }}
                          >
                            {chairInitials}
                          </span>
                          <div className="cc-chair-text">
                            <span className="cc-chair-label">Chaired by</span>
                            <span className="cc-chair-name">{chairName ?? "Unassigned"}</span>
                          </div>
                        </div>
                        <div className="cc-card-foot">
                          <span className="cc-count">
                            {memberCount} <span>members</span>
                          </span>
                          <span className="cc-link">
                            View members <CommitteeArrow />
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>
          </div>
        )}

      </div>
    </div>

    {/* Committee members modal */}
    {selectedCommittee && (
      <div
        className="op-committee-modal-overlay"
        onClick={() => setSelectedCommittee(null)}
      >
        <div
          className="op-committee-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="op-committee-modal-close"
            onClick={() => setSelectedCommittee(null)}
            aria-label="Close"
          >×</button>
          <h2 className="op-committee-modal-title">{selectedCommittee.name}</h2>

          {/* Officials first */}
          {(() => {
            const members = officers.filter((o) => o.committee === selectedCommittee.id);
            const officials = members.filter((o) => o.is_committee_official);
            const regulars  = members.filter((o) => !o.is_committee_official);
            return (
              <>
                {officials.length > 0 && (
                  <div className="op-cm-section">
                    <p className="op-cm-section-label">Officials</p>
                    {officials.map((o) => (
                      <div key={o.id} className="op-cm-row">
                        <img
                          src={o.avatar || "/CSG_logo.svg"}
                          alt={o.full_name}
                          className="op-cm-avatar"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/CSG_logo.svg"; }}
                        />
                        <div>
                          <p className="op-cm-name">{o.full_name}</p>
                          <p className="op-cm-pos">{Array.isArray(o.position) ? o.position[0] : o.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {regulars.length > 0 && (
                  <div className="op-cm-section">
                    <p className="op-cm-section-label">Members</p>
                    {regulars.map((o) => (
                      <div key={o.id} className="op-cm-row">
                        <img
                          src={o.avatar || "/CSG_logo.svg"}
                          alt={o.full_name}
                          className="op-cm-avatar"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/CSG_logo.svg"; }}
                        />
                        <div>
                          <p className="op-cm-name">{o.full_name}</p>
                          <p className="op-cm-pos">{Array.isArray(o.position) ? o.position[0] : o.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {members.length === 0 && (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>No members assigned.</p>
                )}
              </>
            );
          })()}
        </div>
      </div>
    )}
    </>
  );
};

export default Officers;
