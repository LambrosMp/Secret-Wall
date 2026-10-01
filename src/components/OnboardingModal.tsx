'use client';

import React, { useState, useEffect } from 'react';
import { getRandomSuggestedIdentity, saveIdentity, UserIdentity } from '@/lib/identity';
import { Dices, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (identity: UserIdentity) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🦊');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initial = getRandomSuggestedIdentity();
      setName(initial.name);
      setAvatar(initial.avatar);
      setError(null);
    }
  }, [isOpen]);

  const handleRandomize = () => {
    const suggested = getRandomSuggestedIdentity();
    setName(suggested.name);
    setAvatar(suggested.avatar);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Παρακαλώ πληκτρολόγησε ένα όνομα ή διάλεξε τυχαίο.');
      return;
    }

    if (trimmed.length < 2) {
      setError('Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες.');
      return;
    }

    if (trimmed.length > 25) {
      setError('Το όνομα δεν μπορεί να υπερβαίνει τους 25 χαρακτήρες.');
      return;
    }

    const created = saveIdentity(trimmed, avatar);
    onComplete(created);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-7 shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Top Badge & Welcome */}
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-sm select-none"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
            }}
          >
            {avatar}
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase mb-2"
            style={{
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--badge-text)',
            }}
          >
            <Sparkles className="w-3 h-3" />
            <span>Secret Wall Identity</span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Καλωσήρθες στο Secret Wall
          </h2>
          <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Επίλεξε το ψευδώνυμο με το οποίο θα δημοσιεύεις σκέψεις και θα στέλνεις ανώνυμα μηνύματα.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Το όνομά σου
            </label>

            <div className="relative">
              <input
                id="username"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="π.χ. Alex99 ή MysteriousWolf"
                maxLength={25}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {error && (
              <p className="text-xs text-rose-500 mt-1.5 font-medium">
                {error}
              </p>
            )}
          </div>

          {/* Random Suggestion Button */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <Dices className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              <span>Τυχαίο Όνομα</span>
            </button>

            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {name.length}/25 χαρακτήρες
            </span>
          </div>

          {/* Identity Freeze Notice */}
          <div
            className="p-3 rounded-xl flex items-start gap-2.5 text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-color)' }} />
            <p>
              <strong>Κλείδωμα ταυτότητας:</strong> Το όνομα δεν μπορεί να αλλάξει μετά την είσοδο παρά μόνο με έξοδο από τις ρυθμίσεις.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: 'var(--accent-text)',
            }}
          >
            <span>Είσοδος στο Wall</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
