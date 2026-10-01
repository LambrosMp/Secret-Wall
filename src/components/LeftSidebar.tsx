'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES, ConfessionCategory, ConfessionItem } from '@/types/confession';
import { UserIdentity } from '@/lib/identity';
import { AlertCircle, CheckCircle2, BarChart2, X } from 'lucide-react';

interface LeftSidebarProps {
  onConfessionCreated: (newConfession: ConfessionItem) => void;
  currentUser: UserIdentity;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onConfessionCreated,
  currentUser,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(68, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

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

      setSuccessMessage('Η ανάρτηση δημοσιεύτηκε.');
      setContent('');
      setIsPoll(false);
      setPollOptionA('');
      setPollOptionB('');
      onConfessionCreated(data.confession);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error posting confession:', err);
      setErrorMessage('Αποτυχία σύνδεσης με τον διακομιστή.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <aside className="w-80 shrink-0 hidden lg:block sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar space-y-4">
      {/* Permanent Post Composer Card */}
      <div
        className="rounded-2xl p-4 shadow-sm transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
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
            className="w-full text-xs outline-none resize-none leading-relaxed transition-colors block bg-transparent"
            style={{
              color: 'var(--text-primary)',
            }}
            rows={3}
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
                  className="p-0.5 rounded hover:bg-zinc-800/40 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Αφαίρεση δημοσκόπησης"
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
              {/* Category selector */}
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ConfessionCategory)}
                className="bg-transparent font-medium text-xs border-b focus:outline-none cursor-pointer py-0.5 max-w-[90px]"
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

              {/* Poll toggle button */}
              <button
                type="button"
                onClick={() => setIsPoll(!isPoll)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer border ${
                  isPoll
                    ? 'bg-[#e5a93c]/15 text-[#e5a93c] border-[#e5a93c]/30 font-semibold'
                    : 'text-zinc-400 border-transparent hover:text-zinc-200'
                }`}
                title="Προσθήκη Φοιτητικής Δημοσκόπησης"
              >
                <BarChart2 className="w-3 h-3" />
                <span>Poll</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
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

      {/* Minimal Category Filter List */}
      <div
        className="rounded-2xl p-3.5 shadow-sm transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h3
          className="text-[11px] font-mono uppercase tracking-wider px-2 pb-2 mb-1 border-b"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
          }}
        >
          Κατηγορίες
        </h3>

        <nav className="space-y-0.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] ?? 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer transition-colors duration-200 ${
                  isSelected
                    ? ''
                    : 'text-[var(--text-secondary)] hover:text-[#e5a93c] hover:bg-[#e5a93c]/5'
                }`}
                style={{
                  backgroundColor: isSelected ? 'var(--badge-bg)' : undefined,
                  color: isSelected ? 'var(--accent-color)' : undefined,
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)',
                    }}
                  />
                  <span>{cat.label}</span>
                </div>

                {count > 0 && (
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-color)' : 'var(--bg-subtle)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-muted)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
