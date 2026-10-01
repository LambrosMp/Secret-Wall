'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CATEGORIES, ConfessionCategory, ConfessionItem } from '@/types/confession';
import { UserIdentity } from '@/lib/identity';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfessionFormProps {
  onConfessionCreated: (newConfession: ConfessionItem) => void;
  currentUser: UserIdentity;
}

export const ConfessionForm: React.FC<ConfessionFormProps> = ({
  onConfessionCreated,
  currentUser,
}) => {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ConfessionCategory>('Γενικά');
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
      textareaRef.current.style.height = `${Math.max(60, textareaRef.current.scrollHeight)}px`;
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || 'Σφάλμα κατά την ανάρτηση.');
        return;
      }

      setSuccessMessage('Η ανάρτηση ολοκληρώθηκε.');
      setContent('');
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
    <div className="w-full mb-6">
      <div className="bg-[#171026] border border-[#c5a059]/15 rounded-xl p-4 sm:p-5 shadow-xs transition-colors focus-within:border-[#c5a059]/30">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main Input Row */}
          <div className="flex items-start gap-3">
            <span className="text-base select-none shrink-0 mt-1 opacity-80" role="img" aria-label="avatar">
              {currentUser.avatar}
            </span>

            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Γράψε μια σκέψη..."
                rows={2}
                maxLength={MAX_CHARS + 30}
                className="w-full bg-transparent text-[#fdfdfd] placeholder-[#a59db8]/60 font-editorial text-base sm:text-[17px] outline-none resize-none leading-relaxed overflow-hidden py-0.5"
              />
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-950/40 border border-rose-800/30 text-rose-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-[#1b122c] border border-[#c5a059]/30 text-[#fdfdfd] text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#c5a059] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Bottom Bar: Minimal Category Dropdown + Character Count + Post Button */}
          <div className="flex items-center justify-between pt-2 border-t border-[#c5a059]/10 gap-2">
            {/* Minimalist discreet category selector */}
            <div className="flex items-center gap-1.5 text-xs text-[#a59db8]">
              <span className="text-[11px] uppercase tracking-wider text-[#a59db8]/70">Θέμα:</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ConfessionCategory)}
                className="bg-transparent text-[#c5a059] font-medium text-xs border-b border-[#c5a059]/30 focus:outline-none focus:border-[#c5a059] cursor-pointer py-0.5 tracking-wide"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#171026] text-[#fdfdfd]">
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Counter + Clean Editorial Post Button */}
            <div className="flex items-center gap-3">
              <span
                className={`text-[11px] tabular-nums font-mono ${
                  charsRemaining < 0
                    ? 'text-rose-400 font-bold'
                    : charsRemaining <= 30
                    ? 'text-[#c5a059]'
                    : 'text-[#a59db8]/70'
                }`}
              >
                {currentLength}/{MAX_CHARS}
              </span>

              <button
                type="submit"
                disabled={isSubmitting || currentLength === 0 || currentLength > MAX_CHARS}
                className="px-4 py-1.5 rounded-full border border-[#c5a059]/50 hover:border-[#c5a059] bg-[#c5a059]/10 hover:bg-[#c5a059] text-[#c5a059] hover:text-[#0c0814] font-semibold text-xs tracking-wide transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Δημοσίευση...' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
