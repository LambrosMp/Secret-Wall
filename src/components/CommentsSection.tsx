'use client';

import React, { useState } from 'react';
import { CommentItem } from '@/types/confession';
import { UserIdentity } from '@/lib/identity';
import { timeAgoGreek } from '@/lib/time-ago';
import { Send, AlertCircle, Heart, MessageSquare, ChevronDown, ChevronUp, X } from 'lucide-react';

interface CommentsSectionProps {
  confessionId: string;
  initialComments?: CommentItem[];
  currentUser: UserIdentity;
  onCommentAdded?: (newComment: CommentItem) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  confessionId,
  initialComments = [],
  currentUser,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Keep track of which comments have their replies expanded (default to expanded)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: prev[commentId] === undefined ? false : !prev[commentId],
    }));
  };

  const handleLikeComment = async (commentId: string, isReply: boolean, parentId?: string | null) => {
    if (!currentUser.token) return;

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (!isReply && c.id === commentId) {
          const hasLiked = !c.hasLiked;
          const currentCount = c.likesCount ?? 0;
          return {
            ...c,
            hasLiked,
            likesCount: hasLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
          };
        }

        if (isReply && parentId && c.id === parentId && c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) => {
              if (r.id === commentId) {
                const hasLiked = !r.hasLiked;
                const currentCount = r.likesCount ?? 0;
                return {
                  ...r,
                  hasLiked,
                  likesCount: hasLiked ? currentCount + 1 : Math.max(0, currentCount - 1),
                };
              }
              return r;
            }),
          };
        }

        return c;
      })
    );

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken: currentUser.token }),
      });

      if (res.ok) {
        const data = await res.json();
        // Sync true likesCount
        setComments((prev) =>
          prev.map((c) => {
            if (!isReply && c.id === commentId) {
              return {
                ...c,
                hasLiked: data.liked,
                likesCount: data.likesCount,
              };
            }
            if (isReply && parentId && c.id === parentId && c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId
                    ? { ...r, hasLiked: data.liked, likesCount: data.likesCount }
                    : r
                ),
              };
            }
            return c;
          })
        );
      }
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = newCommentText.trim();
    if (!trimmed) {
      setErrorMessage('Το σχόλιο δεν μπορεί να είναι κενό.');
      return;
    }

    if (trimmed.length > 300) {
      setErrorMessage('Το σχόλιο δεν μπορεί να υπερβαίνει τους 300 χαρακτήρες.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/confessions/${confessionId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          authorToken: currentUser.token,
          parentId: replyingTo ? replyingTo.id : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Σφάλμα κατά την ανάρτηση του σχολίου.');
        return;
      }

      setNewCommentText('');
      const createdComment: CommentItem = data.comment;

      if (createdComment.parentId) {
        // Nested reply added
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === createdComment.parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), createdComment],
              };
            }
            return c;
          })
        );
        // Ensure parent replies are expanded
        setExpandedReplies((prev) => ({ ...prev, [createdComment.parentId!]: true }));
      } else {
        // Top-level comment added
        setComments((prev) => [...prev, createdComment]);
      }

      setReplyingTo(null);
      if (onCommentAdded) {
        onCommentAdded(createdComment);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setErrorMessage('Αποτυχία σύνδεσης με τον διακομιστή.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="pt-3.5 mt-3 border-t space-y-3 animate-in fade-in slide-in-from-top-1 duration-150"
      style={{ borderColor: 'var(--border-color)' }}
    >
      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-xs italic py-1" style={{ color: 'var(--text-muted)' }}>
          Δεν υπάρχουν σχόλια ακόμα. Γίνε ο πρώτος που θα απαντήσει!
        </p>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto no-scrollbar pr-1">
          {comments.map((comment) => {
            const isMe = comment.authorToken === currentUser.token;
            const replies = comment.replies || [];
            const hasReplies = replies.length > 0;
            const isExpanded = expandedReplies[comment.id] !== false; // default expanded

            return (
              <div key={comment.id} className="space-y-2">
                {/* Parent Comment */}
                <div
                  className="flex items-start gap-2.5 p-2.5 rounded-xl text-xs transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <span className="text-sm select-none shrink-0" role="img" aria-label="avatar">
                    {comment.authorAvatar}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className="font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {comment.authorName}{' '}
                        {isMe && (
                          <span
                            className="text-[10px] font-normal"
                            style={{ color: 'var(--accent-color)' }}
                          >
                            (εσύ)
                          </span>
                        )}
                      </span>
                      <span
                        className="text-[10px] font-mono shrink-0"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {timeAgoGreek(comment.createdAt)}
                      </span>
                    </div>

                    <p
                      className="leading-relaxed break-words whitespace-pre-wrap font-normal"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {comment.content}
                    </p>

                    {/* Actions: Like & Reply */}
                    <div className="flex items-center gap-3 mt-1.5 pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleLikeComment(comment.id, false)}
                        className="flex items-center gap-1 transition-colors cursor-pointer"
                        style={{
                          color: comment.hasLiked ? '#f43f5e' : 'var(--text-muted)',
                        }}
                      >
                        <Heart
                          className={`w-3 h-3 ${comment.hasLiked ? 'fill-rose-500' : ''}`}
                        />
                        <span className="font-mono text-[10px]">
                          {(comment.likesCount ?? 0) > 0 ? comment.likesCount : ''}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplyingTo({ id: comment.id, name: comment.authorName })}
                        className="flex items-center gap-1 hover:underline cursor-pointer transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Απάντηση</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies Accordion Toggle & Container */}
                {hasReplies && (
                  <div className="ml-5 sm:ml-7 space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleReplies(comment.id)}
                      className="flex items-center gap-1 text-[11px] font-medium cursor-pointer transition-colors"
                      style={{ color: 'var(--accent-color)' }}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          <span>Απόκρυψη απαντήσεων</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          <span>
                            Δες {replies.length} {replies.length === 1 ? 'απάντηση' : 'απαντήσεις'}
                          </span>
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-l-2 border-zinc-800 pl-3 space-y-2">
                        {replies.map((reply) => {
                          const isReplyMe = reply.authorToken === currentUser.token;
                          return (
                            <div
                              key={reply.id}
                              className="flex items-start gap-2 p-2 rounded-lg text-xs transition-colors"
                              style={{
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                              }}
                            >
                              <span
                                className="text-xs select-none shrink-0"
                                role="img"
                                aria-label="avatar"
                              >
                                {reply.authorAvatar}
                              </span>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span
                                    className="font-semibold text-[11px] truncate"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {reply.authorName}{' '}
                                    {isReplyMe && (
                                      <span
                                        className="text-[9px] font-normal"
                                        style={{ color: 'var(--accent-color)' }}
                                      >
                                        (εσύ)
                                      </span>
                                    )}
                                  </span>
                                  <span
                                    className="text-[9px] font-mono shrink-0"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    {timeAgoGreek(reply.createdAt)}
                                  </span>
                                </div>

                                <p
                                  className="leading-relaxed break-words whitespace-pre-wrap text-[11px]"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {reply.content}
                                </p>

                                <div className="flex items-center gap-3 mt-1 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => handleLikeComment(reply.id, true, comment.id)}
                                    className="flex items-center gap-1 transition-colors cursor-pointer"
                                    style={{
                                      color: reply.hasLiked ? '#f43f5e' : 'var(--text-muted)',
                                    }}
                                  >
                                    <Heart
                                      className={`w-2.5 h-2.5 ${reply.hasLiked ? 'fill-rose-500' : ''}`}
                                    />
                                    <span className="font-mono text-[9px]">
                                      {(reply.likesCount ?? 0) > 0 ? reply.likesCount : ''}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReplyingTo({ id: comment.id, name: reply.authorName })
                                    }
                                    className="flex items-center gap-1 hover:underline cursor-pointer"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    <MessageSquare className="w-2.5 h-2.5" />
                                    <span>Απάντηση</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-start gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/30 text-rose-300 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Replying banner */}
      {replyingTo && (
        <div
          className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px]"
          style={{
            backgroundColor: 'var(--badge-bg)',
            color: 'var(--badge-text)',
            border: '1px solid var(--border-accent)',
          }}
        >
          <span>
            Απάντηση στον/στην <strong>@{replyingTo.name}</strong>
          </span>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-0.5 hover:opacity-75 cursor-pointer"
            aria-label="Ακύρωση απάντησης"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Comment Input */}
      <form onSubmit={handleSubmitComment} className="flex items-center gap-2 pt-1">
        <div className="relative flex-1 flex items-center">
          <span className="absolute left-3 text-xs select-none pointer-events-none opacity-80">
            {currentUser.avatar}
          </span>
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder={
              replyingTo
                ? `Απάντηση στον @${replyingTo.name}...`
                : 'Προσθήκη σχολίου...'
            }
            maxLength={300}
            className="w-full text-xs rounded-full pl-8 pr-3 py-2 outline-none transition-colors"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !newCommentText.trim()}
          className="p-2 rounded-full transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'var(--accent-text)',
          }}
          aria-label="Send comment"
        >
          <Send className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
