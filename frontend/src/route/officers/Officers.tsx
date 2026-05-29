import "./officers.css";
import "../committees/committees.css";
import { FaFacebook } from "react-icons/fa";
import { useState, useEffect } from "react";
import type { Officer, CommitteeMembership } from "../../root-layout/Root-layout";
import type { Committee } from "../../config/committeeConfig";
import fetchOfficers from "../../config/officerConfig";
import fetchCommittees from "../../config/committeeConfig";
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
  // Only show the primary position — strip anything after the first comma so
  // officers whose position field contains multiple roles (legacy data) only
  // display the first/highest one (e.g. "SAP IT" not "SAP IT, WebDev Chair…")
  const rawPos = Array.isArray(officer.position) ? officer.position[0] : officer.position;
  const pos = rawPos?.split(",")[0]?.trim() ?? rawPos;

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
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    fetchOfficers(undefined, undefined, undefined, 'all').then((r) => setOfficers(r as Officer[])).catch(console.error);
    fetchCommittees().then(setCommittees).catch(console.error);
  }, []);

  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [officerSearch, setOfficerSearch] = useState("");
  const [officerTerm, setOfficerTerm] = useState("");
  useLockBodyScroll(!!selectedCommittee);

  const officerTermOptions = [...new Set(officers.map((o) => o.year_serving).filter(Boolean))].sort().reverse() as string[];

  /* Only show current active officers publicly.
     - type="former"   → admin-only; hidden from all public pages
     - status="archived" → end-of-term retired; hidden from all public pages */
  const activeOfficers = officers?.filter(
    (o) => o.status !== "archived" && o.type !== "former",
  ) ?? [];

  /* Filter by search + term — active only */
  const filteredOfficers = activeOfficers.filter((o) => {
    const matchesSearch = !officerSearch || (
      o.full_name.toLowerCase().includes(officerSearch.toLowerCase()) ||
      (Array.isArray(o.position) ? o.position[0] : o.position).split(",")[0].trim().toLowerCase().includes(officerSearch.toLowerCase())
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

  /* Canonical executive hierarchy (VP Internal → VP External → Secretary →
     Treasurer → Auditor → PRO → anything else alphabetically) */
  const EXEC_RANK: RegExp[] = [
    /vice.{0,20}president.{0,20}internal/i,
    /vice.{0,20}president.{0,20}external/i,
    /\bsecretary\b/i,
    /treasurer/i,
    /auditor/i,
    /public[\s-]*relation/i,
  ];
  const execRank = (o: Officer): number => {
    const pos = (Array.isArray(o.position) ? o.position[0] : o.position) ?? '';
    const idx = EXEC_RANK.findIndex((rx) => rx.test(pos));
    return idx === -1 ? EXEC_RANK.length : idx;
  };
  const sortedExecs = [...otherExecs].sort((a, b) => {
    const diff = execRank(a) - execRank(b);
    if (diff !== 0) return diff;
    // Stable: officers with the same rank keep their original order
    return otherExecs.indexOf(a) - otherExecs.indexOf(b);
  });

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
                {(Array.isArray(president.position) ? president.position[0] : president.position)?.split(",")[0]?.trim()}
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
        {sortedExecs.length > 0 && (
          <div className="op-group">
            <span className="section-label op-group-label">Executive Officers</span>
            <div className="op-exec-grid">
              {sortedExecs.map((o) => (
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

        {/* Former members (type="former") are intentionally not shown publicly */}

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
                  // Use committee_memberships junction table (prefer) or legacy committee field
                  const membersInCommittee = officers.filter((o) =>
                    o.committee_memberships && o.committee_memberships.length > 0
                      ? o.committee_memberships.some((m: CommitteeMembership) => m.committee_id === c.id)
                      : o.committee === c.id,
                  );
                  const headOfficer = membersInCommittee.find((o) =>
                    o.committee_memberships && o.committee_memberships.length > 0
                      ? o.committee_memberships.some((m: CommitteeMembership) => m.committee_id === c.id && m.is_official)
                      : o.is_committee_official,
                  );
                  const chairName = c.chair_name || headOfficer?.full_name || null;
                  const memberCount = membersInCommittee.length;
                  const chairInitials = chairName
                    ? chairName.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                    : "??";
                  // Look up the chair's avatar from the officers list
                  // Use case-insensitive trimmed match so minor name discrepancies
                  // between committees.chair_name and officers.full_name still resolve.
                  const chairNameNorm = chairName?.trim().toLowerCase() ?? '';
                  const chairOfficer = chairName
                    ? (officers.find((o) => o.full_name === chairName) ??
                       officers.find((o) => o.full_name.trim().toLowerCase() === chairNameNorm))
                    : null;
                  const chairAvatar = chairOfficer?.avatar ?? null;

                  return (
                    <article
                      key={c.id}
                      className="cc-card cc-card--banner"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCommittee(c)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedCommittee(c)}
                    >
                      {/* Cover photo or CSG-logo placeholder */}
                      {c.cover_image_url ? (
                        <div
                          className="cc-photo"
                          style={{ backgroundImage: `url(${c.cover_image_url})` }}
                          role="img"
                          aria-label="Committee cover photo"
                        />
                      ) : (
                        <div className="cc-photo cc-photo--logo" role="img" aria-label="No committee photo">
                          <img src="/CSG_logo.svg" alt="CSG" className="cc-photo-logo-img" />
                        </div>
                      )}

                      <div className="cc-card-body">
                        <h3 className="cc-card-title">{c.name}</h3>
                        {c.description && (
                          <p className="cc-card-desc">{c.description}</p>
                        )}
                        <div className="cc-chair">
                          {chairAvatar ? (
                            <img
                              src={chairAvatar}
                              alt={chairName ?? "Chair"}
                              className="cc-chair-photo"
                              onError={(e) => {
                                // Fall back to initials circle on broken URL
                                const el = e.currentTarget as HTMLImageElement;
                                el.style.display = "none";
                                const next = el.nextElementSibling as HTMLElement | null;
                                if (next) next.style.display = "inline-flex";
                              }}
                            />
                          ) : null}
                          <span
                            className="cc-avatar"
                            style={{
                              width: 28, height: 28, fontSize: 28 * 0.34,
                              display: chairAvatar ? "none" : "inline-flex",
                            }}
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

          {/* Committee cover image */}
          {selectedCommittee.cover_image_url && (
            <div className="op-cm-cover">
              <img
                src={selectedCommittee.cover_image_url}
                alt={selectedCommittee.name}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}

          <h2 className="op-committee-modal-title">{selectedCommittee.name}</h2>
          {selectedCommittee.description && (
            <p className="op-cm-desc">{selectedCommittee.description}</p>
          )}

          {/* Members — ordered: Chairperson → Vice-Chairperson → Others → Plain members */}
          {(() => {
            const committeeId = selectedCommittee.id;

            // Prefer junction table; fall back to legacy officers.committee field
            const members = officers.filter((o) =>
              o.committee_memberships && o.committee_memberships.length > 0
                ? o.committee_memberships.some((m: CommitteeMembership) => m.committee_id === committeeId)
                : o.committee === committeeId,
            );

            // Role title resolution — priority order:
            // 1. chair_name / vice_chair_name match (authoritative, set in Committees admin panel)
            // 2. Junction table role_title (custom roles via OfficerForm memberships)
            // 3. Fallback: "Committee Official" or "Member"
            const roleTitle = (o: Officer) => {
              const norm = (s: string) => s.trim().toLowerCase();
              if (selectedCommittee.chair_name &&
                  (o.full_name === selectedCommittee.chair_name ||
                   norm(o.full_name) === norm(selectedCommittee.chair_name))) {
                return "Chairperson";
              }
              if (selectedCommittee.vice_chair_name &&
                  (o.full_name === selectedCommittee.vice_chair_name ||
                   norm(o.full_name) === norm(selectedCommittee.vice_chair_name))) {
                return "Vice-Chairperson";
              }
              if (o.committee_memberships && o.committee_memberships.length > 0) {
                const m = o.committee_memberships.find((m: CommitteeMembership) => m.committee_id === committeeId);
                if (m) return m.role_title;
              }
              return o.is_committee_official ? "Committee Official" : "Member";
            };

            // Sort: Chairperson first, Vice-Chairperson second, other officials/custom roles
            // third, plain "Member" entries last.
            const rankRole = (role: string) => {
              if (role === "Chairperson")      return 0;
              if (role === "Vice-Chairperson") return 1;
              if (role === "Member")           return 3;
              return 2; // custom roles / "Committee Official"
            };

            const sorted = [...members].sort((a, b) =>
              rankRole(roleTitle(a)) - rankRole(roleTitle(b))
            );

            return (
              <>
                {sorted.length > 0 && (
                  <div className="op-cm-section">
                    <p className="op-cm-section-label">Committee Members</p>
                    {sorted.map((o) => (
                      <div key={o.id} className="op-cm-row">
                        <img
                          src={o.avatar || "/CSG_logo.svg"}
                          alt={o.full_name}
                          className="op-cm-avatar"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/CSG_logo.svg"; }}
                        />
                        <div>
                          <p className="op-cm-name">{o.full_name}</p>
                          <p className="op-cm-pos">{roleTitle(o)}</p>
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
