import React from 'react';
import { CHECKLIST_ITEMS, ReportData, ReportItem } from '../types';
import { cn } from '../lib/utils';
import { Check, X } from 'lucide-react';

interface ReportFormProps {
  data: ReportData;
  onChange: (data: ReportData) => void;
}

export function ReportForm({ data, onChange }: ReportFormProps) {
  const handleItemChange = (id: number, value: string) => {
    const newItems = data.items.map((item) =>
      item.id === id ? { ...item, value } : item
    );
    onChange({ ...data, items: newItems });
  };

  // Group items by category
  const categories = Array.from(new Set(CHECKLIST_ITEMS.map(item => item.category)));

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Thông tin chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Cơ sở</label>
            <select
              value={data.location}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              className="w-full px-4 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            >
              <option value="">-- Chọn cơ sở --</option>
              <option value="94LĐ">94 Lò Đúc</option>
              <option value="96HT">96 Hồng Tiến</option>
              <option value="98VTP">98 Vũ Trọng Phụng</option>
              <option value="01 ĐD">01 Đặng Dung</option>
              <option value="3D NVH">3D Nguyễn Văn Huyên</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Ngày</label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => onChange({ ...data, date: e.target.value })}
              className="w-full px-4 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Người báo cáo</label>
            <input
              type="text"
              value={data.reporter}
              onChange={(e) => onChange({ ...data, reporter: e.target.value })}
              placeholder="Nhập tên người báo cáo"
              className="w-full px-4 py-3 md:py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
            />
          </div>
        </div>
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-bold text-indigo-900 uppercase tracking-wider border-l-4 border-indigo-600 pl-3 py-1">
            {category}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {CHECKLIST_ITEMS.filter(item => item.category === category).map((def) => {
              const item = data.items.find((i) => i.id === def.id);
              if (!item) return null;
              return (
                <div key={def.id} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-colors">
                  <div className="mb-3">
                    <h3 className="font-semibold text-slate-800 text-base">
                      {def.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 italic">
                      Ví dụ: {def.example}
                    </p>
                  </div>
                  
                  <textarea
                    value={item.value}
                    onChange={(e) => handleItemChange(def.id, e.target.value)}
                    placeholder={def.placeholder}
                    className="w-full px-4 py-3 md:py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y min-h-[80px]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
