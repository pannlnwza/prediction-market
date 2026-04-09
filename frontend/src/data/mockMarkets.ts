export interface MarketOption {
  id: string;
  label: string;
  currentPrice: number;
}

export interface Market {
  id: string;
  title: string;
  category: string;
  status: 'ACTIVE' | 'CLOSED' | 'RESOLVED' | 'VOIDED';
  closeDate: string;
  volume: number;
  options: MarketOption[];
  icon?: string;
  isLive?: boolean;
  liveLabel?: string;
  extraInfo?: string;
}

export const featuredMarket = {
  id: 'featured-1',
  title: 'US forces enter Iran by..?',
  category: 'Geopolitics',
  tag: 'Trump',
  options: [
    { date: 'March 31', pct: 35 },
    { date: 'December 31', pct: 59 },
    { date: 'March 14', pct: 10 },
  ],
  volume: '$16M',
  chartLegend: [
    { label: 'December 31 59%', color: '#2563eb' },
    { label: 'March 31 31%', color: '#f59e0b' },
    { label: 'March 14 10%', color: '#10b981' },
  ],
};

export const breakingNews = [
  { rank: 1, title: 'Will James Talarico win the Texas Democratic Senate Primary by betwee...', pct: 96, change: 2, up: false },
  { rank: 2, title: 'Will Tom Steyer win the California Governor Election in 2026?', pct: 9, change: 1, up: true },
  { rank: 3, title: 'Will Shawn Harris win the GA-14 special election?', pct: 5, change: 7, up: false },
];

export const hotTopics = [
  { rank: 1, label: 'Cpi', volume: '$237K today' },
  { rank: 2, label: 'Georgia', volume: '$3M today' },
  { rank: 3, label: 'Elon', volume: '$42M today' },
  { rank: 4, label: 'Maxx', volume: '$68.7K today' },
  { rank: 5, label: 'Barcelona', volume: '$14M today' },
];

