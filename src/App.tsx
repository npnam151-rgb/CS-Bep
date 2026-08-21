import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReportForm } from './components/ReportForm';
import { ReportPreview } from './components/ReportPreview';
import { ReportData, CHECKLIST_ITEMS } from './types';

// TODO: Thay thế đường dẫn này bằng URL Web App của Google Apps Script của bạn
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxWKIm74psex5-61MTbeSZKTyA5_K8GBE2MzZ3iOcn7bu1ekM7NqvGXDOJLmz88iDGQ/exec";

export default function App() {
  const [reportData, setReportData] = useState<ReportData>({
    location: '',
    date: new Date().toISOString().split('T')[0],
    reporter: '',
    items: CHECKLIST_ITEMS.map((item) => ({
      id: item.id,
      value: '',
    })),
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [sheetStatus, setSheetStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const previewRef = useRef<HTMLDivElement>(null);

  const saveToGoogleSheets = async (data: ReportData) => {
    if (!GOOGLE_SHEET_WEBHOOK_URL) {
      console.log("Chưa cấu hình Google Sheets Webhook URL. Bỏ qua bước lưu dữ liệu.");
      return false;
    }

    const locationMap: Record<string, string> = {
      "94 Lò Đúc": "94LĐ",
      "96 Hồng Tiến": "96HT",
      "98 Vũ Trọng Phụng": "98VTP",
      "01 Đặng Dung": "01 ĐD",
      "3D Nguyễn Văn Huyên": "3D NVH"
    };
    const mappedLocation = locationMap[data.location] || data.location;

    const payload = {
      sheetName: "BC Bếp",
      location: String(mappedLocation || ""),
      date: data.date,
      reporter: data.reporter,
      items: data.items.map(item => {
        const def = CHECKLIST_ITEMS.find((d) => d.id === item.id);
        return {
          id: item.id,
          title: String(def?.title || `Hạng mục ${item.id}`),
          category: String(def?.category || ''),
          value: String(item.value || '')
        };
      })
    };

    try {
      setSheetStatus('saving');
      
      // Tạo một Promise có timeout để không bị kẹt mãi mãi
      const fetchPromise = fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 8000)
      );

      // Đợi fetch hoặc timeout (cái nào đến trước)
      await Promise.race([fetchPromise, timeoutPromise]);
      
      console.log("Đã gửi dữ liệu lên Google Sheets");
      setSheetStatus('success');
      return true;
    } catch (error) {
      console.error("Lỗi khi lưu vào Google Sheets:", error);
      setSheetStatus('error');
      return false;
    }
  };

  const handleExportImage = async () => {
    if (!previewRef.current) return;
    
    setIsExporting(true);
    setExportSuccess(false);
    setSheetStatus('idle');

    try {
      // 1. Lưu dữ liệu lên Google Sheets
      await saveToGoogleSheets(reportData);

      // Đợi một chút để UI cập nhật trạng thái
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 2. Xuất ảnh
      const dataUrl = await toPng(previewRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const fileNameSuffix = 'Bep';
      const link = document.createElement('a');
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const fileName = `BaoCao_${fileNameSuffix}_${reportData.location || 'CoSo'}_${dateStr}.png`;
      link.download = fileName.replace(/\s+/g, '_');
      link.href = dataUrl;
      link.click();
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to export image', err);
      // Nếu lỗi do timeout của sheet, vẫn cố gắng xuất ảnh
      try {
        const dataUrl = await toPng(previewRef.current, {
          quality: 1.0,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        const fileNameSuffix = 'Bep';
        const link = document.createElement('a');
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const fileName = `BaoCao_${fileNameSuffix}_${reportData.location || 'CoSo'}_${dateStr}.png`;
        link.download = fileName.replace(/\s+/g, '_');
        link.href = dataUrl;
        link.click();
        setExportSuccess(true);
      } catch (innerErr) {
        alert('Có lỗi xảy ra khi xuất ảnh. Vui lòng thử lại.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Camera className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                CS Báo Cáo Bếp
              </h1>
            </div>
            
            <button
              onClick={handleExportImage}
              disabled={isExporting}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {sheetStatus === 'saving' ? 'Đang lưu dữ liệu...' : 'Đang xuất ảnh...'}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Tải ảnh báo cáo
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 sm:pb-8">
        {exportSuccess && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${sheetStatus === 'error' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
            {sheetStatus === 'error' ? <AlertCircle className="w-5 h-5 text-amber-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <p className="font-medium">
              {sheetStatus === 'error' 
                ? 'Đã tải ảnh thành công, nhưng LỖI lưu dữ liệu lên Google Sheets. Vui lòng kiểm tra mạng!' 
                : 'Đã tải ảnh và lưu dữ liệu lên Google Sheets thành công!'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Form */}
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-semibold text-base mb-1">Hướng dẫn sử dụng</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Nhập thông tin vào biểu mẫu bên dưới. Bản xem trước sẽ tự động cập nhật bên phải.</li>
                  <li><strong>Lưu ý:</strong> Với các câu hỏi Có/Không kèm diễn giải (VD: Có đủ nhân viên không?), hãy dùng dấu chấm (<code>.</code>) hoặc gạch ngang (<code>-</code>) để ngăn cách. <br/><span className="text-indigo-600 font-medium">Ví dụ: "Có. Đủ 3 người"</span></li>
                  <li>Nhấn "Tải ảnh báo cáo" để tải ảnh gửi Zalo và lưu dữ liệu lên Google Sheets.</li>
                </ul>
              </div>
            </div>
            
            <ReportForm 
              data={reportData} 
              onChange={setReportData} 
            />
          </div>

          {/* Right Column: Preview */}
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Bản xem trước</h2>
              <span className="text-xs font-medium px-2 py-1 bg-slate-200 text-slate-600 rounded-md">
                Tự động cập nhật
              </span>
            </div>
            
            <div className="bg-slate-200 p-2 sm:p-4 rounded-xl sm:rounded-2xl overflow-x-auto shadow-inner border border-slate-300">
              <div className="w-[800px] min-w-[800px] mx-auto">
                <ReportPreview 
                  data={reportData} 
                  ref={previewRef} 
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-8px_15px_-3px_rgba(0,0,0,0.05)] z-50">
        <button
          onClick={handleExportImage}
          disabled={isExporting}
          className="w-full flex justify-center items-center gap-2 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {sheetStatus === 'saving' ? 'Đang lưu dữ liệu...' : 'Đang xuất ảnh...'}
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Tải ảnh báo cáo
            </>
          )}
        </button>
      </div>
    </div>
  );
}
