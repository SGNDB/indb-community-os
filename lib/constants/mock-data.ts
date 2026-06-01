export interface NavItem {
  href: string;
  key: "home" | "feed" | "memory" | "ideas" | "polls" | "events" | "projects" | "profile";
  shortKey: "home" | "feed" | "memory" | "ideas" | "polls" | "events" | "projects" | "profile";
  icon: "home" | "feed" | "memories" | "ideas" | "polls" | "events" | "projects" | "profile";
}

export interface PostItem {
  id: string;
  author: string;
  role: string;
  avatar: string;
  timeAgo: string;
  content: string;
  image: string | null;
  likes: number;
  comments: number;
}

export interface CommentItem {
  id: string;
  author: string;
  content: string;
  timeAgo: string;
}

export interface MemoryItem {
  slug: string;
  title: string;
  year: string;
  location: string;
  contributor: string;
  image: string;
  summary: string;
  story: string;
}

export interface IdeaItem {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: "submitted" | "under-review" | "in-progress" | "completed";
}

export interface PollItem {
  id: string;
  question: string;
  totalVotes: number;
  options: Array<{
    id: string;
    label: string;
    votes: number;
  }>;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  status: string;
  volunteers: number;
  progress: number;
  image: string;
}

export const navItems: NavItem[] = [
  {
    href: "/",
    key: "home",
    shortKey: "home",
    icon: "home",
  },
  {
    href: "/feed",
    key: "feed",
    shortKey: "feed",
    icon: "feed",
  },
  {
    href: "/memory",
    key: "memory",
    shortKey: "memory",
    icon: "memories",
  },
  {
    href: "/ideas",
    key: "ideas",
    shortKey: "ideas",
    icon: "ideas",
  },
  {
    href: "/polls",
    key: "polls",
    shortKey: "polls",
    icon: "polls",
  },
  {
    href: "/events",
    key: "events",
    shortKey: "events",
    icon: "events",
  },
  {
    href: "/projects",
    key: "projects",
    shortKey: "projects",
    icon: "projects",
  },
  {
    href: "/profile",
    key: "profile",
    shortKey: "profile",
    icon: "profile",
  },
];

export const trendingTopics = [
  "#Nouadhibou",
  "#BeachCleanup",
  "#RailwayStories",
  "#YouthCoding",
  "#PublicLibrary",
];

export const featuredMemories = [
  {title: "Old railway station stories", year: "1986"},
  {title: "Port life in the 1980s", year: "1982"},
  {title: "Market mornings in Cansado", year: "1993"},
];

export const posts: PostItem[] = [
  {
    id: "post-1",
    author: "Ahmed Salem",
    role: "Community Volunteer",
    avatar: "AS",
    timeAgo: "2h",
    content:
      "The beach cleanup campaign starts this Saturday at 8:00 AM. Bring gloves and water. Let's make our coastline shine.",
    image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=1200&q=80",
    likes: 24,
    comments: 10,
  },
  {
    id: "post-2",
    author: "Meryem Ould Bah",
    role: "Local Teacher",
    avatar: "MB",
    timeAgo: "5h",
    content:
      "We hosted a youth AI workshop this afternoon. The students asked for a weekly coding circle. Who can mentor?",
    image: null,
    likes: 41,
    comments: 18,
  },
  {
    id: "post-3",
    author: "Yahya Mint El Hassen",
    role: "Historian",
    avatar: "YH",
    timeAgo: "1d",
    content:
      "Found a set of historical railway photos from the late 1970s. Uploading them to the memory archive this week.",
    image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=80",
    likes: 77,
    comments: 26,
  },
];

export const commentsByPost: Record<string, CommentItem[]> = {
  "post-1": [
    {id: "c-1", author: "Fatimetou", content: "I can bring 15 trash bags.", timeAgo: "1h"},
    {id: "c-2", author: "Ibrahim", content: "Great idea, see you there.", timeAgo: "30m"},
  ],
  "post-2": [
    {id: "c-3", author: "Moustapha", content: "I can help with Python basics.", timeAgo: "2h"},
  ],
  "post-3": [
    {id: "c-4", author: "Noura", content: "Please add captions with years.", timeAgo: "6h"},
  ],
};

