import "./about.css";

export default function About() {
  return (
    <section id="about" className="about-container">
      <div className="about-layout">
        {/* ── Centered section header ── */}
        <div className="about-section-head">
          <span className="section-label about-kicker">About the council</span>
          <h2 className="about-heading">
            A new era of <em className="italic-accent">student</em> leadership
          </h2>
          <p className="about-subheading">
            The Central Student Government of Cavite State University – Imus
            Campus. Committed to transparency, service, and genuine leadership
            for every kabsuhenyo.
          </p>
        </div>

        {/* ── Two-column body ── */}
        <div className="about-two-col">
          {/* LEFT: rounded image with caption overlay */}
          <div className="about-image-col">
            <div className="about-image-frame">
              <img
                src="./about1.jpg"
                alt="Central Student Government"
                className="about-image"
              />
              <div className="about-image-caption">Pusong Bayani · 2025</div>
            </div>
          </div>

          {/* RIGHT: text block */}
          <div className="about-text-col">
            <span
              className="section-label about-kicker"
              style={{ textAlign: "left" }}
            >
              Central Student Government
            </span>

            <h3 className="about-text-heading">
              A new era arises, bringing with it a new{" "}
              <em className="italic-accent">set of student leaders.</em>
            </h3>

            <p className="about-body-text">
              We&rsquo;re not just a new set of faces; we represent a new face
              of leadership—one built on genuine commitment and dedication. In a
              time when the passion to lead may have dimmed for some, we stand
              ready to reignite that fire.
            </p>

            {/* Static blockquote */}
            <blockquote className="about-blockquote">
              <span className="about-blockquote-mark">&ldquo;
                <p className="about-blockquote-text">
                Para sa kabsuhenyo,{" "}
                <span className="about-blockquote-highlight">puso</span> ang
                magiging sentro ng serbisyo.
              </p></span>
            </blockquote>

            <p className="about-body-text">
              This new term is driven by a deep sense of purpose, ensuring that
              every initiative, decision, and program is rooted in the true
              needs and aspirations of every kabsuhenyo. Our promise is simple
              yet powerful: to bring empathy, dedication, and true care to the
              forefront of our work. Our mission is to lead not just with our
              minds, but with our deepest convictions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
