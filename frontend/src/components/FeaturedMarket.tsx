import { Bookmark, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { featuredMarket, breakingNews, hotTopics } from '../data/mockMarkets';

export default function FeaturedMarket() {
  return (
    <div className="grid grid-cols-[1fr_340px] gap-6">
      {/* Featured Card */}
      <div className="border border-gray-200 rounded-3xl bg-white p-5 shadow-sm transition-shadow">
        <div className="flex gap-1.5 text-xs text-gray-500 mb-2">
          <span>{featuredMarket.category}</span>
          <span>&middot;</span>
          <span>{featuredMarket.tag}</span>
        </div>

        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 leading-snug">
            {featuredMarket.title}
          </h2>
          <div className="flex gap-2">
            <button className="p-1.5 bg-transparent border-none cursor-pointer text-gray-400">
              <span className="text-base">📌</span>
            </button>
            <button className="p-1.5 bg-transparent border-none cursor-pointer text-gray-400">
              <Bookmark size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Options list */}
          <div className="flex-1">
            {featuredMarket.options.map((opt) => (
              <div key={opt.date} className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-sm text-gray-700">{opt.date}</span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">{opt.pct}%</span>
                  <div className="flex gap-1">
                    <span className="text-[11px] px-1.5 py-0.5 rounded text-blue-600 cursor-pointer">●</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded text-amber-500 cursor-pointer">●</span>
                    <span className="text-[11px] px-1.5 py-0.5 rounded text-emerald-500 cursor-pointer">●</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Chart legend */}
            <div className="flex gap-3 mt-3 text-[11px] text-gray-400">
              {featuredMarket.chartLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="w-[520px] shrink-0">
            <div className="h-[240px] bg-gray-50 rounded-lg relative overflow-hidden">
              <svg viewBox="0 0 300 150" className="w-full h-full">
                {[0, 1, 2, 3, 4].map(i => (
                  <line key={i} x1="0" y1={i * 37.5} x2="300" y2={i * 37.5} stroke="#e5e7eb" strokeWidth="0.5" />
                ))}
                <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  points="10,120 30,115 50,100 70,95 90,80 110,85 130,70 150,65 170,55 190,50 210,45 230,40 250,38 270,35 290,30" />
                <polyline fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  points="10,90 30,92 50,88 70,85 90,82 110,80 130,75 150,78 170,72 190,68 210,65 230,60 250,55 270,50 290,48" />
                <polyline fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  points="10,130 30,128 50,125 70,127 90,130 110,128 130,125 150,122 170,120 190,118 210,115 230,112 250,110 270,108 290,105" />
                <text x="250" y="26" fill="#2563eb" fontSize="9" fontWeight="600">+ $660</text>
                <text x="265" y="54" fill="#f59e0b" fontSize="9" fontWeight="600">$4</text>
                <text x="260" y="100" fill="#10b981" fontSize="9" fontWeight="600">+ $50</text>
              </svg>
              <div className="absolute right-2 top-0 h-full flex flex-col justify-between py-3">
                {['60%', '45%', '30%', '15%', '0%'].map(label => (
                  <span key={label} className="text-[9px] text-gray-400">{label}</span>
                ))}
              </div>
            </div>
            <div className="flex justify-between px-2 py-1 text-[10px] text-gray-400">
              <span>Jan 25</span>
              <span>Feb 9</span>
              <span>Feb 25</span>
            </div>
          </div>
        </div>

        {/* Comments preview */}
        <div className="mt-4 flex flex-col gap-1.5">
          {[
            { user: 'PlasmaSlink', text: 'What is this new map? Half of my thesis is pilots being shot down. This follows original rules, but now sudden...', color: 'bg-blue-300' },
            { user: 'tomtoiome', text: "Really? I thought that was a joke. I really don't think that would count out it was too cheap lol", color: 'bg-cyan-300' },
            { user: 'tserv534', text: "I don't think they're overflying, are they?", color: 'bg-violet-300' },
          ].map((c, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className={`w-6 h-6 rounded-full ${c.color} shrink-0`} />
              <p className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-700">{c.user}</span>{' '}
                {c.text}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-400">{featuredMarket.volume} Vol</p>

        {/* Carousel dots */}
        <div className="flex gap-1 mt-3 justify-center">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`h-1.5 rounded-full ${i === 0 ? 'w-4 bg-gray-900' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="flex flex-col gap-5">
        {/* Breaking News */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">Breaking news</h3>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <div className="flex flex-col gap-3">
            {breakingNews.map((item) => (
              <div key={item.rank} className="flex gap-2.5 items-start cursor-pointer">
                <span className="text-sm font-semibold text-gray-400 w-4 shrink-0">{item.rank}</span>
                <p className="flex-1 text-[13px] text-gray-700 leading-snug">{item.title}</p>
                <div className="text-right shrink-0">
                  <span className="text-base font-bold text-gray-900">{item.pct}%</span>
                  <div className={`text-[11px] flex items-center justify-end gap-0.5 ${item.up ? 'text-green-600' : 'text-red-600'}`}>
                    {item.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {item.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hot Topics */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">Hot topics</h3>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
          <div className="flex flex-col gap-2">
            {hotTopics.map((item) => (
              <div key={item.rank} className="flex items-center gap-2.5 cursor-pointer">
                <span className="text-sm font-semibold text-gray-400 w-4 shrink-0">{item.rank}</span>
                <span className="text-sm font-semibold text-gray-900 flex-1">{item.label}</span>
                <span className="text-xs text-gray-400">{item.volume}</span>
                <span className="text-sm">🔥</span>
                <ChevronRight size={12} className="text-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
