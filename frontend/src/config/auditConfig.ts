import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;

export default async function fetchAudit() {
  const { data: logs } = await axios.get(`${API_URL}/auditlogs`);
  const { data: profiles } = await axios.get(`${API_URL}/user/`);

  // Helper
  function capitalize(word: string) {
    if (!word) return "";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  console.log(logs);
  console.log(profiles);

  const data = logs.map((log: any) => {
    let filename;
    if (log.action === "DELETE") {
      if (log.entity === "documents") {
        filename = log.old_data.file_path;
      } else if (log.entity === "events") {
        filename = log.old_data.name;
      } else if (log.entity === "bulletin") {
        filename = log.old_data.image;
      } else {
        filename = "N/A";
      }
    } else if (log.action === "UPDATE" || log.action === "INSERT") {
      if (log.entity === "documents") {
        filename = log.new_data.file_path;
      } else if (log.entity === "events") {
        filename = log.new_data.name;
      } else if (log.entity === "bulletin") {
        filename = log.new_data.image;
      } else {
        filename = "N/A";
      }
    }

    const user =
      profiles.find((profile: any) => profile.owner_id === log.created_by)
        ?.full_name || "Unknown User";
    const role =
      profiles.find((profile: any) => profile.owner_id === log.created_by)
        ?.role || "Unknown Role";
    return {
      user: user,
      role: capitalize(role),
      fileName: filename,
      description: log.action,
      date: log.created_at,
    };
  });

  // const data = logs.map((log: any) => {
  //   let filename;
  //   if (log.action === "DELETE") {
  //     if (log.entity === "documents") {
  //       filename = log.old_data.file_path.split("/");
  //     } else if (log.entity === "events") {
  //       filename = log.old_data.name;
  //     } else if (log.entity === "bulletin") {
  //       filename = log.old_data.image;
  //     } else {
  //       filename = "N/A";
  //     }
  //   } else if (log.action === "UPDATE" || log.action === "INSERT") {
  //     if (log.entity === "documents") {
  //       filename = log.new_data.file_path.split("/");
  //     } else if (log.entity === "events") {
  //       filename = log.new_data.name;
  //     } else if (log.entity === "bulletin") {
  //       filename = log.new_data.image;
  //     } else {
  //       filename = "N/A";
  //     }
  //   }

  //   const data = {
  //     user:
  //       profiles.find((profile: any) => profile.id === log.userId)?.name ||
  //       "Unknown User",
  //     role: log.role,
  //     action: log.action,
  //     imageName: log.name || "N/A",
  //     filename: filename ? filename[filename.length - 1] : "N/A",
  //   };

  //   console.log(data);
  //   return data;
  // });
  console.log(data);

  return data;
}
