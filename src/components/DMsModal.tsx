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

interface DMsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserIdentity;
  targetConfession?: ConfessionItem | null;
  onClearTargetConfession?: () => void;
}

export const DMsModal: React.FC<DMsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetConfession,
  onClearTargetConfession,
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
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingList(false);
    }
  }, [currentUser.token]);

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

        const data = await res.json();
        if (res.ok && data.conversation) {
          setActiveConvId(data.conversation.id);
          await fetchConversations();
          await fetchMessages(data.conversation.id);
        } else {
          setErrorMessage(data.error || 'Δεν ήταν δυνατή η έναρξη της συνομιλίας.');
        }
      } catch (err) {
        console.error('Error starting conversation:', err);
      } finally {
        setIsLoadingMessages(false);
        if (onClearTargetConfession) {
          onClearTargetConfession();
        }
      }
    };

    startOrOpenTarget();
  }, [isOpen, targetConfession, currentUser, fetchConversations, fetchMessages, onClearTargetConfession]);

  useEffect(() => {
    if (activeConvId) {
      setIsLoadingMessages(true);
      fetchMessages(activeConvId).finally(() => {
        setIsLoadingMessages(false);
        setTimeout(scrollToBottom, 150);
      });
    }
  }, [activeConvId, fetchMessages]);

  useEffect(() => {
    if (!isOpen || !activeConvId) return;

    const interval = setInterval(() => {
      fetchMessages(activeConvId);
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, activeConvId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !inputText.trim() || isSending) return;

    setErrorMessage(null);
    const textToSend = inputText.trim();

    try {
      setIsSending(true);
      const res = await fetch(`/api/conversations/${activeConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderToken: currentUser.token,
          text: textToSend,
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
    } catch (err) {
      console.error('Error sending message:', err);
      setErrorMessage('Αποτυχία αποστολής μηνύματος.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const currentConv = conversations.find((c) => c.id === activeConvId);
  const otherPartyName = currentConv
    ? currentConv.user1Token === currentUser.token
      ? currentConv.user2Name
      : currentConv.user1Name
    : 'Ανώνυμος Χρήστης';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl h-[82vh] max-h-[700px] bg-[#171026] border border-[#c5a059]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#c5a059]/15 bg-[#0c0814]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#1b122c] border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-white">
                Ανώνυμα DMs
              </h2>
              <p className="text-[10px] text-[#a59db8]">
                Συνομιλείς ως: <span className="text-[#c5a059] font-medium">{currentUser.avatar} {currentUser.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={fetchConversations}
              title="Ανανέωση"
              className="p-1.5 rounded-lg text-[#a59db8] hover:text-[#c5a059] hover:bg-[#1b122c] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#a59db8] hover:text-white hover:bg-[#1b122c] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          <div
            className={`w-full md:w-72 border-r border-[#c5a059]/15 bg-[#110b1d] flex flex-col ${
              activeConvId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-3 border-b border-[#c5a059]/10 text-[11px] font-semibold text-[#a59db8] uppercase tracking-wider flex justify-between items-center">
              <span>Μηνύματα ({conversations.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-[#c5a059]/10">
              {isLoadingList && conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#a59db8] animate-pulse">
                  Φόρτωση...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-5 text-center text-[#a59db8] text-xs space-y-1.5">
                  <p>Καμία ενεργή συνομιλία.</p>
                  <p className="text-[11px] text-[#a59db8]/70">
                    Πάτησε <strong>DM</strong> σε μια ανάρτηση για να ξεκινήσεις συνομιλία.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherName =
                    conv.user1Token === currentUser.token ? conv.user2Name : conv.user1Name;
                  const isSelected = conv.id === activeConvId;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setActiveConvId(conv.id)}
                      className={`w-full text-left p-3 transition-colors flex flex-col gap-0.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1b122c] border-l-2 border-[#c5a059]'
                          : 'hover:bg-[#171026]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white truncate">
                          {otherName}
                        </span>
                        <span className="text-[10px] text-[#a59db8]">
                          {timeAgoGreek(conv.updatedAt)}
                        </span>
                      </div>

                      {conv.confession && (
                        <p className="text-[11px] text-[#c5a059]/80 truncate">
                          "{conv.confession.content}"
                        </p>
                      )}

                      <p className="text-[11px] text-[#a59db8] truncate">
                        {conv.lastMessage ? conv.lastMessage.text : 'Νέα συνομιλία...'}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Window */}
          <div
            className={`flex-1 flex flex-col bg-[#171026] ${
              !activeConvId ? 'hidden md:flex items-center justify-center' : 'flex'
            }`}
          >
            {!activeConvId ? (
              <div className="text-center p-6 max-w-xs text-[#a59db8] space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-[#110b1d] border border-[#c5a059]/20 flex items-center justify-center text-[#c5a059]">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white">Ιδιωτική Επικοινωνία</h3>
                <p className="text-[11px] text-[#a59db8] leading-relaxed">
                  Επίλεξε μια συνομιλία από τη λίστα για να διαβάσεις ή να στείλεις μηνύματα.
                </p>
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-[#c5a059]/15 bg-[#110b1d]">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveConvId(null)}
                      className="md:hidden p-1 rounded text-[#a59db8] hover:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-white truncate">
                        {otherPartyName}
                      </h3>
                      {currentConv?.confession && (
                        <p className="text-[10px] text-[#a59db8] truncate max-w-xs sm:max-w-md">
                          Απάντηση: "{currentConv.confession.content}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Bubbles Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2.5 no-scrollbar">
                  {isLoadingMessages && messages.length === 0 ? (
                    <div className="text-center text-xs text-[#a59db8] py-8 animate-pulse">
                      Φόρτωση...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-xs text-[#a59db8] py-8">
                      Ξεκίνα τη συνομιλία στέλνοντας ένα μήνυμα!
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
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap ${
                              isMe
                                ? 'bg-[#c5a059] text-[#0c0814] font-medium rounded-br-xs shadow-sm'
                                : 'bg-[#110b1d] border border-[#c5a059]/20 text-[#fdfdfd] rounded-bl-xs'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-[#a59db8]/70 mt-0.5 px-1">
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

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-2.5 border-t border-[#c5a059]/15 bg-[#110b1d] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Γράψε μήνυμα..."
                    maxLength={500}
                    className="flex-1 bg-[#0c0814] border border-[#c5a059]/15 rounded-full px-4 py-2 text-xs text-[#fdfdfd] placeholder-[#a59db8]/60 focus:outline-none focus:border-[#c5a059]/40 transition-colors"
                  />

                  <button
                    type="submit"
                    disabled={isSending || !inputText.trim()}
                    className="px-4 py-2 rounded-full bg-[#c5a059] hover:bg-[#d4b068] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-[#0c0814] text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>Αποστολή</span>
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