export const memories: MemoryItem[] = [
  {
    slug: "old-railway-station",
    title: "Old Railway Station",
    year: "1978",
    location: "Nouadhibou Railway District",
    contributor: "Sidi Mohamed",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    summary: "A gathering place where families welcomed arrivals from the interior.",
    story:
      "For decades, the railway station served as a social heart. Families met, traded news, and built solidarity around each train arrival.",
  },
  {
    slug: "fishing-port-1980s",
    title: "Fishing Port in the 1980s",
    year: "1984",
    location: "Port Artisanal",
    contributor: "Leila Mint Ahmed",
    image: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    summary: "A snapshot of cooperation between fishers, traders, and families.",
    story:
      "The port was full of life before sunrise. Nets, ice, and teamwork powered daily livelihoods, creating shared routines across neighborhoods.",
  },
  {
    slug: "school-memories-1990s",
    title: "School Memories",
    year: "1992",
    location: "Central Nouadhibou",
    contributor: "Moussa Ould Baha",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
    summary: "Stories from classrooms that shaped civic values and ambition.",
    story:
      "Students remember teachers who emphasized discipline, service, and hope. Many community leaders still credit those lessons.",
  },
  {
    slug: "old-market-photos",
    title: "Old Market Photos",
    year: "1999",
    location: "Old Market",
    contributor: "Khadijetou",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    summary: "Colorful archives of everyday life and neighborhood commerce.",
    story:
      "Vendors and families turned the market into a social map of the city. These photos preserve faces, rhythms, and small acts of trust.",
  },
];

export const ideas: IdeaItem[] = [
  {
    id: "idea-1",
    title: "Public Library and Study Hub",
    description:
      "Create a community reading space with internet access, mentorship hours, and volunteer-led tutoring.",
    votes: 132,
    status: "submitted",
  },
  {
    id: "idea-2",
    title: "Monthly Beach Cleanup Program",
    description:
      "Coordinate schools, youth clubs, and local businesses for recurring cleanup actions with clear zones.",
    votes: 204,
    status: "under-review",
  },
  {
    id: "idea-3",
    title: "Youth Coding Club",
    description:
      "Weekly coding sessions focused on practical problem solving, civic apps, and digital literacy.",
    votes: 175,
    status: "in-progress",
  },
  {
    id: "idea-4",
    title: "Community Historical Archive Campaign",
    description:
      "Collect oral histories and digitize photos/documents so future generations can access local memory.",
    votes: 251,
    status: "completed",
  },
];

export const polls: PollItem[] = [
  {
    id: "poll-1",
    question: "Which neighborhood should host the next civic workshop?",
    totalVotes: 436,
    options: [
      {id: "a", label: "Cansado", votes: 171},
      {id: "b", label: "Numerowat", votes: 138},
      {id: "c", label: "Baghdad", votes: 127},
    ],
  },
  {
    id: "poll-2",
    question: "What should be the next youth program focus?",
    totalVotes: 389,
    options: [
      {id: "a", label: "Coding", votes: 163},
      {id: "b", label: "Language classes", votes: 96},
      {id: "c", label: "Entrepreneurship", votes: 130},
    ],
  },
];

export const events: EventItem[] = [
  {
    id: "event-1",
    title: "Beach Cleanup Day",
    date: "Saturday, June 8",
    location: "Public Beach, Nouadhibou",
    description: "Community cleanup with youth volunteers and local associations.",
    image: "https://images.unsplash.com/photo-1618477462146-050d2767eac4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "event-2",
    title: "Railway Memory Night",
    date: "Thursday, June 13",
    location: "Cultural Center Hall",
    description: "Photo exhibition and oral history evening with longtime residents.",
    image: "https://images.unsplash.com/photo-1535535112387-56ffe8db21ff?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "event-3",
    title: "Youth Coding Meetup",
    date: "Monday, June 17",
    location: "Community Lab",
    description: "Hands-on workshop for beginners, students, and mentors.",
    image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  },
];

export const projects: ProjectItem[] = [
  {
    id: "project-1",
    title: "Neighborhood Library Setup",
    status: "Planning",
    volunteers: 23,
    progress: 42,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "project-2",
    title: "Digital Memory Archive",
    status: "In Progress",
    volunteers: 31,
    progress: 68,
    image: "https://images.unsplash.com/photo-1457694587812-e8bf29a43845?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "project-3",
    title: "Youth Civic Media Team",
    status: "Recruiting",
    volunteers: 15,
    progress: 25,
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
  },
];

