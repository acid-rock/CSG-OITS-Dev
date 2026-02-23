const eventData = [
  {
    id: 1,
    title: 'Tech Conference 2024',
    description:
      'Join us for the biggest tech conference of the year featuring keynotes from industry leaders.',
    date: 'Dec 15, 2024',
    location: 'San Francisco, CA',
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Technology',
  },
  {
    id: 2,
    title: 'Design Workshop',
    description:
      'Learn modern design principles and UX best practices from expert designers.',
    date: 'Dec 20, 2024',
    location: 'New York, NY',
    image:
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2064&q=80',
    category: 'Design',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 4,
    title: 'Food Expo',
    description:
      'Discover culinary delights from around the world with tastings and demonstrations.',
    date: 'Jan 12, 2025',
    location: 'Los Angeles, CA',
    image:
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2067&q=80',
    category: 'Food & Beverage',
  },
  {
    id: 5,
    title: 'Startup Summit',
    description:
      'Network with entrepreneurs, investors, and innovators shaping the future.',
    date: 'Jan 20, 2025',
    location: 'Boston, MA',
    image:
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Business',
  },
  {
    id: 6,
    title: 'Art Exhibition',
    description:
      'Explore contemporary art from emerging and established artists.',
    date: 'Feb 1, 2025',
    location: 'Chicago, IL',
    image:
      'https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Art & Culture',
  },
  {
    id: 7,
    title: 'Gaming Con',
    description:
      'Play the latest games, meet developers, and participate in esports tournaments.',
    date: 'Feb 14, 2025',
    location: 'Seattle, WA',
    image:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Gaming',
  },
  {
    id: 8,
    title: 'Fitness Camp',
    description:
      'Transform your health with intensive training sessions and nutrition workshops.',
    date: 'Feb 20, 2025',
    location: 'Miami, FL',
    image:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Health & Fitness',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
  {
    id: 3,
    title: 'Music Festival',
    description:
      'Experience live performances from top artists in a vibrant outdoor setting.',
    date: 'Jan 5, 2025',
    location: 'Austin, TX',
    image:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    category: 'Entertainment',
  },
];

export default eventData;