export const mockMarkets: Market[] = [
  {
    id: '1',
    title: 'UEFA Champions League Winner',
    category: 'Sports',
    status: 'ACTIVE',
    closeDate: '2026-06-01',
    volume: 27000000,
    icon: '⚽',
    options: [
      { id: '1a', label: 'Arsenal', currentPrice: 0.28 },
      { id: '1b', label: 'Bayern Munich', currentPrice: 0.20 },
    ],
  },
  {
    id: '2',
    title: 'Will Crude Oil (CL) hit__ by end of March?',
    category: 'Finance',
    status: 'ACTIVE',
    closeDate: '2026-03-31',
    volume: 27000000,
    icon: '🛢️',
    options: [
      { id: '2a', label: '↑ $110', currentPrice: 0.44 },
      { id: '2b', label: '↑ $105', currentPrice: 0.57 },
    ],
  },
  {
    id: '3',
    title: 'BTC 5 Minute Up or Down',
    category: 'Crypto',
    status: 'ACTIVE',
    closeDate: '2026-03-11',
    volume: 0,
    icon: '₿',
    isLive: true,
    liveLabel: '51%',
    options: [
      { id: '3a', label: '↑ $__ Up', currentPrice: 0.51 },
      { id: '3b', label: 'Down', currentPrice: 0.49 },
    ],
    extraInfo: '● LIVE',
  },
  {
    id: '4',
    title: 'US forces enter Iran by..?',
    category: 'Geopolitics',
    status: 'ACTIVE',
    closeDate: '2026-03-31',
    volume: 14000000,
    icon: '🇺🇸',
    options: [
      { id: '4a', label: 'March 14', currentPrice: 0.10 },
      { id: '4b', label: 'March 31', currentPrice: 0.35 },
    ],
  },
  {
    id: '5',
    title: 'Oscars 2026: Best Picture Winner',
    category: 'Entertainment',
    status: 'ACTIVE',
    closeDate: '2026-03-31',
    volume: 29000000,
    icon: '🏆',
    options: [
      { id: '5a', label: 'One Battle After Anot...', currentPrice: 0.76 },
      { id: '5b', label: 'Sinners', currentPrice: 0.21 },
    ],
  },
  {
    id: '6',
    title: 'Xtreme Gaming',
    category: 'Esports',
    status: 'ACTIVE',
    closeDate: '2026-03-15',
    volume: 1000000,
    icon: '🎮',
    liveLabel: 'Game 3',
    options: [
      { id: '6a', label: 'Xtreme Gaming', currentPrice: 0.17 },
      { id: '6b', label: 'Vici Gaming', currentPrice: 0.83 },
    ],
  },
  {
    id: '7',
    title: 'Bayer 04 Leverkusen',
    category: 'Sports',
    status: 'ACTIVE',
    closeDate: '2026-03-12',
    volume: 1000000,
    icon: '⚽',
    options: [
      { id: '7a', label: 'Bayer 04 Leverkusen', currentPrice: 0.14 },
      { id: '7b', label: 'Arsenal FC', currentPrice: 0.66 },
    ],
    extraInfo: 'UCL Tomorrow 12:45 AM',
  },
  {
    id: '8',
    title: 'Real Madrid CF',
    category: 'Sports',
    status: 'ACTIVE',
    closeDate: '2026-03-12',
    volume: 759000,
    icon: '⚽',
    options: [
      { id: '8a', label: 'Real Madrid CF', currentPrice: 0.27 },
      { id: '8b', label: 'Manchester City FC', currentPrice: 0.49 },
    ],
    extraInfo: 'UCL Tomorrow 3:00 AM',
  },
  {
    id: '9',
    title: 'US x Iran ceasefire by...?',
    category: 'Geopolitics',
    status: 'ACTIVE',
    closeDate: '2026-03-31',
    volume: 19000000,
    icon: '🕊️',
    options: [
      { id: '9a', label: 'March 15', currentPrice: 0.04 },
      { id: '9b', label: 'March 31', currentPrice: 0.30 },
    ],
  },
  {
    id: '10',
    title: 'Republican Presidential Nominee 2028',
    category: 'Politics',
    status: 'ACTIVE',
    closeDate: '2028-11-01',
    volume: 380000000,
    icon: '🗳️',
    options: [
      { id: '10a', label: 'J.D. Vance', currentPrice: 0.38 },
      { id: '10b', label: 'Marco Rubio', currentPrice: 0.26 },
    ],
  },
  {
    id: '11',
    title: 'Eurovision Winner 2026',
    category: 'Entertainment',
    status: 'ACTIVE',
    closeDate: '2026-05-20',
    volume: 15000000,
    icon: '🎵',
    options: [
      { id: '11a', label: 'Finland', currentPrice: 0.35 },
      { id: '11b', label: 'France', currentPrice: 0.14 },
    ],
  },
  {
    id: '12',
    title: 'Will the Iranian regime fall by June 30?',
    category: 'Geopolitics',
    status: 'ACTIVE',
    closeDate: '2026-06-30',
    volume: 16000000,
    icon: '🇮🇷',
    liveLabel: '23%',
    options: [
      { id: '12a', label: 'Yes', currentPrice: 0.23 },
      { id: '12b', label: 'No', currentPrice: 0.77 },
    ],
  },
  {
    id: '13',
    title: 'Texas Republican Senate Primary Winner',
    category: 'Politics',
    status: 'ACTIVE',
    closeDate: '2026-03-15',
    volume: 19000000,
    icon: '🗳️',
    options: [
      { id: '13a', label: 'John Cornyn', currentPrice: 0.62 },
      { id: '13b', label: 'Ken Paxton', currentPrice: 0.38 },
    ],
  },
  {
    id: '14',
    title: 'US recession by end of 2026?',
    category: 'Finance',
    status: 'ACTIVE',
    closeDate: '2026-12-31',
    volume: 473000000,
    icon: '📉',
    liveLabel: '30%',
    options: [
      { id: '14a', label: 'Yes', currentPrice: 0.30 },
      { id: '14b', label: 'No', currentPrice: 0.70 },
    ],
  },
  {
    id: '15',
    title: 'Iran leadership change by...?',
    category: 'Geopolitics',
    status: 'ACTIVE',
    closeDate: '2026-03-31',
    volume: 2000000,
    icon: '🇮🇷',
    options: [
      { id: '15a', label: 'March 13', currentPrice: 0.06 },
      { id: '15b', label: 'March 31', currentPrice: 0.26 },
    ],
  },
  {
    id: '16',
    title: 'Iran x Israel/US conflict ends by...?',
    category: 'Geopolitics',
    status: 'ACTIVE',
    closeDate: '2026-03-31',
    volume: 3000000,
    icon: '⚔️',
    options: [
      { id: '16a', label: 'March 15', currentPrice: 0.05 },
      { id: '16b', label: 'March 31', currentPrice: 0.28 },
    ],
  },
  {
    id: '17',
    title: 'Who will be confirmed as Fed Chair?',
    category: 'Finance',
    status: 'ACTIVE',
    closeDate: '2026-12-31',
    volume: 5000000,
    icon: '🏦',
    options: [
      { id: '17a', label: 'Kevin Warsh', currentPrice: 0.94 },
      { id: '17b', label: 'Judy Shelton', currentPrice: 0.02 },
    ],
  },
  {
    id: '18',
    title: 'Presidential Election Winner 2028',
    category: 'Politics',
    status: 'ACTIVE',
    closeDate: '2028-11-05',
    volume: 387000000,
    icon: '🗳️',
    options: [
      { id: '18a', label: 'JD Vance', currentPrice: 0.21 },
      { id: '18b', label: 'Gavin Newsom', currentPrice: 0.17 },
    ],
  },
  {
    id: '19',
    title: 'Will the US confirm that aliens exist before 2027?',
    category: 'Science',
    status: 'ACTIVE',
    closeDate: '2027-01-01',
    volume: 16000000,
    icon: '👽',
    liveLabel: '14%',
    options: [
      { id: '19a', label: 'Yes', currentPrice: 0.14 },
      { id: '19b', label: 'No', currentPrice: 0.86 },
    ],
  },
  {
    id: '20',
    title: '2026 FIFA World Cup Winner',
    category: 'Sports',
    status: 'ACTIVE',
    closeDate: '2026-07-19',
    volume: 28000000,
    icon: '⚽',
    options: [
      { id: '20a', label: 'Spain', currentPrice: 0.15 },
      { id: '20b', label: 'England', currentPrice: 0.13 },
    ],
  },
];
