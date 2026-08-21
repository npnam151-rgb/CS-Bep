import React, { forwardRef } from 'react';
import { CHECKLIST_ITEMS, ReportData } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ReportPreviewProps {
  data: ReportData;
}

export const ReportPreview = forwardRef<HTMLDivElement, ReportPreviewProps>(
  ({ data }, ref) => {
    // Group items by category for the preview
    const categories = Array.from(new Set(CHECKLIST_ITEMS.map(item => item.category)));

    return (
      <div
        ref={ref}
        className="bg-white text-slate-900 w-[800px] mx-auto p-8 shadow-sm border border-slate-100"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-slate-800 pb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900 mb-2">
            Báo Cáo Bếp
          </h1>
          <div className="text-lg font-medium text-slate-700">
            Cơ sở: <span className="font-bold text-slate-900">{data.location || '...'}</span>
          </div>
          <div className="text-sm font-medium text-slate-600 mt-1">
            Ngày: <span className="font-semibold text-slate-800">{data.date ? new Date(data.date).toLocaleDateString('vi-VN') : '...'}</span> | 
            Người báo cáo: <span className="font-semibold text-slate-800">{data.reporter || '...'}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-slate-300">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 text-sm uppercase tracking-wider">
                <th className="py-3 px-4 border-b border-slate-300 font-semibold w-12 text-center">STT</th>
                <th className="py-3 px-4 border-b border-slate-300 font-semibold w-1/3">Hạng mục báo cáo</th>
                <th className="py-3 px-4 border-b border-slate-300 font-semibold">Nội dung chi tiết</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {categories.map((category) => (
                <React.Fragment key={category}>
                  {/* Category Header Row */}
                  <tr className="bg-indigo-50">
                    <td colSpan={3} className="py-2 px-4 font-bold text-indigo-900 uppercase tracking-tight text-xs border-y border-slate-300">
                      {category}
                    </td>
                  </tr>
                  {CHECKLIST_ITEMS.filter(item => item.category === category).map((def) => {
                    const item = data.items.find((i) => i.id === def.id);
                    if (!item) return null;
                    
                    const overallIndex = CHECKLIST_ITEMS.findIndex(ci => ci.id === def.id);

                    return (
                      <tr key={def.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-200 last:border-b-0">
                        <td className="py-3 px-4 text-center font-medium text-slate-500 align-top">
                          {overallIndex + 1}
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="font-semibold text-slate-800">{def.title}</div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          {item.value ? (
                            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                              {item.value}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Không có dữ liệu phát sinh</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="mt-8 flex justify-between items-end text-sm text-slate-500">
          <div>
            <p>Báo cáo được tạo tự động từ ứng dụng.</p>
          </div>
          <div className="text-right">
            <p className="mt-8 font-medium text-slate-800">
              (Ký và ghi rõ họ tên)
            </p>
          </div>
        </div>
      </div>
    );
  }
);

ReportPreview.displayName = 'ReportPreview';
