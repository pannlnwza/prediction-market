import { useState } from 'react';
import { MarketsTab } from '../components/admin/MarketsTab';
import { UsersTab } from '../components/admin/UsersTab';
import { CreateMarketForm } from '../components/admin/CreateMarketForm';

type Tab = 'markets' | 'users' | 'create';

const TABS: { key: Tab; label: string }[] = [
  { key: 'markets', label: 'Markets' },
  { key: 'users', label: 'Users' },
  { key: 'create', label: 'Create Market' },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>('markets');

  return (
    <div className="min-h-screen bg-white">

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2.5 text-sm font-medium border-b-2 bg-transparent cursor-pointer transition-colors
                ${activeTab === tab.key
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'markets' && <MarketsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'create' && <CreateMarketForm onCreated={() => setActiveTab('markets')} />}
      </main>
    </div>
  );
}
