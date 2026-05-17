import { useEffect, useState } from "react";
import axios from "axios";
import { FaGithub, FaEnvelope, FaFacebook, FaInstagram } from "react-icons/fa";
import "./contributors.css";

const API_URL = import.meta.env.VITE_API_URL as string;

const CONTRIBUTORS = [
  {
    name: "Ivan P. Duran",
    role: "Committee Chair — Web Development",
    initials: "ID",
    github:    "https://github.com/sleepdeprive-gray",
    facebook:  "https://www.facebook.com/infectious.ivan",
    email:     "ayban.duran@gmail.com",
    instagram: "https://www.instagram.com/not.aybann",
  },
  {
    name: "John Harold R. Magma",
    role: "GAD Representative / Project Coordinator",
    initials: "JM",
    github:    "https://github.com/Hexizen",
    facebook:  "https://www.facebook.com/jhnhrldmgm",
    email:     "johnharold8888@gmail.com",
    instagram: "https://www.instagram.com/j.h.magma",
  },
  {
    name: "Lorenz E. Tuboro",
    role: "Back-End Developer",
    initials: "LT",
    github:    "https://github.com/acid-rock",
    facebook:  "https://www.facebook.com/herelieszee3/",
    email:     "lorenztuboro00@gmail.com",
    instagram: "https://www.instagram.com/thisiszee3/",
  },
  {
    name: "Ralph Kenneth B. Perez",
    role: "UI/UX Designer",
    initials: "RP",
    github:    "https://github.com/rkenbperez",
    facebook:  "https://www.facebook.com/Ralph.Ken.Perez",
    email:     "rken.perez@gmail.com",
    instagram: "https://www.instagram.com/si_kenp",
  },
  {
    name: "Jerald D. Estrella",
    role: "Front-End Developer",
    initials: "JE",
    github:    "https://github.com/JeraldEstrella",
    facebook:  "https://www.facebook.com/jerald.estrellaii",
    email:     "jeraldestrella127@gmail.com",
    instagram: "https://www.instagram.com/jrldstellar",
  },
  {
    name: "Taisei Domingo",
    role: "Front-End Developer",
    initials: "TD",
    github:    "https://github.com/TaiseiD",
    facebook:  "https://www.facebook.com/iiseiich",
    email:     "domingo.taisei070606@gmail.com",
    instagram: "https://www.instagram.com/iiseichi",
  },
  {
    name: "Gerald D. Alansalon",
    role: "Documentation Officer",
    initials: "GA",
    github:    "https://github.com/GeraldTheTeenGR",
    facebook:  "https://www.facebook.com/GDomingoA",
    email:     "geraldalansalon@gmail.com",
    instagram: "https://www.instagram.com/iamgerald_12",
  },
];

interface OfficerAvatar {
  avatar: string | null;
  year_serving: string | null;
}

export default function ContributorsPage() {
  const [avatarMap, setAvatarMap] = useState<Record<string, OfficerAvatar>>({});

  useEffect(() => {
    axios
      .get(`${API_URL}/officers`)
      .then(({ data }) => {
        const map: Record<string, OfficerAvatar> = {};
        for (const o of data) {
          map[o.full_name] = { avatar: o.avatar ?? null, year_serving: o.year_serving ?? null };
        }
        setAvatarMap(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="cp-page">
      {/* Hero header */}
      <div className="cp-header">
        <div className="cp-header-inner">
          <span className="section-label cp-kicker">The people behind it</span>
          <h1 className="cp-heading">
            The team behind <em className="italic-accent">OITS</em>
          </h1>
          <p className="cp-subheading">
            Students who designed, built, and maintain the CSG Online Information Transparency System.
          </p>
        </div>
      </div>

      {/* Card grid */}
      <div className="cp-content">
        <div className="cp-grid">
          {CONTRIBUTORS.map((c) => {
            const match = avatarMap[c.name];
            const avatarUrl = match?.avatar ?? null;

            return (
              <div key={c.name} className="cp-card card">
                {/* Avatar */}
                <div className="cp-avatar">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={c.name}
                      className="cp-avatar-img"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="cp-initials">{c.initials}</span>
                  )}
                </div>

                {/* Text */}
                <h3 className="cp-name">{c.name}</h3>
                <p className="cp-role">{c.role}</p>
                {match?.year_serving && (
                  <p className="cp-term">{match.year_serving}</p>
                )}

                {/* Icon links */}
                <div className="cp-links">
                  <a href={c.github} target="_blank" rel="noopener noreferrer"
                    aria-label={`${c.name} on GitHub`} className="cp-link cp-link--github">
                    <FaGithub size={18} />
                  </a>
                  <a href={c.facebook} target="_blank" rel="noopener noreferrer"
                    aria-label={`${c.name} on Facebook`} className="cp-link cp-link--facebook">
                    <FaFacebook size={18} />
                  </a>
                  <a href={`https://mail.google.com/mail/?view=cm&to=${c.email}`}
                    target="_blank" rel="noopener noreferrer"
                    aria-label={`Email ${c.name}`} className="cp-link cp-link--email">
                    <FaEnvelope size={18} />
                  </a>
                  <a href={c.instagram} target="_blank" rel="noopener noreferrer"
                    aria-label={`${c.name} on Instagram`} className="cp-link cp-link--instagram">
                    <FaInstagram size={18} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
