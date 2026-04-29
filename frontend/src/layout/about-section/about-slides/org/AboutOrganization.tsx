import { useState } from "react";
import "./AboutOrganization.css";
import Typography from "../../../../components/typography/Typography";

const organizations = [
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 3,
    name: "Organization 3",
    image: "https://cdn-icons-png.flaticon.com/512/4436/4436481.png",
    description:
      "Organization 3 promotes cultural awareness and appreciation through events, performances, and advocacy.",
    type: "Cultural",
  },
  {
    id: 4,
    name: "Organization 4",
    image: "https://cdn-icons-png.flaticon.com/512/1087/1087815.png",
    description:
      "Organization 4 drives innovation and technology initiatives, empowering members with modern skills.",
    type: "Technology",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 3,
    name: "Organization 3",
    image: "https://cdn-icons-png.flaticon.com/512/4436/4436481.png",
    description:
      "Organization 3 promotes cultural awareness and appreciation through events, performances, and advocacy.",
    type: "Cultural",
  },
  {
    id: 4,
    name: "Organization 4",
    image: "https://cdn-icons-png.flaticon.com/512/1087/1087815.png",
    description:
      "Organization 4 drives innovation and technology initiatives, empowering members with modern skills.",
    type: "Technology",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 3,
    name: "Organization 3",
    image: "https://cdn-icons-png.flaticon.com/512/4436/4436481.png",
    description:
      "Organization 3 promotes cultural awareness and appreciation through events, performances, and advocacy.",
    type: "Cultural",
  },
  {
    id: 4,
    name: "Organization 4",
    image: "https://cdn-icons-png.flaticon.com/512/1087/1087815.png",
    description:
      "Organization 4 drives innovation and technology initiatives, empowering members with modern skills.",
    type: "Technology",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 3,
    name: "Organization 3",
    image: "https://cdn-icons-png.flaticon.com/512/4436/4436481.png",
    description:
      "Organization 3 promotes cultural awareness and appreciation through events, performances, and advocacy.",
    type: "Cultural",
  },
  {
    id: 4,
    name: "Organization 4",
    image: "https://cdn-icons-png.flaticon.com/512/1087/1087815.png",
    description:
      "Organization 4 drives innovation and technology initiatives, empowering members with modern skills.",
    type: "Technology",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
  {
    id: 1,
    name: "Organization 1",
    image: "https://cdn-icons-png.flaticon.com/512/3050/3050159.png",
    description:
      "Organization 1 is dedicated to fostering leadership and excellence among students through various programs and activities.",
    type: "Academic",
  },
  {
    id: 2,
    name: "Organization 2",
    image: "https://cdn-icons-png.flaticon.com/512/3556/3556098.png",
    description:
      "Organization 2 focuses on community service and outreach, building meaningful connections across the campus.",
    type: "Community",
  },
];

const AboutOrganization = () => {
  const [selected, setSelected] = useState<number | null>(null);

  const selectedOrg = organizations.find((o) => o.id === selected);

  return (
    <div className="about-organization-container">
      <div className="about-texts">
        <Typography size="text-lg" color="text-dark">
          Organizations
        </Typography>
        <Typography size="text-sm" color="text-dark">
          Get to know the CVSU-Imus organizations.
        </Typography>
      </div>
      <div className="organization-main">
        {/* Sidebar */}
        <div className="organization-list">
          {organizations.map((data) => (
            <div
              key={data.id}
              className={`organization-details ${selected === data.id ? "active" : ""}`}
              onClick={() => setSelected(data.id)}
            >
              <img src={data.image} alt={data.name} />
            </div>
          ))}
        </div>
        {/* Overview */}
        <div className="organization-overview">
          {selectedOrg ? (
            <div className="overview-content">
              <img
                className="overview-logo"
                src={selectedOrg.image}
                alt={selectedOrg.name}
              />
              <p className="overview-name">{selectedOrg.name}</p>
              <span className="overview-badge">{selectedOrg.type}</span>
              <div className="overview-divider" />
              <p className="overview-details">{selectedOrg.description}</p>
            </div>
          ) : (
            <div className="overview-empty">
              <div className="overview-empty-icon">🏛️</div>
              <span>Select an organization to view details</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutOrganization;
