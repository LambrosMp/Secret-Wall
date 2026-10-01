'use client';

import React from 'react';
import { Mail, Settings } from 'lucide-react';
import { UserIdentity } from '@/lib/identity';

interface HeaderProps {
  currentUser: UserIdentity;
  onOpenSettings: () => void;
  onToggleDMs: () => void;
  isDMsOpen: boolean;
  activeDMsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenSettings,
  onToggleDMs,
  isDMsOpen,
  activeDMsCount = 0,
}) => {
  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'rgba(var(--bg-page), 0.85)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Modern Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-base sm:text-lg font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Secret Wall
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--accent-color)' }}
          />
        </div>

        {/* Identity, DMs & Settings Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Locked Identity Chip */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
            title="Η ταυτότητά σου είναι κλειδωμένη"
          >
            <span className="text-xs sm:text-sm select-none" role="img" aria-label="avatar">
              {currentUser.avatar}
            </span>
            <span
              className="text-[11px] sm:text-xs font-semibold max-w-[100px] xs:max-w-[130px] sm:max-w-[160px] truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentUser.name}
            </span>
          </div>

          {/* DMs Toggle Button */}
          <button
            type="button"
            onClick={onToggleDMs}
            title="Προσωπικά Μηνύματα"
            className="relative p-2 rounded-full border transition-all cursor-pointer"
            style={{
              backgroundColor: isDMsOpen ? 'var(--accent-color)' : 'var(--bg-surface)',
              borderColor: isDMsOpen ? 'var(--accent-color)' : 'var(--border-color)',
              color: isDMsOpen ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
            aria-label="Toggle Direct Messages"
          >
            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {activeDMsCount > 0 && (
              <span
                className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--accent-text)',
                }}
              >
                {activeDMsCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            title="Ρυθμίσεις & Θέμα"
            className="p-2 rounded-full border transition-all cursor-pointer hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
