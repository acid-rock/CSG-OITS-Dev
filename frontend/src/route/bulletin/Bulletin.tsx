import BulletinDocuments from "../../bulletin-layouts/documents/BulletinDocuments";
import LatestUpdates from "../../bulletin-layouts/latest-updates/LatestUpdates";

const Bulletin = () => {
  return (
    <div>
      <LatestUpdates />
      <BulletinDocuments />
    </div>
  );
};

export default Bulletin;
