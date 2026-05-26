import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../root-layout/Root-layout";
import type { Organization } from "../../config/organizationsConfig";
import OrganizationCard from "../../components/organization-card/OrganizationCard";
import OrganizationModal from "../../components/organization-card/OrganizationModal";
import SpecialUnitCard from "../../components/organization-card/SpecialUnitCard";
import "./OrganizationsSection.css";

export default function OrganizationsSection() {
  const { organizations } = useOutletContext<OutletContext>();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Build a parent_id → children[] lookup for badge counts and modal detail
  const subOrgMap = new Map<string, Organization[]>();
  for (const org of organizations) {
    if (org.parent_id) {
      const siblings = subOrgMap.get(org.parent_id) ?? [];
      siblings.push(org);
      subOrgMap.set(org.parent_id, siblings);
    }
  }

  // Only show top-level orgs in the grid; sub-orgs surface via their parent card
  const topLevel = organizations.filter((o) => !o.parent_id);

  const academic     = topLevel.filter((o) => o.org_type === "academic");
  const nonAcademic  = topLevel.filter((o) => o.org_type === "non-academic");
  const specialUnits = topLevel.filter(
    (o) => o.org_type === "spu" || o.org_type === "rotc",
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

            {/* Academic */}
            {academic.length > 0 && (
              <div className="orgs-group">
                <h3 className="orgs-group-heading">Academic Organizations</h3>
                <div className="orgs-grid">
                  {academic.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      organization={org}
                      subOrgsCount={subOrgMap.get(org.id)?.length ?? 0}
                      onClick={() => setSelectedOrg(org)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Non-Academic */}
            {nonAcademic.length > 0 && (
              <div className="orgs-group">
                <h3 className="orgs-group-heading">Non-Academic Organizations</h3>
                <div className="orgs-grid">
                  {nonAcademic.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      organization={org}
                      subOrgsCount={subOrgMap.get(org.id)?.length ?? 0}
                      onClick={() => setSelectedOrg(org)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Publication & ROTC — side by side */}
            {specialUnits.length > 0 && (
              <div className="orgs-group">
                <h3 className="orgs-group-heading">Publication &amp; ROTC</h3>
                <div className="su-grid">
                  {specialUnits.map((org) => (
                    <SpecialUnitCard
                      key={org.id}
                      org={org}
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
          subOrgs={subOrgMap.get(selectedOrg.id) ?? []}
        />
      )}
    </section>
  );
}
