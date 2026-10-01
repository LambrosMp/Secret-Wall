'use client';

import React from 'react';
import { ConfessionCard } from './ConfessionCard';
import { ConfessionItem } from '@/types/confession';
import { UserIdentity } from '@/lib/identity';
import { Feather } from 'lucide-react';

interface FeedProps {
  confessions: ConfessionItem[];
  isLoading: boolean;
  currentUser: UserIdentity;
  onStartDM: (confession: ConfessionItem) => void;
  onResetFilters?: () => void;
}

export const Feed: React.FC<FeedProps> = ({
  confessions,
  isLoading,
  currentUser,
  onStartDM,
  onResetFilters,
}) => {
  if (isLoading) {
    return (
      <div className="w-full space-y-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full rounded-2xl p-5 space-y-3 animate-pulse transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              className="flex items-center justify-between pb-2 border-b"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                />
                <div
                  className="h-3 w-24 rounded"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                />
              </div>
              <div
                className="h-3 w-16 rounded"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
            </div>
            <div className="space-y-2 py-2">
              <div
                className="h-4 rounded w-full"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
              <div
                className="h-4 rounded w-5/6"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
            </div>
            <div
              className="flex justify-between pt-2 border-t"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div
                className="h-3 w-10 rounded"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
              <div
                className="h-3 w-10 rounded"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
              <div
                className="h-3 w-10 rounded"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
              <div
                className="h-3 w-6 rounded"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (confessions.length === 0) {
    return (
      <div className="w-full py-16 text-center">
        <div
          className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center shadow-xs"
          style={{
            backgroundColor: 'var(--badge-bg)',
            border: '1px solid var(--border-accent)',
            color: 'var(--accent-color)',
          }}
        >
          <Feather className="w-4 h-4" />
        </div>
        <h3
          className="text-base font-semibold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Καμία σκέψη ακόμα
        </h3>
        <p
          className="text-xs mb-4 max-w-xs mx-auto"
          style={{ color: 'var(--text-secondary)' }}
        >
          Δεν υπάρχουν δημοσιεύσεις σε αυτή την κατηγορία.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--accent-color)',
              border: '1px solid var(--border-accent)',
            }}
          >
            Επιστροφή στα Γενικά
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full pb-16">
      {confessions.map((confession) => (
        <ConfessionCard
          key={confession.id}
          confession={confession}
          currentUser={currentUser}
          onStartDM={onStartDM}
        />
      ))}
    </div>
  );
};
