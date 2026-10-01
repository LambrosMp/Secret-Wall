'use client';

import React, { useState, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Mail,
  Share2,
  Check,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { ConfessionItem, CATEGORIES } from '@/types/confession';
import { timeAgoGreek } from '@/lib/time-ago';
import { CommentsSection } from './CommentsSection';
import { ShareModal } from './ShareModal';
import { UserIdentity } from '@/lib/identity';

interface ConfessionCardProps {
  confession: ConfessionItem;
  currentUser: UserIdentity;
  onStartDM: (confession: ConfessionItem) => void;
}

export const ConfessionCard: React.FC<ConfessionCardProps> = ({
  confession,
  currentUser,
  onStartDM,
}) => {
  const [likes, setLikes] = useState(confession.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(
    confession.comments?.length ?? confession._count?.comments ?? 0
  );

  // Poll state
  const [votesA, setVotesA] = useState(confession.pollVotesA ?? 0);
  const [votesB, setVotesB] = useState(confession.pollVotesB ?? 0);
  const [userVotedOption, setUserVotedOption] = useState<'A' | 'B' | null>(
    confession.userVotedOption || null
  );
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    try {
      const likedConfessions = JSON.parse(sessionStorage.getItem('secret_wall_likes') || '[]');
      if (likedConfessions.includes(confession.id)) {
        setHasLiked(true);
      }
    } catch {
      // Ignore
    }

    // Check if user already voted in this poll during session
    if (confession.isPoll && !userVotedOption) {
      try {
        const storedVote = sessionStorage.getItem(`secret_wall_poll_voted_${confession.id}`);
        if (storedVote === 'A' || storedVote === 'B') {
          setUserVotedOption(storedVote);
        }
      } catch {
        // Ignore
      }
    }
  }, [confession.id, confession.isPoll, userVotedOption]);

  useEffect(() => {
    setLikes(confession.likes);
  }, [confession.likes]);

  useEffect(() => {
    if (typeof confession.pollVotesA === 'number') setVotesA(confession.pollVotesA);
    if (typeof confession.pollVotesB === 'number') setVotesB(confession.pollVotesB);
    if (confession.userVotedOption) setUserVotedOption(confession.userVotedOption);
  }, [confession.pollVotesA, confession.pollVotesB, confession.userVotedOption]);

  const categoryMeta = CATEGORIES.find((c) => c.id === confession.category) || {
    id: confession.category,
    label: confession.category,
    tag: confession.category.toUpperCase(),
  };

  const isMyConfession =
    confession.authorToken && confession.authorToken === currentUser.token;

  const handleLike = async () => {
    if (isLiking) return;

    setLikes((prev) => prev + 1);
    setHasLiked(true);

    try {
      const likedConfessions: string[] = JSON.parse(
        sessionStorage.getItem('secret_wall_likes') || '[]'
      );
      if (!likedConfessions.includes(confession.id)) {
        likedConfessions.push(confession.id);
        sessionStorage.setItem('secret_wall_likes', JSON.stringify(likedConfessions));
      }
    } catch (e) {
      console.warn('SessionStorage unavailable', e);
    }

    try {
      setIsLiking(true);
      const res = await fetch(`/api/confessions/${confession.id}/like`, {
        method: 'POST',
      });
      if (!res.ok) {
        setLikes((prev) => Math.max(0, prev - 1));
      } else {
        const data = await res.json();
        if (typeof data.likes === 'number') {
          setLikes(data.likes);
        }
      }
    } catch (err) {
      console.error('Error updating like:', err);
      setLikes((prev) => Math.max(0, prev - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleVote = async (option: 'A' | 'B') => {
    if (userVotedOption || isVoting || !currentUser.token) return;

    setIsVoting(true);
    // Optimistic vote update
    setUserVotedOption(option);
    if (option === 'A') setVotesA((prev) => prev + 1);
    if (option === 'B') setVotesB((prev) => prev + 1);

    try {
      sessionStorage.setItem(`secret_wall_poll_voted_${confession.id}`, option);
      const res = await fetch(`/api/confessions/${confession.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          option,
          userToken: currentUser.token,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setVotesA(data.pollVotesA);
        setVotesB(data.pollVotesB);
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
    } finally {
      setIsVoting(false);
    }
  };

  // Poll statistics
  const totalVotes = votesA + votesB;
  const percentA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const percentB = totalVotes > 0 ? 100 - percentA : 50;
  const isAheadA = votesA > votesB;
  const isAheadB = votesB > votesA;

  return (
    <article
      className="w-full rounded-2xl p-4 sm:p-5 mb-3.5 border border-[var(--border-color)] shadow-sm transition-all duration-300 ease-out hover:border-[#e5a93c]/40 hover:shadow-[0_4px_24px_-8px_rgba(229,169,60,0.12)] hover:-translate-y-[1px]"
      style={{
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      {/* Card Header */}
      <div
        className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs select-none" role="img" aria-label="avatar">
            {confession.authorAvatar || '👤'}
          </span>
          <span
            className="text-xs font-semibold truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {confession.authorName || 'Anonymous'}
          </span>
          {isMyConfession && (
            <span
              className="text-[10px] tracking-wider uppercase font-mono font-bold"
              style={{ color: 'var(--accent-color)' }}
            >
              · εσύ
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--badge-text)',
            }}
          >
            {categoryMeta.tag}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <time
            dateTime={confession.createdAt}
            className="text-[11px] font-mono"
            style={{ color: 'var(--text-muted)' }}
          >
            {timeAgoGreek(confession.createdAt)}
          </time>
        </div>
      </div>

      {/* Confession Text in Crisp Modern Sans */}
      <p
        className="font-sans text-[15px] sm:text-[16px] font-normal leading-relaxed break-words my-3 whitespace-pre-wrap select-text tracking-normal"
        style={{ color: 'var(--text-primary)' }}
      >
        {confession.content}
      </p>

      {/* Campus Poll UI - Clean Minimal Options */}
      {confession.isPoll && confession.pollOptionA && confession.pollOptionB && (
        <div className="my-3 space-y-2">

          {/* Options Display */}
          {!userVotedOption ? (
            /* Voting State: Interactive Buttons */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleVote('A')}
                disabled={isVoting}
                className="w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer hover:border-[var(--accent-color)] active:scale-[0.99] flex items-center justify-between group"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="truncate mr-2">{confession.pollOptionA}</span>
                <span
                  className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-colors group-hover:border-[var(--accent-color)] group-hover:text-[var(--accent-color)]"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
                  A
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleVote('B')}
                disabled={isVoting}
                className="w-full p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer hover:border-[var(--accent-color)] active:scale-[0.99] flex items-center justify-between group"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="truncate mr-2">{confession.pollOptionB}</span>
                <span
                  className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-colors group-hover:border-[var(--accent-color)] group-hover:text-[var(--accent-color)]"
                  style={{
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
                  B
                </span>
              </button>
            </div>
          ) : (
            /* Voted State: Clean Progress Bars */
            <div className="space-y-2">
              {/* Option A Progress */}
              <div
                className="relative overflow-hidden rounded-xl border p-2.5 flex items-center justify-between transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: userVotedOption === 'A' ? 'var(--accent-color)' : 'var(--border-color)',
                }}
              >
                {/* Fill bar */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none rounded-xl"
                  style={{
                    width: `${percentA}%`,
                    backgroundColor: isAheadA ? 'rgba(229, 169, 60, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                  }}
                />

                <div className="relative z-10 flex items-center gap-1.5 min-w-0 pr-2">
                  {userVotedOption === 'A' && (
                    <Check className="w-3.5 h-3.5 text-[#e5a93c] shrink-0 stroke-[2.5]" />
                  )}
                  <span
                    className={`text-xs truncate ${
                      userVotedOption === 'A' ? 'font-bold text-[#e5a93c]' : 'font-medium'
                    }`}
                    style={{ color: userVotedOption === 'A' ? undefined : 'var(--text-primary)' }}
                  >
                    {confession.pollOptionA}
                  </span>
                </div>

                <div className="relative z-10 text-right shrink-0">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isAheadA ? 'text-[#e5a93c]' : ''
                    }`}
                    style={{ color: isAheadA ? '#e5a93c' : 'var(--text-primary)' }}
                  >
                    {percentA}%
                  </span>
                  <span className="text-[10px] font-mono ml-1" style={{ color: 'var(--text-muted)' }}>
                    ({votesA})
                  </span>
                </div>
              </div>

              {/* Option B Progress */}
              <div
                className="relative overflow-hidden rounded-xl border p-2.5 flex items-center justify-between transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: userVotedOption === 'B' ? 'var(--accent-color)' : 'var(--border-color)',
                }}
              >
                {/* Fill bar */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700 pointer-events-none rounded-xl"
                  style={{
                    width: `${percentB}%`,
                    backgroundColor: isAheadB ? 'rgba(229, 169, 60, 0.22)' : 'rgba(255, 255, 255, 0.06)',
                  }}
                />

                <div className="relative z-10 flex items-center gap-1.5 min-w-0 pr-2">
                  {userVotedOption === 'B' && (
                    <Check className="w-3.5 h-3.5 text-[#e5a93c] shrink-0 stroke-[2.5]" />
                  )}
                  <span
                    className={`text-xs truncate ${
                      userVotedOption === 'B' ? 'font-bold text-[#e5a93c]' : 'font-medium'
                    }`}
                    style={{ color: userVotedOption === 'B' ? undefined : 'var(--text-primary)' }}
                  >
                    {confession.pollOptionB}
                  </span>
                </div>

                <div className="relative z-10 text-right shrink-0">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isAheadB ? 'text-[#e5a93c]' : ''
                    }`}
                    style={{ color: isAheadB ? '#e5a93c' : 'var(--text-primary)' }}
                  >
                    {percentB}%
                  </span>
                  <span className="text-[10px] font-mono ml-1" style={{ color: 'var(--text-muted)' }}>
                    ({votesB})
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div
        className="flex items-center justify-between pt-2.5 border-t"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors p-1.5 -ml-1 rounded-lg cursor-pointer"
          style={{
            color: hasLiked ? 'var(--accent-color)' : 'var(--text-secondary)',
          }}
          aria-label="Like"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              hasLiked ? 'fill-current scale-110' : ''
            }`}
          />
          <span className="tabular-nums font-mono text-[11px]">{likes}</span>
        </button>

        {/* Comments Toggle */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors p-1.5 rounded-lg cursor-pointer"
          style={{
            color: showComments ? 'var(--accent-color)' : 'var(--text-secondary)',
          }}
          aria-label="Comments"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="tabular-nums font-mono text-[11px]">{commentsCount}</span>
        </button>

        {/* DM Action Button */}
        {!isMyConfession ? (
          <button
            type="button"
            onClick={() => onStartDM(confession)}
            className="flex items-center gap-1 text-xs font-semibold transition-colors p-1.5 rounded-lg cursor-pointer hover:opacity-80"
            style={{ color: 'var(--accent-color)' }}
            title="Ανώνυμο Αίτημα DM"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="text-[11px]">DM</span>
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Share Button (Opens Share as Story / Image Card Modal) */}
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="p-1.5 -mr-1 rounded-lg transition-colors cursor-pointer hover:text-white"
          style={{ color: 'var(--text-secondary)' }}
          title="Κοινοποίηση ως Story / Εικόνα"
          aria-label="Share"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        confession={confession}
      />

      {/* Collapsible Comments Section with Nested Replies & Likes */}
      {showComments && (
        <CommentsSection
          confessionId={confession.id}
          initialComments={confession.comments || []}
          currentUser={currentUser}
          onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
        />
      )}
    </article>
  );
};
