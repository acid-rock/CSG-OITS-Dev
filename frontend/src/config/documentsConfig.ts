import officeMemo1 from '../assets/memo/memo1.pdf';
import officeMemo2 from '../assets/memo/memo2.pdf';
import officeMemo3 from '../assets/memo/memo3.pdf';
import officeMemo4 from '../assets/memo/memo4.pdf';
import proposal1 from '../assets/proposal/proposal1.pdf';
import proposal2 from '../assets/proposal/proposal2.pdf';
import letter1 from '../assets/sponsorship/letter1.pdf';
import letter2 from '../assets/sponsorship/letter2.pdf';

const documents = [
  {
    id: '1',
    title: '40th Commemoration of the EDSA People Power Revolution',
    description:
      'Understand the conversations sharing campus life',
    term: '2025-2026 - 2nd Semester',
    date: 'Feb 25, 2025',
    location: 'CvSU-Imus Campus, Imus, Cavite',
    category: 'Memorandum',
    url: officeMemo1,
  },
  {
    id: '2',
    title: 'CSG Advisory: University-Wide Big Clean-Up Drive',
    description:
      'Understand the conversations sharing campus life',
    term: '2025-2026 - 2nd Semester',
    date: 'Feb 25, 2026',
    category: 'Memorandum',
    location: 'CvSU-Imus Campus, Imus, Cavite',
    url: officeMemo2,
  },
  {
    id: '3',
    title: 'CSG Advisory: University-Wide Big Clean-Up Drive',
    description:
      'Understand the conversations sharing campus life',
    term: '2025-2026 - 2nd Semester',
    location: 'CvSU-Imus Campus, Imus, Cavite',
    category: 'Advisory',
    url: officeMemo3,
  },
  {
    id: '4',
    title: 'CSG Advisory: University-Wide Big Clean-Up Drive',
    description:
      'Understand the conversations sharing campus life',
    term: '2025-2026 - 2nd Semester',
    date: 'Feb 25, 2026',
    location: 'CvSU-Imus Campus, Imus, Cavite',
    category: 'Advisory',
    url: officeMemo4,
  },
  {
    id: '5',
    title: 'Project Proposal: Chat.CSG — Centralized Student Concerns Platform',
    description:
      'An official and centralized platform by the Committee on Student Affairs and Concerns (CSAC) under the CSG to address student grievances, concerns, and inquiries. Chat.CSG aims to eliminate dependence on informal platforms and provide systematic, accurate, and timely responses for all bonafide students of CvSU-Imus.',
    date: 'Dec 3, 2025',
    location: 'CvSU-Imus Campus CSG Office',
    category: 'Proposal',
    url: proposal1,
  },
  {
    id: '6',
    title:
      'Project Proposal: CSG Imus Online Information and Transparency System (OITS) — Phase 1',
    description:
      'Phase 1 of the CvSU-Imus CSG Online Information and Transparency System (OITS), focusing on research, structural planning, system development, and Alpha/Beta testing. Led by the Student Academic Program for Information Technology (SAP–IT), this platform aims to provide students organized access to CSG resolutions, financial reports, project updates, and announcements.',
    date: 'Nov 8, 2025',
    location: 'CvSU-Imus Campus, Imus, Cavite',
    category: 'Proposal',
    url: proposal2,
  },
  {
    id: '7',
    title: 'Sponsorship Letter: BPI #SaveUp Program Collaboration',
    description:
      "A sponsorship letter addressed to Ms. Charissa Manaig-Mariano, BPI Agency Banking South Luzon Cluster Manager, requesting collaboration to promote BPI's #SaveUp program. The CSG aims to encourage at least 1,000 students to open savings accounts between October 15–23, 2025, with sponsorship in the form of office supplies ranging from ₱3,000 to ₱10,000 depending on enrollment milestones.",
    date: 'Oct 9, 2025',
    location: 'CvSU-Imus Campus, Imus, Cavite',
    category: 'Sponsorship Letter',
    url: letter1,
  },
  {
    id: '8',
    title:
      'Sponsorship Letter Extension: BPI #SaveUp Program — Date Extension Request',
    description:
      'An extension letter to Ms. Charissa Manaig-Mariano of BPI Agency Banking, requesting to move the agreed collaboration date to November 3–6, 2025. The letter also requests a venue change to the entrance of the old building for wider student reach, while maintaining the same sponsorship tiers of ₱3,000, ₱5,000, or ₱10,000 worth of office supplies based on enrollment milestones.',
    date: 'Oct 27, 2025',
    location: 'CvSU-Imus Campus, Imus, Cavite',
    category: 'Sponsorship Letter',
    url: letter2,
  },
];

export default documents;
