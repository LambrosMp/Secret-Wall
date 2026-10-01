'use client';

import React from 'react';
import { X, Moon, Sun, Check, LogOut, Shield } from 'lucide-react';
import { AppTheme } from '@/types/confession';
import { UserIdentity } from '@/lib/identity';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
  currentUser: UserIdentity;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  currentUser,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 mb-5 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent-color)',
              }}
            >
              <Sun className="w-4 h-4 hidden [data-theme=light]_&:block" />
              <Moon className="w-4 h-4 block [data-theme=light]_&:hidden" />
            </div>
            <h2 className="text-sm font-semibold tracking-wide">
              Ρυθμίσεις & Εμφάνιση
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Κλείσιμο"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Themes */}
        <div className="space-y-4">
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Επιλογή Θέματος
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Night Mode Card */}
              <button
                type="button"
                onClick={() => onSelectTheme('night')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-28 ${
                  currentTheme === 'night'
                    ? 'ring-2 ring-amber-500/50'
                    : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: '#09090b',
                  borderColor: currentTheme === 'night' ? '#e5a93c' : '#27272a',
                  color: '#fafafa',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-[#e5a93c]" />
                    <span className="text-xs font-semibold">Night</span>
                  </div>
                  {currentTheme === 'night' && (
                    <div className="w-4 h-4 rounded-full bg-[#e5a93c] text-[#09090b] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#e5a93c]" />
                    <span className="text-[10px] text-zinc-400 font-mono">Matte Obsidian</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Προεπιλεγμένο σκοτεινό</p>
                </div>
              </button>

              {/* Light Mode Card */}
              <button
                type="button"
                onClick={() => onSelectTheme('light')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between h-28 ${
                  currentTheme === 'light'
                    ? 'ring-2 ring-amber-600/50'
                    : 'hover:opacity-90'
                }`}
                style={{
                  backgroundColor: '#f8f9fa',
                  borderColor: currentTheme === 'light' ? '#d97706' : '#e4e4e7',
                  color: '#18181b',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-[#d97706]" />
                    <span className="text-xs font-semibold">Light</span>
                  </div>
                  {currentTheme === 'light' && (
                    <div className="w-4 h-4 rounded-full bg-[#d97706] text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
                    <span className="text-[10px] text-zinc-600 font-mono">Warm Sand</span>
                  </div>
                  <p className="text-[10px] text-zinc-500">Καθαρό & φωτεινό</p>
                </div>
              </button>
            </div>
          </div>

          {/* Section 2: User Identity & Freeze */}
          <div
            className="pt-4 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Τρέχουσα Ταυτότητα
              </h3>
              <span
                className="text-[10px] flex items-center gap-1 font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                <Shield className="w-3 h-3 text-amber-500" />
                Κλειδωμένη
              </span>
            </div>

            <div
              className="p-3 rounded-xl flex items-center justify-between"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl select-none shrink-0" role="img" aria-label="avatar">
                  {currentUser.avatar}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {currentUser.name}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    Μόνιμο ψευδώνυμο συνεδρίας
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer shrink-0"
                title="Έξοδος και αλλαγή ταυτότητας"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Έξοδος</span>
              </button>
            </div>

            <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Το όνομά σου διατηρείται στην ανανέωση (F5). Με το κλείσιμο της καρτέλας ή με «Έξοδος», η συνεδρία λήγει και θα ζητηθεί νέο όνομα.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: 'var(--accent-text)',
            }}
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
};
