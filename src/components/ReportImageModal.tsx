import React, { useState } from 'react';
import { X, Copy, Download, Check, AlertCircle, Info } from 'lucide-react';

interface ReportImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  fileName: string;
}

export function ReportImageModal({
  isOpen,
  onClose,
  imageUrl,
  fileName,
}: ReportImageModalProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');

  if (!isOpen || !imageUrl) return null;

  const handleCopyImage = async () => {
    setCopyStatus('copying');
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();

      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2500);
        return;
      }
      throw new Error('ClipboardItem not supported');
    } catch (err) {
      console.warn('Lỗi khi copy ảnh vào clipboard:', err);
      setCopyStatus('failed');
      setTimeout(() => setCopyStatus('idle'), 4000);
    }
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = imageUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 flex items-start justify-between border-b border-slate-100 relative">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ảnh Báo Cáo Hoàn Chỉnh
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Bấm copy hoặc chạm giữ vào ảnh để lưu/gửi
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Mẹo gửi nhanh tip box */}
          <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 text-amber-900 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-start gap-2.5">
              <div className="bg-amber-200/80 p-1 rounded-full shrink-0 text-amber-800 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-amber-950 text-sm">Mẹo gửi nhanh:</p>
                <p className="text-amber-900">
                  Bấm nút <strong className="text-indigo-600 font-semibold">"Copy ảnh"</strong> để dán trực tiếp vào Zalo/Tin nhắn, hoặc chạm và giữ ngón tay vào ảnh bên dưới trong 1-2 giây rồi chọn <strong className="text-slate-900 font-semibold">"Sao chép" (Copy)</strong> / <strong className="text-slate-900 font-semibold">"Lưu vào Ảnh"</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Copy failed notification */}
          {copyStatus === 'failed' && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                Trình duyệt không hỗ trợ tự động copy ảnh. Vui lòng <strong>chạm giữ vào ảnh</strong> bên dưới trong 1-2 giây để chọn <em>Sao chép</em> hoặc ấn nút <strong>Tải ảnh</strong>.
              </span>
            </div>
          )}

          {/* Image Preview Container */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 shadow-inner flex justify-center items-center max-h-[46vh] overflow-y-auto">
            <img
              src={imageUrl}
              alt="Báo cáo hoàn chỉnh"
              className="w-full h-auto object-contain select-all cursor-pointer"
              title="Chạm giữ vào ảnh để sao chép hoặc lưu ảnh"
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 bg-slate-50/70 space-y-2.5">
          <div className="flex gap-3">
            {/* Copy Button */}
            <button
              onClick={handleCopyImage}
              disabled={copyStatus === 'copying'}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl shadow-sm transition-all text-sm sm:text-base disabled:opacity-75"
            >
              {copyStatus === 'copying' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang copy...
                </>
              ) : copyStatus === 'copied' ? (
                <>
                  <Check className="w-5 h-5 text-emerald-300" />
                  Đã copy ảnh!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy ảnh
                </>
              )}
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadImage}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 text-slate-800 font-semibold rounded-xl shadow-xs transition-colors text-sm sm:text-base"
            >
              <Download className="w-5 h-5 text-slate-700" />
              Tải ảnh
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 text-slate-600 hover:text-slate-900 font-medium text-sm sm:text-base transition-colors text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
