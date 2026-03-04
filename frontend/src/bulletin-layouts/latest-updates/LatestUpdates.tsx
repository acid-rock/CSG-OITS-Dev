import "./latestupdates.css";
import Typography from "../../components/typography/Typography";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";

const LatestUpdates = () => {
  const { documents } = useOutletContext<OutletContext>();
  console.log(documents);
  if (!documents.length) {
    return null;
  }
  const latest = [...documents]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 3);

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
            {latest.map((doc) => (
              <div key={doc.id} className="content-cards">
                <div className="cards-link">
                  <a href="/bulletin">{doc.category}</a>
                </div>
                <div className="cards-text">
                  <Typography color="text-dark" size="text-xs">
                    {doc.description.length > 160
                      ? doc.description.slice(0, 160) + "..."
                      : doc.description}
                  </Typography>
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
