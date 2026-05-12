import "./officers.css";
import { useOutletContext } from "react-router-dom";
import { FaFacebook } from "react-icons/fa";
import { useState, useEffect } from "react";
import axios from "axios";
import type { Officer, OutletContext } from "../../root-layout/Root-layout";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import SearchFilterBar from "../../components/search-filter-bar/SearchFilterBar";

const API_URL = import.meta.env.VITE_API_URL as string;

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

  const [committees, setCommittees] = useState<{ id: number; name: string }[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<{ id: number; name: string } | null>(null);
  const [officerSearch, setOfficerSearch] = useState("");
  const [officerTerm, setOfficerTerm] = useState("");
  useLockBodyScroll(!!selectedCommittee);

  const officerTermOptions = [...new Set(officers.map((o) => o.year_serving).filter(Boolean))].sort().reverse() as string[];

  useEffect(() => {
    axios.get(`${API_URL}/committees`).then(({ data }) => setCommittees(data)).catch(() => {});
  }, []);

  /* Filter by search + term */
  const filteredOfficers = officers?.filter((o) => {
    const matchesSearch = !officerSearch || (
      o.full_name.toLowerCase().includes(officerSearch.toLowerCase()) ||
      (Array.isArray(o.position) ? o.position[0] : o.position).toLowerCase().includes(officerSearch.toLowerCase())
    );
    const matchesTerm = !officerTerm || o.year_serving === officerTerm;
    return matchesSearch && matchesTerm;
  }) ?? [];

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
            COMMITTEES
            ════════════════════════════════════ */}
        {committees.length > 0 && (
          <div className="op-group">
            <span className="section-label op-group-label">Committees</span>
            <div className="op-committee-grid">
              {committees.map((c) => {
                const head = officers.find(
                  (o) => o.committee === c.id && o.is_committee_official
                );
                return (
                  <div
                    key={c.id}
                    className="op-committee-card card op-committee-card-clickable"
                    onClick={() => setSelectedCommittee(c)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedCommittee(c)}
                  >
                    <p className="op-committee-name">{c.name}</p>
                    {head && (
                      <p className="op-committee-head">{head.full_name}</p>
                    )}
                    <span className="op-committee-view">View members →</span>
                  </div>
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
