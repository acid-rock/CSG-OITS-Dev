import "./officers.css";
import committees from "../../config/officers-board-members";
import { Facebook, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { Officer, OutletContext } from "../../root-layout/Root-layout";
import fetchCommittees from "../../config/committeeConfig";

type Committee = {
  id: number;
  name: string;
};

const Officers = () => {
  const [committees, setCommittees] = useState<Committee[]>();
  const { officers } = useOutletContext<OutletContext>();

  useEffect(() => {
    const fetchData = async () => {
      const data = await fetchCommittees();
      console.log(data);
      setCommittees(data);
    };

    fetchData();
  }, []);

  const officials = officers?.filter((officer) => {
    return officer.is_committee_official;
  });

  function committeeOfficials(committee_id: number, officials: Officer[]) {
    if (!officials) return [];
    return officials.filter((o: Officer) => {
      return o.committee == committee_id;
    });
  }

  function committeeMembers(committee_id: number, officers: Officer[]) {
    if (!officers) return [];
    return officers.filter((o: Officer) => {
      return o.committee == committee_id;
    });
  }

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };
  return (
    <div className="officers-container">
      <div className="officers-layout">
        {committees?.map((committee: Committee, idx: number) => (
          <div key={idx} className="committee-section">
            <h2 className="committee-title">{committee.name}</h2>

            <div className="committee-layout">
              {/* Board Members Cards */}
              <div className="officials-section">
                {committeeOfficials(committee.id, officials)?.map(
                  (official, i) => (
                    <div key={i} className="officer-card">
                      <img
                        src={official.avatar}
                        alt={official.id}
                        className="officer-image"
                      />
                      <h3 className="officer-name">{official.full_name}</h3>
                      <p className="officer-title">{official.position[0]}</p>
                      <div className="social-icons">
                        <a href="#" className="social-icon">
                          <Facebook size={20} className="fb-icon" />
                        </a>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {/* Members Dropdown - Pure CSS */}
              <div className="members-section">
                <details
                  key={idx}
                  className="members-dropdown"
                  open={openIndex === idx} // Only opens if the index matches
                >
                  <summary
                    className="dropdown-toggle"
                    onClick={(e) => {
                      e.preventDefault(); // Stop default HTML behavior
                      handleToggle(idx); // Pass the current index
                    }}
                  >
                    <div className="dropdown-toggle-content">
                      Members (
                      {committeeMembers(committee.id, officers)?.length})
                      <div className="dropdown-icons">
                        {openIndex === idx ? (
                          <ChevronUp size={24} />
                        ) : (
                          <ChevronDown size={24} />
                        )}
                      </div>
                    </div>
                  </summary>
                  <div className="dropdown-content">
                    {committeeMembers(committee.id, officers || []).map(
                      (member, i) => (
                        <div key={i} className="member-item">
                          <span className="member-name">
                            {member.full_name}
                          </span>
                          <span className="member-role">
                            {member.position[0]}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </details>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Officers;
