import { TrendingUp } from 'lucide-react';

const footerColumns = [
  {
    title: 'Markets by category and topics',
    links: ['Midterms', 'Tweet Markets', 'Lebanon', 'Texas Senate', 'Derivatives'],
    sublabels: ['Predictions', 'Predictions', 'Predictions', 'Predictions', 'Predictions'],
  },
  {
    title: '',
    links: ['Epstein', 'Daily Temperature', 'Tariffs', 'Gov Shutdown', 'Equities'],
    sublabels: ['Predictions', 'Predictions', 'Predictions', 'Predictions', 'Predictions'],
  },
  {
    title: '',
    links: ['Primaries', 'Global Elections', 'Reza Pahlavi', 'AI'],
    sublabels: ['Predictions', 'Predictions', 'Predictions', 'Predictions'],
  },
  {
    title: 'Support & Social',
    links: ['Learn', 'X (Twitter)', 'Instagram', 'Discord', 'TikTok', 'News', 'Contact us'],
  },
  {
    title: 'PredictX',
    links: ['Rewards', 'APIs', 'Leaderboard', 'Accuracy', 'Brand', 'Activity', 'Careers', 'Press'],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-10">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">PredictX</span>
        </div>
        <p className="text-[13px] text-gray-500 mb-8">The World's Largest Prediction Market&trade;</p>

        {/* Links Grid */}
        <div className="grid grid-cols-5 gap-6">
          {footerColumns.map((col, i) => (
            <div key={i}>
              {col.title ? (
                <div className="text-[13px] font-semibold text-gray-900 mb-2">{col.title}</div>
              ) : (
                <div className="h-[22px]" />
              )}
              {col.links.map((link, j) => (
                <div key={link}>
                  <a href="#" className="block text-[13px] text-gray-500 no-underline leading-7 hover:text-gray-900 transition-colors">
                    {link}
                  </a>
                  {col.sublabels?.[j] && (
                    <span className="text-[11px] text-gray-300">{col.sublabels[j]}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 mt-8 pt-5 flex items-center justify-between">
          <div className="flex gap-4 text-[13px] text-gray-400">
            <span>Software Architecture Project &copy; 2026</span>
            <a href="#" className="text-gray-500 no-underline hover:text-gray-900">Privacy</a>
            <a href="#" className="text-gray-500 no-underline hover:text-gray-900">Terms of Use</a>
            <a href="#" className="text-gray-500 no-underline hover:text-gray-900">Help Center</a>
            <a href="#" className="text-gray-500 no-underline hover:text-gray-900">Docs</a>
          </div>
          <span className="text-[13px] text-gray-400">English</span>
        </div>
      </div>
    </footer>
  );
}
