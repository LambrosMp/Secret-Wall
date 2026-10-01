'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserIdentity } from '@/lib/identity';
import { ConversationItem, MessageItem, ConfessionItem } from '@/types/confession';
import { timeAgoGreek } from '@/lib/time-ago';
import {
  X,
  Send,
  MessageSquare,
  Lock,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

interface RightDMsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserIdentity;
  targetConfession?: ConfessionItem | null;
  onClearTargetConfession?: () => void;
  onRefreshUnreadCount?: () => void;
}

export const RightDMsPanel: React.FC<RightDMsPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetConfession,
  onClearTargetConfession,
  onRefreshUnreadCount,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = useCallback(async () => {
    if (!currentUser.token) return;
    try {
      setIsLoadingList(true);
      const res = await fetch(`/api/conversations?token=${encodeURIComponent(currentUser.token)}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        if (onRefreshUnreadCount) onRefreshUnreadCount();
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentUser.token, onRefreshUnreadCount]);

  const fetchMessages = useCallback(
    async (convId: string) => {
      if (!currentUser.token) return;
      try {
        const res = await fetch(
          `/api/conversations/${convId}/messages?token=${encodeURIComponent(currentUser.token)}`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          if (data.conversation) {
            setConversations((prev) =>
              prev.map((c) => (c.id === data.conversation.id ? { ...c, status: data.conversation.status } : c))
            );
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    },
    [currentUser.token]
  );

  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  useEffect(() => {
    if (!isOpen || !targetConfession || !currentUser.token) return;

    const startOrOpenTarget = async () => {
      try {
        setIsLoadingMessages(true);
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            confessionId: targetConfession.id,
            userToken: currentUser.token,
            userName: currentUser.name,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.conversation) {
            setActiveConvId(data.conversation.id);
            await fetchConversations();
            await fetchMessages(data.conversation.id);
          }
        }
      } catch (err) {
        console.error('Error starting conversation with target:', err);
      } finally {
        setIsLoadingMessages(false);
        if (onClearTargetConfession) onClearTargetConfession();
      }
    };

    startOrOpenTarget();
  }, [isOpen, targetConfession, currentUser, onClearTargetConfession, fetchConversations, fetchMessages]);

  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId);
      scrollToBottom();

      const interval = setInterval(() => {
        fetchMessages(activeConvId);
      }, 4000);

      // Auto-focus input for instant messaging
      setTimeout(() => inputRef.current?.focus(), 150);

      return () => clearInterval(interval);
    }
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !inputText.trim() || isSending) return;

    const trimmed = inputText.trim();
    setErrorMessage(null);

    try {
      setIsSending(true);
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderToken: currentUser.token,
          text: trimmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Σφάλμα κατά την αποστολή.');
        return;
      }

      setInputText('');
      setMessages((prev) => [...prev, data.message]);
      fetchConversations();
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setErrorMessage('Αποτυχία αποστολής μηνύματος.');
    } finally {
      setIsSending(false);
    }
  };

  const currentConv = conversations.find((c) => c.id === activeConvId);
  const otherPartyName = currentConv
    ? currentConv.user1Token === currentUser.token
      ? currentConv.user2Name
      : currentConv.user1Name
    : 'Ανώνυμος Χρήστης';

  // Common UI content inside the panel
  const panelContent = (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden shadow-sm transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Panel Top Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: 'var(--bg-subtle)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex items-center gap-2">
          {activeConvId && (
            <button
              type="button"
              onClick={() => setActiveConvId(null)}
              className="p-1 rounded transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
              title="Πίσω στις συνομιλίες"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold select-none"
            style={{
              backgroundColor: 'var(--badge-bg)',
              color: 'var(--accent-color)',
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold tracking-wide">
              {activeConvId ? otherPartyName : 'Προσωπικά Μηνύματα'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={fetchConversations}
            title="Ανανέωση"
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Κλείσιμο"
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Panel View: Conversations List OR Active Chat */}
      {!activeConvId ? (
        // Conversations List
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="px-3.5 py-2.5 border-b text-[10px] font-semibold uppercase tracking-wider flex justify-between items-center"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Συνομιλίες ({conversations.length})</span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {isLoadingList && conversations.length === 0 ? (
              <div className="p-4 text-center text-xs animate-pulse" style={{ color: 'var(--text-muted)' }}>
                Φόρτωση...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs space-y-2" style={{ color: 'var(--text-muted)' }}>
                <div
                  className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2"
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--accent-color)',
                  }}
                >
                  <Lock className="w-4 h-4" />
                </div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Καμία συνομιλία ακόμα</p>
                <p className="text-[11px] leading-relaxed max-w-[200px] mx-auto">
                  Πάτησε <strong>DM</strong> σε μια ανάρτηση για να ξεκινήσεις άμεσα συνομιλία.
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const otherName =
                  conv.user1Token === currentUser.token ? conv.user2Name : conv.user1Name;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setActiveConvId(conv.id)}
                    className="w-full text-left p-3.5 transition-colors flex flex-col gap-1 cursor-pointer hover:bg-[var(--bg-subtle)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {otherName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {timeAgoGreek(conv.updatedAt)}
                      </span>
                    </div>

                    {conv.confession && (
                      <p className="text-[11px] truncate font-medium" style={{ color: 'var(--accent-color)' }}>
                        "{conv.confession.content}"
                      </p>
                    )}

                    <p className="text-[11px] truncate" style={{ color: 'var(--text-secondary)' }}>
                      {conv.lastMessage ? conv.lastMessage.text : 'Νέα συνομιλία...'}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : (
        // Active Chat
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Confession reference */}
          {currentConv?.confession && (
            <div
              className="px-3.5 py-2 border-b text-[11px] truncate"
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)',
              }}
            >
              Σκέψη: <span className="font-medium" style={{ color: 'var(--text-primary)' }}>"{currentConv.confession.content}"</span>
            </div>
          )}

          {/* Messages scroll area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 no-scrollbar">
            {isLoadingMessages && messages.length === 0 ? (
              <div className="text-center text-xs py-8 animate-pulse" style={{ color: 'var(--text-muted)' }}>
                Φόρτωση μηνυμάτων...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-xs py-8" style={{ color: 'var(--text-muted)' }}>
                Ξεκίνα τη συζήτηση με ένα μήνυμα!
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderToken === currentUser.token;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
                        isMe
                          ? 'font-medium rounded-br-xs shadow-xs'
                          : 'rounded-bl-xs'
                      }`}
                      style={{
                        backgroundColor: isMe ? 'var(--accent-color)' : 'var(--bg-subtle)',
                        color: isMe ? 'var(--accent-text)' : 'var(--text-primary)',
                        border: isMe ? 'none' : '1px solid var(--border-color)',
                      }}
                    >
                      {msg.text}
                    </div>
                    <span
                      className="text-[9px] mt-0.5 px-1 font-mono"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {timeAgoGreek(msg.createdAt)}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mx-3 mb-2 flex items-start gap-1.5 p-2 rounded-lg bg-rose-950/40 border border-rose-800/30 text-rose-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Chat Input - Always Active (Free DMs) */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 border-t flex items-center gap-2 transition-colors"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border-color)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Γράψε μήνυμα..."
              maxLength={500}
              className="flex-1 rounded-full px-4 py-2 text-xs outline-none transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
              }}
            />

            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="p-2.5 rounded-full transition-all cursor-pointer shrink-0 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'var(--accent-text)',
              }}
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* DESKTOP VIEW: Collapsible Column in 3-column layout */}
      <aside
        className={`hidden xl:block shrink-0 sticky top-20 h-[calc(100vh-6rem)] transition-all duration-300 ${
          isOpen ? 'w-84 xl:w-96 opacity-100' : 'w-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-84 xl:w-96 h-full">{panelContent}</div>
      </aside>

      {/* MOBILE & TABLET VIEW: Floating Modal / Bottom Drawer */}
      {isOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg h-[82vh] max-h-[660px]">
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
};
