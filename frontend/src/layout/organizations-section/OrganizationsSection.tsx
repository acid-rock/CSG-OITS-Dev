import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";
import type { Organization } from "../../config/organizationsConfig";
import OrganizationCard from "../../components/organization-card/OrganizationCard";
import OrganizationModal from "../../components/organization-card/OrganizationModal";
import "./OrganizationsSection.css";

const ORG_GROUPS: { key: Organization["org_type"]; label: string }[] = [
  { key: "academic", label: "Academic Organizations" },
  { key: "non-academic", label: "Non-Academic Organizations" },
  { key: "spu", label: "Student Publication Unit" },
];

export default function OrganizationsSection() {
  const { organizations } = useOutletContext<OutletContext>();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const grouped = ORG_GROUPS.map((group) => ({
    ...group,
    items: organizations.filter((o) => o.org_type === group.key),
  })).filter((group) => group.items.length > 0);

  const ungrouped = organizations.filter(
    (o) => !ORG_GROUPS.some((g) => g.key === o.org_type),
  );

  return (
    <section id="organizations" className="orgs-section">
      <div className="orgs-inner">
        <p className="section-label orgs-kicker">Student organizations</p>
        <h2 className="orgs-heading">Recognized Student Organizations</h2>
        <p className="orgs-sub">
          Student organizations recognized by the Central Student Government of
          Cavite State University – Imus Campus.
        </p>

        {organizations.length === 0 ? (
          <div className="orgs-empty">
            <p>No organizations listed yet.</p>
          </div>
        ) : (
          <div className="orgs-groups">
            {grouped.map((group) => (
              <div key={group.key} className="orgs-group">
                <h3 className="orgs-group-heading">{group.label}</h3>
                <div className="orgs-grid">
                  {group.items.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      organization={org}
                      onClick={() => setSelectedOrg(org)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {ungrouped.length > 0 && (
              <div className="orgs-group">
                <h3 className="orgs-group-heading">Other Organizations</h3>
                <div className="orgs-grid">
                  {ungrouped.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      organization={org}
                      onClick={() => setSelectedOrg(org)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedOrg && (
        <OrganizationModal
          organization={selectedOrg}
          isOpen={true}
          onClose={() => setSelectedOrg(null)}
        />
      )}
    </section>
  );
}
