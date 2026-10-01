'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES, ConfessionCategory, ConfessionItem } from '@/types/confession';
import { UserIdentity } from '@/lib/identity';
import { X, AlertCircle, CheckCircle2, BarChart2 } from 'lucide-react';

interface MobileComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserIdentity;
  onConfessionCreated: (newConfession: ConfessionItem) => void;
}

export const MobileComposeModal: React.FC<MobileComposeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfessionCreated,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ConfessionCategory>('Γενικά');
  const [isPoll, setIsPoll] = useState(false);
  const [pollOptionA, setPollOptionA] = useState('');
  const [pollOptionB, setPollOptionB] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 300;
  const currentLength = content.length;
  const charsRemaining = MAX_CHARS - currentLength;

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmed = content.trim();

    if (!trimmed) {
      setErrorMessage('Γράψε μια σκέψη πριν τη δημοσίευση.');
      return;
    }

    if (trimmed.length < 5) {
      setErrorMessage('Τουλάχιστον 5 χαρακτήρες.');
      return;
    }

    if (trimmed.length > MAX_CHARS) {
      setErrorMessage(`Υπέρβαση ορίου ${MAX_CHARS} χαρακτήρων.`);
      return;
    }

    if (isPoll) {
      if (!pollOptionA.trim() || !pollOptionB.trim()) {
        setErrorMessage('Συμπλήρωσε και τις δύο επιλογές της δημοσκόπησης.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/confessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: trimmed,
          category,
          authorToken: currentUser.token,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          isPoll,
          pollOptionA: isPoll ? pollOptionA.trim() : undefined,
          pollOptionB: isPoll ? pollOptionB.trim() : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Σφάλμα κατά την ανάρτηση.');
        return;
      }

      setSuccessMessage('Η ανάρτηση ολοκληρώθηκε.');
      setContent('');
      setIsPoll(false);
      setPollOptionA('');
      setPollOptionB('');
      onConfessionCreated(data.confession);

      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error posting confession:', err);
      setErrorMessage('Αποτυχία σύνδεσης με τον διακομιστή.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3 mb-3 border-b"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Νέα Σκέψη
            </span>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setErrorMessage(null);
            }}
            placeholder={
              isPoll
                ? 'Κάνε μια ερώτηση ή θέσε ένα δίλημμα για την πανεπιστημιούπολη...'
                : 'Γράψε μια σκέψη...'
            }
            maxLength={MAX_CHARS}
            className="w-full text-sm outline-none resize-none leading-relaxed transition-colors block bg-transparent"
            style={{
              color: 'var(--text-primary)',
            }}
            rows={4}
          />

          {/* Campus Poll Options Sub-card */}
          {isPoll && (
            <div
              className="p-3 rounded-xl border space-y-2 animate-in fade-in duration-150"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: 'var(--accent-color)' }}
                >
                  <BarChart2 className="w-3 h-3" />
                  <span>Επιλογές Δημοσκόπησης</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPoll(false);
                    setPollOptionA('');
                    setPollOptionB('');
                  }}
                  className="p-0.5 rounded text-zinc-400 hover:text-white cursor-pointer"
                  title="Αφαίρεση"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <input
                  type="text"
                  value={pollOptionA}
                  onChange={(e) => setPollOptionA(e.target.value)}
                  placeholder="Επιλογή 1 (π.χ. Ναι / Σίγουρα)"
                  maxLength={50}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none transition-colors border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />

                <input
                  type="text"
                  value={pollOptionB}
                  onChange={(e) => setPollOptionB(e.target.value)}
                  placeholder="Επιλογή 2 (π.χ. Όχι / Με τίποτα)"
                  maxLength={50}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs outline-none transition-colors border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/30 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/30 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Footer */}
          <div
            className="flex items-center justify-between pt-2 border-t"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center gap-2 text-xs">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ConfessionCategory)}
                className="bg-transparent font-medium text-xs border-b focus:outline-none cursor-pointer py-0.5 max-w-[95px]"
                style={{
                  color: 'var(--accent-color)',
                  borderColor: 'var(--border-accent)',
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {cat.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsPoll(!isPoll)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer border ${
                  isPoll
                    ? 'bg-[#e5a93c]/15 text-[#e5a93c] border-[#e5a93c]/30 font-semibold'
                    : 'text-zinc-400 border-transparent hover:text-zinc-200'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>Poll</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-[10px] tabular-nums font-mono ${
                  charsRemaining < 0
                    ? 'text-rose-400 font-bold'
                    : charsRemaining <= 30
                    ? 'text-amber-500'
                    : ''
                }`}
                style={{ color: charsRemaining > 30 ? 'var(--text-muted)' : undefined }}
              >
                {currentLength}/{MAX_CHARS}
              </span>

              <button
                type="submit"
                disabled={isSubmitting || currentLength === 0 || currentLength > MAX_CHARS}
                className="px-4 py-1.5 rounded-full font-semibold text-xs transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--accent-text)',
                }}
              >
                {isSubmitting ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
