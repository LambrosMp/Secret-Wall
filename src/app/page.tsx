'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { LeftSidebar } from '@/components/LeftSidebar';
import { CategoryFilters } from '@/components/CategoryFilters';
import { Feed } from '@/components/Feed';
import { RightDMsPanel } from '@/components/RightDMsPanel';
import { MobileComposeModal } from '@/components/MobileComposeModal';
import { SettingsModal } from '@/components/SettingsModal';
import { OnboardingModal } from '@/components/OnboardingModal';
import { ConfessionItem, SortOption, AppTheme, ConversationItem } from '@/types/confession';
import { getStoredIdentity, clearIdentity, UserIdentity } from '@/lib/identity';
import { Feather } from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserIdentity>({
    token: '',
    name: 'Anonymous',
    avatar: '🦊',
  });
  const [theme, setTheme] = useState<AppTheme>('night');
  const [confessions, setConfessions] = useState<ConfessionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Γενικά');
  const [selectedSort, setSelectedSort] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels State
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDMsOpen, setIsDMsOpen] = useState(false);
  const [targetConfessionForDM, setTargetConfessionForDM] = useState<ConfessionItem | null>(null);
  const [activeDMsCount, setActiveDMsCount] = useState(0);
  const [isMobileComposeOpen, setIsMobileComposeOpen] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('secret_wall_theme') as AppTheme;
      if (savedTheme === 'light' || savedTheme === 'night') {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        setTheme('night');
        document.documentElement.setAttribute('data-theme', 'night');
      }
    } catch {
      setTheme('night');
      document.documentElement.setAttribute('data-theme', 'night');
    }
  }, []);

  const handleSelectTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('secret_wall_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    } catch {
      // Ignore
    }
  };

  // Initialize identity or show onboarding modal
  useEffect(() => {
    const stored = getStoredIdentity();
    if (stored) {
      setCurrentUser(stored);
      setIsOnboardingOpen(false);
    } else {
      setIsOnboardingOpen(true);
    }
  }, []);

  const handleOnboardingComplete = (newIdentity: UserIdentity) => {
    setCurrentUser(newIdentity);
    setIsOnboardingOpen(false);
  };

  const handleLogout = () => {
    clearIdentity();
    setCurrentUser({ token: '', name: '', avatar: '👤' });
    setIsDMsOpen(false);
    setIsOnboardingOpen(true);
  };

  // Fetch unread / active incoming conversations count
  const fetchDMsCount = useCallback(async () => {
    if (!currentUser.token) return;
    try {
      const res = await fetch(`/api/conversations?token=${encodeURIComponent(currentUser.token)}`);
      if (res.ok) {
        const data = await res.json();
        const convs: ConversationItem[] = data.conversations || [];

        // Count conversations where the other party sent the latest message
        const incomingCount = convs.filter((c) => {
          if (
            c.lastMessage &&
            c.lastMessage.senderToken !== currentUser.token
          ) {
            return true;
          }
          return false;
        }).length;

        setActiveDMsCount(incomingCount);
      }
    } catch {
      // Ignore
    }
  }, [currentUser.token]);

  useEffect(() => {
    if (currentUser.token) {
      fetchDMsCount();
      const interval = setInterval(fetchDMsCount, 6000);
      return () => clearInterval(interval);
    }
  }, [currentUser.token, fetchDMsCount]);

  // Fetch confessions
  const fetchConfessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = currentUser.token
        ? `/api/confessions?userToken=${encodeURIComponent(currentUser.token)}`
        : '/api/confessions';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setConfessions(data.confessions || []);
      }
    } catch (err) {
      console.error('Error fetching confessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.token]);

  useEffect(() => {
    fetchConfessions();
  }, [fetchConfessions]);

  const handleConfessionCreated = (newConfession: ConfessionItem) => {
    setConfessions((prev) => [newConfession, ...prev]);
  };

  // Trigger DM from a card -> Opens DMs Right Column / Modal
  const handleStartDM = (confession: ConfessionItem) => {
    setTargetConfessionForDM(confession);
    setIsDMsOpen(true);
  };

  // Category counts with 5 clean options
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Γενικά: confessions.length,
      ΠΑΜΑΚ: 0,
      ΑΠΘ: 0,
      ΔΙΠΑΕ: 0,
      Events: 0,
    };
    for (const c of confessions) {
      if (counts[c.category] !== undefined && c.category !== 'Γενικά') {
        counts[c.category]++;
      }
    }
    return counts;
  }, [confessions]);

  // Filtered and sorted confessions
  const filteredConfessions = useMemo(() => {
    let result = [...confessions];

    // 'Γενικά' shows all confessions as the default overview
    if (selectedCategory && selectedCategory !== 'Γενικά' && selectedCategory !== 'All' && selectedCategory !== 'Όλα') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => item.content.toLowerCase().includes(q));
    }

    if (selectedSort === 'likes') {
      result.sort((a, b) => b.likes - a.likes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [confessions, selectedCategory, searchQuery, selectedSort]);

  const handleResetFilters = () => {
    setSelectedCategory('Γενικά');
    setSearchQuery('');
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Sticky Top Navbar */}
      <Header
        currentUser={currentUser}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleDMs={() => setIsDMsOpen(!isDMsOpen)}
        isDMsOpen={isDMsOpen}
        activeDMsCount={activeDMsCount}
      />

      {/* Modern 3-Column Desktop Architecture (max-w-7xl) */}
      <div className="max-w-7xl mx-auto px-4 py-5 sm:py-6 flex items-start justify-center gap-6 xl:gap-8 flex-1 w-full">
        {/* COLUMN 1: Sticky Left Sidebar (Composer + Categories) */}
        <LeftSidebar
          onConfessionCreated={handleConfessionCreated}
          currentUser={currentUser}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
        />

        {/* COLUMN 2: Center Main Feed */}
        <main className="flex-1 max-w-2xl min-w-0 w-full">
          {/* Mobile-only Compose Prompt Trigger (when on small screens) */}
          <div className="lg:hidden mb-4">
            <button
              type="button"
              onClick={() => setIsMobileComposeOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left transition-colors cursor-pointer shadow-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm select-none" role="img" aria-label="avatar">
                  {currentUser.avatar}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Γράψε μια σκέψη...
                </span>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full shadow-xs"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--accent-text)',
                }}
              >
                Post
              </span>
            </button>
          </div>

          {/* Filters & Search Header */}
          <CategoryFilters
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryCounts={categoryCounts}
          />

          {/* Confessions Stream */}
          <Feed
            confessions={filteredConfessions}
            isLoading={isLoading}
            currentUser={currentUser}
            onStartDM={handleStartDM}
            onResetFilters={handleResetFilters}
          />
        </main>

        {/* COLUMN 3: Collapsible Right Panel for DMs / Chat */}
        <RightDMsPanel
          isOpen={isDMsOpen}
          onClose={() => {
            setIsDMsOpen(false);
            setTargetConfessionForDM(null);
            fetchDMsCount();
          }}
          currentUser={currentUser}
          targetConfession={targetConfessionForDM}
          onClearTargetConfession={() => setTargetConfessionForDM(null)}
          onRefreshUnreadCount={fetchDMsCount}
        />
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsMobileComposeOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-30 p-3.5 rounded-full shadow-xl active:scale-95 transition-all cursor-pointer"
        style={{
          backgroundColor: 'var(--accent-color)',
          color: 'var(--accent-text)',
        }}
        aria-label="New thought"
      >
        <Feather className="w-5 h-5" />
      </button>

      {/* Mobile Compose Modal */}
      <MobileComposeModal
        isOpen={isMobileComposeOpen}
        onClose={() => setIsMobileComposeOpen(false)}
        currentUser={currentUser}
        onConfessionCreated={handleConfessionCreated}
      />

      {/* Settings & Appearance Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onSelectTheme={handleSelectTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Mandatory Onboarding Modal for First Time / Logout */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />

      {/* Minimalist Footer */}
      <footer
        className="w-full border-t py-5 px-4 mt-auto transition-colors"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Secret Wall
          </span>
          <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {confessions.length} δημοσιεύσεις
          </span>
        </div>
      </footer>
    </div>
  );
}
