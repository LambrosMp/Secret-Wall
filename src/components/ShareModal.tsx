'use client';

import React, { useRef, useState } from 'react';
import { ConfessionItem } from '@/types/confession';
import { toPng, toBlob } from 'html-to-image';
import {
  X,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  Smartphone,
  Square,
  Flame,
  BarChart2,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  confession: ConfessionItem;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  confession,
}) => {
  const [format, setFormat] = useState<'story' | 'square'>('story');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setStatusMessage('Δημιουργία εικόνας PNG...');
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `secret-wall-${format}-${confession.id.slice(-6)}.png`;
      link.href = dataUrl;
      link.click();

      setStatusMessage('Η εικόνα αποθηκεύτηκε επιτυχώς!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Error exporting image:', err);
      setStatusMessage('Αποτυχία εξαγωγής εικόνας.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setStatusMessage('Αντιγραφή στο πρόχειρο...');

      const blob = await toBlob(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) {
        throw new Error('Blob generation failed');
      }

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setStatusMessage('Η εικόνα αντιγράφηκε στο πρόχειρο!');
        setTimeout(() => {
          setCopied(false);
          setStatusMessage(null);
        }, 3000);
      } else {
        // Fallback: copy text
        await navigator.clipboard.writeText(
          `«${confession.content}» — Secret Wall (${confession.category})`
        );
        setCopied(true);
        setStatusMessage('Το κείμενο αντιγράφηκε!');
        setTimeout(() => {
          setCopied(false);
          setStatusMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error copying image:', err);
      setStatusMessage('Η αντιγραφή εικόνας δεν υποστηρίζεται σε αυτό το πρόγραμμα περιήγησης.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      setStatusMessage('Προετοιμασία διαμοιρασμού...');

      if (navigator.share) {
        const blob = await toBlob(cardRef.current, {
          pixelRatio: 2,
          cacheBust: true,
        });

        if (blob && navigator.canShare) {
          const file = new File(
            [blob],
            `secret-wall-${confession.id.slice(-6)}.png`,
            { type: 'image/png' }
          );

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Secret Wall',
              text: `«${confession.content}»`,
              files: [file],
            });
            setStatusMessage(null);
            return;
          }
        }

        // Fallback to text url share
        await navigator.share({
          title: 'Secret Wall',
          text: `«${confession.content}»`,
          url: window.location.href,
        });
        setStatusMessage(null);
      } else {
        await handleCopyImage();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        setStatusMessage('Αποτυχία κοινοποίησης.');
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage(null);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden transition-all"
        style={{
          backgroundColor: '#09090b',
          border: '1px solid #27272a',
          color: '#fafafa',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#e5a93c]/10 border border-[#e5a93c]/30 flex items-center justify-center text-[#e5a93c]">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Κοινοποίηση σε Story / Εικόνα
              </h2>
              <p className="text-[11px] text-zinc-400">
                Εξαγωγή σε Matte Obsidian format υψηλής ανάλυσης
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
            aria-label="Κλείσιμο"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="flex items-center justify-center gap-2 px-5 pt-3 pb-1 shrink-0">
          <button
            type="button"
            onClick={() => setFormat('story')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              format === 'story'
                ? 'bg-[#e5a93c] text-black shadow-xs font-semibold'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Story (9:16)</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat('square')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              format === 'square'
                ? 'bg-[#e5a93c] text-black shadow-xs font-semibold'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Τετράγωνο (1:1)</span>
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center no-scrollbar min-h-0">
          {/* Exportable Story Card Element */}
          <div
            ref={cardRef}
            className={`relative flex flex-col justify-between p-6 sm:p-7 select-none overflow-hidden transition-all shadow-2xl ${
              format === 'story'
                ? 'w-[300px] h-[533px] sm:w-[320px] sm:h-[568px] rounded-3xl'
                : 'w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] rounded-3xl'
            }`}
            style={{
              backgroundColor: '#09090b',
              backgroundImage:
                'radial-gradient(circle at 50% 0%, rgba(229, 169, 60, 0.12) 0%, rgba(9, 9, 11, 0.98) 70%)',
              border: '1px solid rgba(229, 169, 60, 0.25)',
              color: '#fafafa',
            }}
          >
            {/* Top Bar: Secret Wall Logo & Category */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#e5a93c] text-black flex items-center justify-center font-black text-[11px] shadow-sm">
                  S
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black tracking-widest uppercase font-mono text-[#e5a93c]">
                    SECRET WALL
                  </span>
                  <span className="text-[9px] text-zinc-400 -mt-0.5">
                    Campus Confessions
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-mono bg-[#e5a93c]/15 text-[#e5a93c] border border-[#e5a93c]/30">
                #{confession.category}
              </span>
            </div>

            {/* Main Content Area */}
            <div className="my-auto py-4 space-y-4">
              {/* Confession text */}
              <div className="relative">
                <span className="text-3xl sm:text-4xl text-[#e5a93c]/30 font-serif leading-none select-none block -mb-2">
                  “
                </span>
                <p
                  className={`font-medium leading-relaxed text-zinc-100 break-words whitespace-pre-wrap ${
                    format === 'story' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                  }`}
                >
                  {confession.content}
                </p>
                <span className="text-3xl sm:text-4xl text-[#e5a93c]/30 font-serif leading-none select-none block text-right -mt-2">
                  ”
                </span>
              </div>

              {/* If Poll: Render sleek preview of poll options */}
              {confession.isPoll && confession.pollOptionA && confession.pollOptionB && (
                <div className="space-y-2 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/90">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/40 text-xs">
                      <span className="font-medium text-zinc-200 truncate">
                        {confession.pollOptionA}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {confession.pollVotesA ?? 0} ψήφοι
                      </span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-800/60 border border-zinc-700/40 text-xs">
                      <span className="font-medium text-zinc-200 truncate">
                        {confession.pollOptionB}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {confession.pollVotesB ?? 0} ψήφοι
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer: Author Info & App Watermark */}
            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base select-none" role="img" aria-label="avatar">
                  {confession.authorAvatar || '🦊'}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-200 leading-tight truncate max-w-[130px]">
                    {confession.authorName || 'Anonymous'}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    Ανώνυμη Σκέψη
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-[#e5a93c]">
                  <Flame className="w-3 h-3" />
                  <span>{confession.likes} likes</span>
                </div>
                <span className="text-[8px] font-mono text-zinc-500 tracking-wider">
                  secretwall.gr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status notification toast */}
        {statusMessage && (
          <div className="px-5 py-1.5 text-center text-xs font-medium text-[#e5a93c] bg-[#e5a93c]/10 border-t border-b border-[#e5a93c]/20 animate-in fade-in duration-150">
            {statusMessage}
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="p-4 sm:p-5 border-t border-[#27272a] bg-zinc-950/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleCopyImage}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Αντιγράφηκε</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Αντιγραφή</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Λήψη PNG</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleNativeShare}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-black transition-all cursor-pointer shadow-md disabled:opacity-50"
            style={{ backgroundColor: '#e5a93c' }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Κοινοποίηση (Story)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
