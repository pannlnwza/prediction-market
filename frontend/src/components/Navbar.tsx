import { Search, TrendingUp, Flame, Zap, Menu } from 'lucide-react';

const categories = [
  { label: 'Trending', icon: 'trending' },
  { label: 'Breaking', icon: 'flame' },
  { label: 'New', icon: 'zap' },
  { label: 'Politics' },
  { label: 'Sports' },
  { label: 'Crypto' },
  { label: 'Iran' },
  { label: 'Finance' },
  { label: 'Geopolitics' },
  { label: 'Tech' },
  { label: 'Culture' },
  { label: 'Economy' },
  { label: 'Climate & Science' },
  { label: 'Mentions' },
  { label: 'Elections' },
  { label: 'More' },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      {/* Top bar */}
      <div className="max-w-[1400px] mx-auto px-6 flex items-center h-14 gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 no-underline text-gray-900 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
            <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-extrabold tracking-tight">PredictX</span>
        </a>

        {/* Search */}
        <div className="flex-1 max-w-[420px]">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search markets..."
              className="w-full h-[38px] pl-9 pr-8 rounded-full border border-gray-200 bg-gray-50 text-sm outline-none text-gray-900"
            />
          </div>
        </div>

        {/* How it works */}
        <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium cursor-pointer ml-auto">
          <div className="w-2 h-2 rounded-full bg-green-600" />
          How it works
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          <button className="text-sm font-medium text-gray-700 bg-transparent border-none cursor-pointer px-3 py-1.5">
            Log In
          </button>
          <button className="text-sm font-semibold text-white bg-blue-600 border-none cursor-pointer px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Sign Up
          </button>
          <button className="p-2 bg-transparent border-none cursor-pointer text-gray-500">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="max-w-[1400px] mx-auto px-6 flex gap-0.5 overflow-x-auto border-t border-gray-100 scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat.label}
            className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap bg-transparent border-none cursor-pointer transition-colors
              ${i === 0 ? 'text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {cat.icon === 'trending' && <TrendingUp size={14} className="inline mr-1 align-[-2px]" />}
            {cat.icon === 'flame' && <Flame size={14} className="inline mr-1 align-[-2px] text-red-500" />}
            {cat.icon === 'zap' && <Zap size={14} className="inline mr-1 align-[-2px] text-amber-500" />}
            {cat.label}
          </button>
        ))}
      </div>
    </header>
  );
}
