function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Lấy tên sheet từ app gửi lên (ví dụ gửi "BC Bar 1"). 
    // Nếu app cũ không truyền sheetName thì mặc định gán là "BC CX"
    var sheetName = data.sheetName || "BC CX"; 
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": "Không tìm thấy sheet có tên '" + sheetName + "'"}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var row = [];

    // XỬ LÝ THEO TỪNG LOẠI BẢNG
    if (sheetName === "BC CX") {
      // 1. TẠO TIÊU ĐỀ NẾU BẢNG TRỐNG
      if (sheet.getLastRow() === 0) {
        var headers = ["Thời gian gửi", "Cơ sở", "Ngày", "Người báo cáo", "Tổng điểm"];
        if (data.items && data.items.length > 0) {
          data.items.forEach(function(item) {
            headers.push(item.title + " (Đánh giá)");
            headers.push(item.title + " (Ghi chú)");
          });
        }
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
        sheet.setFrozenRows(1);
      }
      
      // 2. GHI DỮ LIỆU CỦA báo cáo CX
      row.push(new Date(), data.location, data.date, data.reporter, data.totalScore);
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value); 
          row.push(item.notes); // BC CX có format ghi chú
        });
      }
    } 
    else if (sheetName === "BC Bar" || sheetName === "BC Bar 1") {
      // 1. TẠO TIÊU ĐỀ NẾU BẢNG TRỐNG
      if (sheet.getLastRow() === 0) {
        var headersBar = ["Thời gian gửi", "Cơ sở", "Ngày", "Người báo cáo"];
        if (data.items && data.items.length > 0) {
          data.items.forEach(function(item) {
            headersBar.push(item.title);
          });
        }
        sheet.appendRow(headersBar);
        sheet.getRange(1, 1, 1, headersBar.length).setFontWeight("bold").setBackground("#f3f4f6");
        sheet.setFrozenRows(1);
      }
      
      // 2. GHI DỮ LIỆU CỦA báo cáo BAR
      row.push(new Date(), data.location, data.date, data.reporter);
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value); // BC Bar thì không có ghi chú đi kèm nên chỉ lấy value 
        });
      }
    }
    else if (sheetName === "BC Tổng Bar") {
      // 1. TẠO TIÊU ĐỀ NẾU BẢNG TRỐNG
      if (sheet.getLastRow() === 0) {
        // Báo cáo Lâm không truyền date và reporter, chỉ có Thời gian gửi và Cơ sở ở các cột đầu
        var headersLam = ["Thời gian gửi", "Cơ sở"];
        if (data.items && data.items.length > 0) {
          data.items.forEach(function(item) {
            headersLam.push(item.title);
          });
        }
        sheet.appendRow(headersLam);
        sheet.getRange(1, 1, 1, headersLam.length).setFontWeight("bold").setBackground("#f3f4f6");
        sheet.setFrozenRows(1);
      }
      
      // 2. GHI DỮ LIỆU CỦA báo cáo Lâm
      row.push(new Date(), data.location);
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value);
        });
      }
    }
    else if (sheetName === "BC TQL") {
      // 1. TẠO TIÊU ĐỀ NẾU BẢNG TRỐNG
      if (sheet.getLastRow() === 0) {
        var headersTQL = ["Thời gian gửi", "Ngày", "Người báo cáo", "Cơ sở"];
        if (data.items && data.items.length > 0) {
          data.items.forEach(function(item) {
            headersTQL.push(item.title);
          });
        }
        sheet.appendRow(headersTQL);
        sheet.getRange(1, 1, 1, headersTQL.length).setFontWeight("bold").setBackground("#f3f4f6");
        sheet.setFrozenRows(1);
      }
      
      // 2. GHI DỮ LIỆU CỦA báo cáo TQL
      row.push(new Date(), data.date, data.reporter, data.location);
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value);
        });
      }
    }
    else if (sheetName === "BC Bếp") {
      // 1. TẠO TIÊU ĐỀ NẾU BẢNG TRỐNG
      if (sheet.getLastRow() === 0) {
        var headersBep = [
          "Thời gian gửi", "Cơ sở", "Ngày", "Người báo cáo",
          "Có đủ nv làm việc (Có/Không)", "Có đủ nv làm việc (Diễn giải)",
          "Có nv xin nghỉ hẳn (Có/Không)", "Có nv xin nghỉ hẳn (Diễn giải)",
          "NV mới đi làm",
          "Hàng đặt có về đủ không (Có/Không)", "Hàng đặt có về đủ không (Diễn giải)",
          "Sự cố xảy ra trong ngày không?",
          "Món bán chạy trong ngày",
          "CCDC, thiết bị hỏng trong ngày",
          "CCDC, thiết bị được sửa trong ngày",
          "Đề xuất"
        ];
        sheet.appendRow(headersBep);
        sheet.getRange(1, 1, 1, headersBep.length).setFontWeight("bold").setBackground("#f3f4f6");
        sheet.setFrozenRows(1);
      }
      
      // 2. GHI DỮ LIỆU CỦA BÁO CÁO BẾP
      row.push(new Date(), data.location, data.date || "", data.reporter || "");
      
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          // Các ID có 2 cột (Có/Không và Diễn giải):
          // 201: Có đủ nv làm việc trong ngày?
          // 202: Có nv xin nghỉ hẳn không?
          // 204: Hàng đặt có về đủ không?
          if (item.id === 201 || item.id === 202 || item.id === 204) {
            var val = (item.value || "").trim();
            // Tách phần trả lời (Có/Không) và phần diễn giải dựa vào các dấu phân cách
            var separatorIndex = val.search(/[\.\,\-\n]/);
            
            if (separatorIndex !== -1 && separatorIndex < 15) { 
               // Tách được "Có/Không" và "Diễn giải"
               var answer = val.substring(0, separatorIndex).trim();
               var explanation = val.substring(separatorIndex + 1).trim();
               row.push(answer);
               row.push(explanation);
            } else {
               // Nếu không có dấu phân cách, ghi toàn bộ vào cột đầu
               row.push(val);
               row.push("");
            }
          } else {
            // Các hạng mục khác chỉ có 1 cột
            row.push(item.value);
          }
        });
      }
    }

    // Ghi dữ liệu dòng mới vào bảng tính
    sheet.appendRow(row);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
