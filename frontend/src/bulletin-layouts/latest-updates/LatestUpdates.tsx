import "./latestupdates.css";
import Typography from "../../components/typography/Typography";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";

const LatestUpdates = () => {
  const { bulletin } = useOutletContext<OutletContext>();
  if (!bulletin.length) {
    return null;
  }
  const latest = [...bulletin]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="latest-container">
      <div className="latest-layout">
        <div className="latest-content">
          <div className="content-text">
            <Typography color="text-dark" size="text-xl">
              Latest Updates
            </Typography>
            <Typography
              color="text-dark"
              size="text-s"
              style={{ fontWeight: "normal" }}
            >
              Stay informed with the most recent documents and announcements
              from the Central Student Government of CvSU-Imus Campus.
            </Typography>
          </div>
          <div className="content-cards-container">
            {latest.map((ann) => (
              <div key={ann.id} className="content-cards">
                {/* Left: Title and Category */}
                <div className="card-left">
                  <h3 className="card-title">{ann.title}</h3>
                </div>

                {/* Center: Date */}
                <div className="card-center">
                  <span className="card-date">
                    {ann.date ? formatDate(ann.date) : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestUpdates;
