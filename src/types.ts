export type ItemType = 'text';

export interface ChecklistItemDef {
  id: number;
  title: string;
  category: string;
  placeholder: string;
  example: string;
}

export interface ReportItem {
  id: number;
  value: string;
}

export interface ReportData {
  location: string;
  date: string;
  reporter: string;
  items: ReportItem[];
}

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  { id: 201, category: 'Nhân sự', title: 'Có đủ nv làm việc trong ngày?', placeholder: 'Có/Không. Diễn giải (nếu có)', example: 'Có. Đủ người' },
  { id: 202, category: 'Nhân sự', title: 'Có nv xin nghỉ hẳn không?', placeholder: 'Có/Không. Diễn giải (nếu có)', example: 'Không' },
  { id: 203, category: 'Nhân sự', title: 'NV mới đi làm', placeholder: 'Ghi chú NV mới (nếu có)', example: '1 phụ bếp mới tên Nam' },
  { id: 204, category: 'Vận hành bếp', title: 'Hàng về có đủ và đảm bảo chất lượng không?', placeholder: 'Có/Không. Diễn giải (nếu có)', example: 'Có. Đủ hàng' },
  { id: 205, category: 'Vận hành bếp', title: 'Sự cố xảy ra trong ngày không?', placeholder: 'Ghi chú sự cố (nếu có)', example: 'Mất nước 15p lúc 10h sáng' },
  { id: 206, category: 'Vận hành bếp', title: 'Món bán chạy trong ngày', placeholder: 'Liệt kê các món bán chạy', example: 'Lẩu thái, Bê thui' },
  { id: 207, category: 'Trang thiết bị', title: 'CCDC, thiết bị hỏng trong ngày', placeholder: 'Ghi chú thiết bị hỏng', example: 'Hỏng 1 chảo chống dính' },
  { id: 208, category: 'Trang thiết bị', title: 'CCDC, thiết bị được sửa trong ngày', placeholder: 'Ghi chú thiết bị đã sửa', example: 'Đã sửa xong tủ đông' },
  { id: 209, category: 'Trang thiết bị', title: 'Đề xuất', placeholder: 'Ghi lại các đề xuất (nếu có)', example: 'Đề xuất mua thêm rổ nhựa inox' },
];