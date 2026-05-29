import "./about-page.css";
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";
import fetchOfficers from "../../config/officerConfig";
import fetchCommittees from "../../config/committeeConfig";

export default function AboutPage() {
  const { documents } = useOutletContext<OutletContext>();
  const [officerCount, setOfficerCount] = useState(0);
  const [committeeCount, setCommitteeCount] = useState(0);

  useEffect(() => {
    fetchOfficers().then((data) => setOfficerCount(data.length)).catch(console.error);
    fetchCommittees().then((data) => setCommitteeCount(data.length)).catch(console.error);
  }, []);

  return (
    <div className="ap-page">
      {/* ══ SECTION 1: Header ══ */}
      <header className="ap-header">
        <span className="section-label ap-kicker">About the council</span>
        <h1 className="ap-heading">
          A new era of <em className="italic-accent">student</em> leadership
        </h1>
        <p className="ap-subheading">
          Learn more about the Central Student Government — who we are, what
          drives us, and the promise we make to every kabsuhenyo.
        </p>
      </header>

      {/* ══ SECTION 2: Two column ══ */}
      <section className="ap-section ap-two-col">
        {/* LEFT: image */}
        <div className="ap-img-col">
          <div className="ap-img-frame">
            <img
              src="/about1.jpg"
              alt="Central Student Government"
              className="ap-img"
            />
            <div className="ap-img-caption">Pusong Bayani · 2025</div>
          </div>
        </div>

        {/* RIGHT: text */}
        <div className="ap-text-col">
          <span
            className="section-label"
            style={{
              textAlign: "left",
              display: "block",
              marginBottom: "var(--space-3)",
            }}
          >
            Central Student Government
          </span>
          <h2 className="ap-text-heading">
            A new era arises, bringing with it a new{" "}
            <em className="italic-accent">set of student leaders.</em>
          </h2>
          <p className="ap-body">
            We&rsquo;re not just a new set of faces — we represent a new face of
            leadership, one built on genuine commitment and dedication. In a
            time when the passion to lead may have dimmed for some, we stand
            ready to reignite that fire.
          </p>
          <blockquote className="ap-blockquote">
            <p className="ap-quote-text">
              <span className="ap-quote-mark">&ldquo;</span>
              Para sa kabsuhenyo,{" "}
              <strong style={{ color: "var(--color-primary)" }}>puso</strong>{" "}
              ang magiging sentro ng serbisyo.
              <span className="ap-quote-mark">&ldquo;</span>
            </p>
          </blockquote>
          <p className="ap-body">
            This new term is driven by a deep sense of purpose. Every
            initiative, decision, and program is rooted in the true needs and
            aspirations of every kabsuhenyo — empathy, dedication, and true
            care, at the forefront of our work.
          </p>
        </div>
      </section>

      {/* ══ SECTION 3: Three pillars ══ */}
      <section className="ap-section ap-pillars-section">
        <p className="ap-pillars-eyebrow">Three pillars</p>
        <h2 className="ap-pillars-heading">What we stand for</h2>
        <div className="ap-pillars-grid">
          <div className="ap-pillar card">
            <div className="ap-pillar-icon">M</div>
            <h3 className="ap-pillar-title">Our Mandate</h3>
            <p className="ap-pillar-body">
              Represent the interests of every CVSU-Imus student through
              transparent governance, advocacy, and accountable stewardship of
              student funds.
            </p>
            <ul className="ap-pillar-list">
              <li>Transparent decision-making</li>
              <li>Open student forums</li>
              <li>Audited financial reports</li>
            </ul>
          </div>

          <div className="ap-pillar card">
            <div className="ap-pillar-icon">V</div>
            <h3 className="ap-pillar-title">Our Vision</h3>
            <p className="ap-pillar-body">
              A council that is approachable, responsive, and rooted in the
              everyday concerns of the campus community it serves.
            </p>
            <ul className="ap-pillar-list">
              <li>Open-door policy</li>
              <li>Weekly office hours</li>
              <li>Direct line to officers</li>
            </ul>
          </div>

          <div className="ap-pillar card">
            <div className="ap-pillar-icon">P</div>
            <h3 className="ap-pillar-title">Our Priorities</h3>
            <p className="ap-pillar-body">
              Practical wins this term — focused on the things students told us
              matter most during last year&rsquo;s listening sessions.
            </p>
            <ul className="ap-pillar-list">
              <li>Mental health support</li>
              <li>Equipment access</li>
              <li>Inter-org collaboration</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4: Stats bar — live data from outlet context ══ */}
      <section className="ap-section">
        <div className="ap-stats">
          <div className="ap-stat">
            <div className="ap-stat-value">{officerCount}</div>
            <div className="ap-stat-label">Officers serving</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-value">{committeeCount}</div>
            <div className="ap-stat-label">Active committees</div>
          </div>
          <div className="ap-stat">
            <div className="ap-stat-value">{documents.length}</div>
            <div className="ap-stat-label">Public filings</div>
          </div>
          <div className="ap-stat">
            {/* No live source for enrolled students — static */}
            <div className="ap-stat-value">5,200+</div>
            <div className="ap-stat-label">Students represented</div>
          </div>
        </div>
      </section>
    </div>
  );
}
