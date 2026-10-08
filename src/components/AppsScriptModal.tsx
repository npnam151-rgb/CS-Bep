import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppsScriptModal({ isOpen, onClose }: AppsScriptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptCode = `// ============================================================================
// CẤU HÌNH FILE THỨ 2 (LƯU ĐỒNG THỜI VÀO 2 FILE GOOGLE SHEETS)
// Dán ID của file thứ 2 vào đây (chuỗi ký tự nằm giữa /d/ và /edit trên link của file 2)
// ============================================================================
var SECOND_SPREADSHEET_ID = "1S2epup9cDgckvmVCPUuWGcK55gLwY9jpfImT55pgLj0";

function doGet(e) {
  return ContentService.createTextOutput("Web App is running!").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Tên sheet gửi từ app (Mặc định là BC TQL nếu không truyền)
    var sheetName = data.sheetName || "BC TQL"; 
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);
    
    // Tìm kiếm sheet không phân biệt chữ hoa/thường và khoảng trắng thừa
    if (!sheet) {
      var sheets = spreadsheet.getSheets();
      var cleanTarget = sheetName.trim().toLowerCase().replace(/\\s+/g, " ");
      for (var s = 0; s < sheets.length; s++) {
        var sName = sheets[s].getName().trim().toLowerCase().replace(/\\s+/g, " ");
        if (sName === cleanTarget || (cleanTarget.indexOf("ql k") !== -1 && sName.indexOf("ql k") !== -1)) {
          sheet = sheets[s];
          break;
        }
      }
    }
    
    // Tự động tạo sheet nếu chưa có
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }
    
    var row = [];

    // =========================================================================
    // XỬ LÝ THEO TỪNG LOẠI BẢNG
    // =========================================================================

    // 0. BÁO CÁO QUẢN LÝ KÊNH (BC QL KÊNH - 12 CỘT CHUẨN FORM MẪU CHO 5 SALE & PHẦN CHUNG)
    if (sheetName === "BC QL kênh" || sheetName === "BC QL Kênh" || sheetName === "BC Quản lý kênh" || sheetName === "BC quản lý kênh") {
      // 1. Tạo tiêu đề chuẩn 12 cột cho File 1 nếu sheet mới
      if (sheet.getLastRow() === 0) {
        var headerRow1 = [
          "Thời gian gửi",
          "Ngày",
          "Kết quả chăm sóc điểm bán", "", "", "", "", "",
          "Tổng kết công việc trong ngày", "", "", ""
        ];
        var headerRow2 = [
          "",
          "",
          "Tên NV Sale",
          "Số điểm ghé trong ngày",
          "Khách hàng mới",
          "Đơn hàng",
          "Sản lượng",
          "Tình hình",
          "Khách tiềm năng",
          "Khách giảm/ khách có nguy cơ mất",
          "Vấn đề thị trường",
          "Đề xuất"
        ];
        sheet.appendRow(headerRow1);
        sheet.appendRow(headerRow2);
        sheet.getRange(1, 1, 2, 1).merge();
        sheet.getRange(1, 2, 2, 1).merge();
        sheet.getRange(1, 3, 1, 6).merge();
        sheet.getRange(1, 9, 1, 4).merge();
        sheet.getRange(1, 1, 2, 12)
          .setFontWeight("bold")
          .setBackground("#f3f4f6")
          .setHorizontalAlignment("center")
          .setVerticalAlignment("middle");
        sheet.setFrozenRows(2);
      }

      var nowTime = new Date();
      var reportDate = data.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
      var commonPotential = data.potentialCustomers || "";
      var commonDeclining = data.decliningRiskCustomers || "";
      var commonMarket = data.marketIssues || "";
      var commonProposal = data.proposal || "";

      // Danh sách sale gửi từ form quản lý
      var rawSalesList = (data.sales && Array.isArray(data.sales) && data.sales.length > 0)
        ? data.sales
        : (data.salesList && Array.isArray(data.salesList) && data.salesList.length > 0)
          ? data.salesList
          : [data];

      // LỌC DANH SÁCH: Tất cả các sale đều lưu khi có tên (bỏ qua bất kỳ sale nào để trống tên)
      var activeSalesList = [];
      for (var sIdx = 0; sIdx < rawSalesList.length; sIdx++) {
        var rawSale = rawSalesList[sIdx];
        var rawName = (rawSale.salesRepName || rawSale.name || rawSale.reporter || "").toString().trim();
        
        // Tất cả các sale đều lưu khi có tên
        if (rawName !== "") {
          activeSalesList.push(rawSale);
        }
      }

      // Nếu không có sale nào điền tên, lấy các sale có nhập số liệu hoặc dòng đầu
      if (activeSalesList.length === 0) {
        for (var sIdx2 = 0; sIdx2 < rawSalesList.length; sIdx2++) {
          var rSale = rawSalesList[sIdx2];
          if (rSale.visitedCount || rSale.ordersCount || rSale.volume || rSale.newCustomers || rSale.situation) {
            activeSalesList.push(rSale);
          }
        }
        if (activeSalesList.length === 0) {
          activeSalesList = [rawSalesList[0]];
        }
      }

      var rowsToSave = [];
      for (var i = 0; i < activeSalesList.length; i++) {
        var s = activeSalesList[i];
        var sName = (s.salesRepName && s.salesRepName.toString().trim() !== "") ? s.salesRepName.toString().trim()
          : (s.name && s.name.toString().trim() !== "") ? s.name.toString().trim()
          : (s.reporter && s.reporter.toString().trim() !== "") ? s.reporter.toString().trim()
          : ("Sale " + (i + 1));

        var sVisited = s.visitedCount !== undefined ? String(s.visitedCount).trim() : "";
        var sNewCust = s.newCustomers ? String(s.newCustomers).trim() : "";
        var sOrders = s.ordersCount ? String(s.ordersCount).trim() : "";
        var sVolume = s.volume ? String(s.volume).trim() : "";
        var sSituation = s.situation ? String(s.situation).trim() : "";

        // Dòng dữ liệu cho từng sale (Sale 1 ghi kèm phần chung, các sale 2..N để trống cột chung)
        rowsToSave.push([
          nowTime,
          reportDate,
          sName,
          sVisited,
          sNewCust,
          sOrders,
          sVolume,
          sSituation,
          i === 0 ? commonPotential : "",
          i === 0 ? commonDeclining : "",
          i === 0 ? commonMarket : "",
          i === 0 ? commonProposal : ""
        ]);
      }

      // --- GHI VÀO FILE THỨ 1 ---
      var lastRow1 = sheet.getLastRow();
      var actualLastRow1 = 0;
      if (lastRow1 > 0) {
        var colA1 = sheet.getRange(1, 1, Math.min(lastRow1, 1000), 1).getValues();
        for (var r1 = colA1.length - 1; r1 >= 0; r1--) {
          if (colA1[r1][0] !== "" && colA1[r1][0] !== null && colA1[r1][0] !== undefined) {
            actualLastRow1 = r1 + 1;
            break;
          }
        }
      }
      var targetRow1 = Math.max(actualLastRow1 + 1, (sheet.getLastRow() <= 2 ? 3 : actualLastRow1 + 1));
      
      // Ghi dữ liệu
      var recordRange1 = sheet.getRange(targetRow1, 1, rowsToSave.length, 12);
      recordRange1.setValues(rowsToSave);

      // VẼ ĐƯỜNG BAO CHO ĐỢT NHẬP
      recordRange1.setBorder(true, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID);
      recordRange1.setVerticalAlignment("middle");
      recordRange1.setWrap(true);
      sheet.getRange(targetRow1, 1, rowsToSave.length, 2).setHorizontalAlignment("center");
      sheet.getRange(targetRow1, 4, rowsToSave.length, 3).setHorizontalAlignment("center");

      // --- GHI VÀO FILE THỨ 2 ---
      if (typeof SECOND_SPREADSHEET_ID !== "undefined" && SECOND_SPREADSHEET_ID && SECOND_SPREADSHEET_ID.trim() !== "") {
        try {
          var ss2 = SpreadsheetApp.openById(SECOND_SPREADSHEET_ID.trim());
          var sheet2 = ss2.getSheetByName("BC QL kênh") || ss2.getSheetByName("BC QL Kênh") || ss2.getSheetByName("BC Quản lý kênh");
          if (!sheet2) {
            var sheets2 = ss2.getSheets();
            for (var k = 0; k < sheets2.length; k++) {
              var s2Name = sheets2[k].getName().trim().toLowerCase();
              if (s2Name.indexOf("ql k") !== -1 || s2Name.indexOf("quản lý k") !== -1) {
                sheet2 = sheets2[k];
                break;
              }
            }
          }
          if (!sheet2) {
            sheet2 = ss2.insertSheet("BC QL kênh");
          }

          if (sheet2.getLastRow() === 0) {
            var hRow1_2 = [
              "Thời gian gửi",
              "Ngày",
              "Kết quả chăm sóc điểm bán", "", "", "", "", "",
              "Tổng kết công việc trong ngày", "", "", ""
            ];
            var hRow2_2 = [
              "",
              "",
              "Tên NV Sale",
              "Số điểm ghé trong ngày",
              "Khách hàng mới",
              "Đơn hàng",
              "Sản lượng",
              "Tình hình",
              "Khách tiềm năng",
              "Khách giảm/ khách có nguy cơ mất",
              "Vấn đề thị trường",
              "Đề xuất"
            ];
            sheet2.appendRow(hRow1_2);
            sheet2.appendRow(hRow2_2);
            sheet2.getRange(1, 1, 2, 1).merge();
            sheet2.getRange(1, 2, 2, 1).merge();
            sheet2.getRange(1, 3, 1, 6).merge();
            sheet2.getRange(1, 9, 1, 4).merge();
            sheet2.getRange(1, 1, 2, 12)
              .setFontWeight("bold")
              .setBackground("#f3f4f6")
              .setHorizontalAlignment("center")
              .setVerticalAlignment("middle");
            sheet2.setFrozenRows(2);
          }

          var lastRow2 = sheet2.getLastRow();
          var actualLastRow2 = 0;
          if (lastRow2 > 0) {
            var colA2 = sheet2.getRange(1, 1, Math.min(lastRow2, 1000), 1).getValues();
            for (var r2 = colA2.length - 1; r2 >= 0; r2--) {
              if (colA2[r2][0] !== "" && colA2[r2][0] !== null && colA2[r2][0] !== undefined) {
                actualLastRow2 = r2 + 1;
                break;
              }
            }
          }
          var targetRow2 = Math.max(actualLastRow2 + 1, (sheet2.getLastRow() <= 2 ? 3 : actualLastRow2 + 1));
          
          var recordRange2 = sheet2.getRange(targetRow2, 1, rowsToSave.length, 12);
          recordRange2.setValues(rowsToSave);

          recordRange2.setBorder(true, null, true, null, null, null, "#000000", SpreadsheetApp.BorderStyle.SOLID);
          recordRange2.setVerticalAlignment("middle");
          recordRange2.setWrap(true);
          sheet2.getRange(targetRow2, 1, rowsToSave.length, 2).setHorizontalAlignment("center");
          sheet2.getRange(targetRow2, 4, rowsToSave.length, 3).setHorizontalAlignment("center");

        } catch (err2) {
          console.error("Lỗi khi ghi File 2 (BC QL kênh): " + err2);
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        "status": "success",
        "message": "Đã lưu 5 sale vào BC QL kênh tại cả 2 file"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. BÁO CÁO SALE SỈ (GIỮ NGUYÊN 100% THEO FILE HIỆN TẠI)
    else if (sheetName === "BC sale sỉ" || sheetName === "BC Sale sỉ" || sheetName === "BC Sale Sỉ") {
      var isSingleVisitApp = (data.restaurantName !== undefined);

      if (isSingleVisitApp) {
        if (sheet.getLastRow() === 0) {
          var headerRow1 = [
            "Thời gian gửi",
            "Ngày",
            "Người báo cáo",
            "Điểm cũ/ Điểm mới",
            "Tên điểm bán",
            "Địa chỉ điểm bán",
            "Đánh giá/ Đề xuất",
            "TỒN KHO", "", "",
            "ĐẶT HÀNG", "", ""
          ];
          var headerRow2 = [
            "", "", "", "", "", "", "",
            "Bom 30L", "Bom 50L", "Keg1L",
            "Bom 30L", "Bom 50L", "Keg1L"
          ];
          sheet.appendRow(headerRow1);
          sheet.appendRow(headerRow2);
          for (var c = 1; c <= 7; c++) {
            sheet.getRange(1, c, 2, 1).merge();
          }
          sheet.getRange(1, 8, 1, 3).merge();
          sheet.getRange(1, 11, 1, 3).merge();
          sheet.getRange(1, 1, 2, 13)
            .setFontWeight("bold")
            .setBackground("#f3f4f6")
            .setHorizontalAlignment("center")
            .setVerticalAlignment("middle");
          sheet.setFrozenRows(2);
        }

        var firstRowCol4 = sheet.getRange(1, 4).getValue();
        var secondRowCol4 = sheet.getLastRow() >= 2 ? sheet.getRange(2, 4).getValue() : "";
        var hasVisitOrderCol1 = (
          (firstRowCol4 && firstRowCol4.toString().indexOf("Điểm thứ") !== -1) ||
          (secondRowCol4 && secondRowCol4.toString().indexOf("Điểm thứ") !== -1)
        );

        if (hasVisitOrderCol1) {
          row.push(
            new Date(),
            data.date || "",
            data.reporter || "",
            data.visitOrder || "",
            data.outletType || "Điểm cũ",
            data.restaurantName || "",
            data.address || "",
            data.evaluationOrProposal || "",
            data.stockBom30L || "",
            data.stockBom50L || "",
            data.stockKeg1L || "",
            data.orderBom30L || "",
            data.orderBom50L || "",
            data.orderKeg1L || ""
          );
        } else {
          row.push(
            new Date(),
            data.date || "",
            data.reporter || "",
            data.outletType || "Điểm cũ",
            data.restaurantName || "",
            data.address || "",
            data.evaluationOrProposal || "",
            data.stockBom30L || "",
            data.stockBom50L || "",
            data.stockKeg1L || "",
            data.orderBom30L || "",
            data.orderBom50L || "",
            data.orderKeg1L || ""
          );
        }

        if (typeof SECOND_SPREADSHEET_ID !== "undefined" && SECOND_SPREADSHEET_ID && SECOND_SPREADSHEET_ID.trim() !== "") {
          try {
            var ss2 = SpreadsheetApp.openById(SECOND_SPREADSHEET_ID.trim());
            var sheet2 = ss2.getSheetByName("BC sale sỉ") || ss2.getSheetByName("BC Sale sỉ") || ss2.getSheets()[0];
            if (sheet2) {
              var autoVisitOrder2 = 1;
              var lastRow2 = sheet2.getLastRow();
              if (lastRow2 >= 3) {
                var todayStr = data.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
                var datesData2 = sheet2.getRange(3, 2, lastRow2 - 2, 1).getValues();
                var dayCount2 = 0;
                for (var d2 = 0; d2 < datesData2.length; d2++) {
                  var cellVal = datesData2[d2][0];
                  if (cellVal) {
                    var cellStr = (cellVal instanceof Date) ? Utilities.formatDate(cellVal, "GMT+7", "yyyy-MM-dd") : cellVal.toString();
                    if (cellStr.indexOf(todayStr) !== -1 || todayStr.indexOf(cellStr) !== -1) {
                      dayCount2++;
                    }
                  }
                }
                autoVisitOrder2 = dayCount2 + 1;
              } else if (lastRow2 === 2) {
                autoVisitOrder2 = 1;
              }

              var visitOrder2 = data.visitOrder || autoVisitOrder2;
              var typeVal2 = "cũ";
              if (data.outletType) {
                if (data.outletType.indexOf("mới") !== -1 || data.outletType.indexOf("Mới") !== -1) {
                  typeVal2 = "mới";
                } else {
                  typeVal2 = "cũ";
                }
              }

              sheet2.appendRow([
                new Date(),
                data.date || "",
                data.reporter || "",
                visitOrder2,
                typeVal2,
                data.restaurantName || "",
                data.address || "",
                data.evaluationOrProposal || "",
                data.stockBom30L || "",
                data.stockBom50L || "",
                data.stockKeg1L || "",
                data.orderBom30L || "",
                data.orderBom50L || "",
                data.orderKeg1L || ""
              ]);
            }
          } catch (err2) {
            console.error("Lỗi khi ghi File 2: " + err2);
          }
        }

      } else {
        if (sheet.getLastRow() === 0) {
          var headersSaleSi = [
            "Thời gian gửi",
            "Ngày",
            "Người báo cáo",
            "Điểm mở mới",
            "Phát sinh/ Đề xuất",
            "Tổng số điểm đến chăm sóc",
            "Tổng số đơn đặt hàng"
          ];
          for (var i = 1; i <= 15; i++) {
            headersSaleSi.push("Điểm bán số " + i);
          }
          sheet.appendRow(headersSaleSi);
          sheet.getRange(1, 1, 1, headersSaleSi.length).setFontWeight("bold").setBackground("#f3f4f6");
          sheet.setFrozenRows(1);
        }
        
        row.push(
          new Date(),
          data.date || "",
          data.reporter || "",
          data.newOutlets || "",
          data.issuesOrProposals || "",
          data.visitedOutlets || "", 
          data.totalOrders || ""     
        );
        
        if (data.outlets && Array.isArray(data.outlets)) {
          for (var i = 0; i < 15; i++) {
            row.push(data.outlets[i] !== undefined ? data.outlets[i] : "");
          }
        } else if (data.items && Array.isArray(data.items)) {
          for (var i = 0; i < 15; i++) {
            row.push(data.items[i] ? (data.items[i].value || "") : "");
          }
        }
      }
    } 

    // 2. BÁO CÁO CX (GIỮ NGUYÊN 100%)
    else if (sheetName === "BC CX") {
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
      row.push(new Date(), data.location, data.date, data.reporter, data.totalScore);
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value); 
          row.push(item.notes);
        });
      }
    } 

    // 3. BÁO CÁO BAR (GIỮ NGUYÊN 100%)
    else if (sheetName === "BC Bar" || sheetName === "BC Bar 1") {
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
      row.push(new Date(), data.location, data.date, data.reporter);
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value);
        });
      }
    }

    // 4. BÁO CÁO TỔNG BAR (GIỮ NGUYÊN 100%)
    else if (sheetName === "BC Tổng Bar") {
      if (sheet.getLastRow() === 0) {
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
      row.push(new Date(), data.location);
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value);
        });
      }
    }

    // 5. BÁO CÁO TQL (GIỮ NGUYÊN 100%)
    else if (sheetName === "BC TQL" || sheetName === "BC TQL 1" || sheetName === "Sheet17") {
      if (sheet.getLastRow() === 0) {
        var headersTQL = [
          "Thời gian gửi", "Ngày", "Người báo cáo",
          "DT toàn hệ thống:", "Mục tiêu ngày:", "Tăng/giảm so với hôm trc:", "Tổng lượt khách:", "Số bàn phục vụ:", "DT TB/khách:", "Xếp hạng DT:",
          "CH lv chính",
          "Xếp bàn và đón tiếp:", "Order & tư vấn món:", "Chăm sóc KH & upsell:", "Tốc độ ra đồ:", "Chương trình KM:", "Vệ sinh:", "Vđ phát sinh:", "Cách giải quyết ps:",
          "Tổng NS bàn đi làm:", "NS nghỉ đột xuất:", "NS nghỉ hẳn:", "NS mới:", "NS hỗ trợ:",
          "Phản hồi của khách:", "Vđ phát sinh:", "Cách giải quyết ps:", "Xuất bán tiệc:",
          "Món đẩy:", "Món bán chạy:", "Phản hồi của khách:", "Vđ phát sinh:", "Cách giải quyết ps:",
          "Hỏng hóc cần sửa:", "Hạng mục sửa trong ngày:",
          "Đào tạo:",
          "Đối ngoại:",
          "Ý KIẾN KHÁC"
        ];
        sheet.appendRow(headersTQL);
        sheet.getRange(1, 1, 1, headersTQL.length).setFontWeight("bold").setBackground("#f3f4f6");
        sheet.setFrozenRows(1);
      }
      
      var timeVal = data.time || Utilities.formatDate(new Date(), "GMT+7", "HH:mm");
      var dateVal = data.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
      var reporterVal = data.reporter || "";

      if (data.storesList && Array.isArray(data.storesList) && data.storesList.length > 0) {
        data.storesList.forEach(function(st) {
          var storeRow = [timeVal, dateVal, reporterVal];
          if (st.systemValues && Array.isArray(st.systemValues)) {
            st.systemValues.forEach(function(val) {
              storeRow.push(val !== undefined && val !== null ? String(val) : "");
            });
          } else {
            for (var s = 0; s < 7; s++) storeRow.push("");
          }
          storeRow.push(st.storeCode || st.storeName || "");
          if (st.storeValues && Array.isArray(st.storeValues)) {
            st.storeValues.forEach(function(val) {
              storeRow.push(val !== undefined && val !== null ? String(val) : "");
            });
          } else if (st.values && Array.isArray(st.values)) {
            for (var v = 7; v < st.values.length - 1; v++) {
              storeRow.push(st.values[v] !== undefined && st.values[v] !== null ? String(st.values[v]) : "");
            }
          } else {
            for (var stc = 0; stc < 26; stc++) storeRow.push("");
          }
          storeRow.push(st.otherOpinionValue !== undefined && st.otherOpinionValue !== null ? String(st.otherOpinionValue) : "");
          sheet.appendRow(storeRow);
        });
      } else if (data.stores) {
        var storeCodes = ["01 DD", "03 NVH", "12 ĐT", "94 LĐ", "96 HT", "98 VTP"];
        var systemKeys = [
          "dt_toan_he_thong", "muc_tieu_ngay", "tang_giam_hom_truoc", "tong_luot_khach", "so_ban_phuc_vu", "dt_tb_khach", "xep_hang_dt"
        ];
        var storeKeys = [
          "xep_ban", "order_tu_van", "cham_soc_upsell", "toc_do_ra_do", "chuong_trinh_km", "ve_sinh", "vd_phat_sinh_pv", "cach_giai_quyet_pv",
          "tong_ns_di_lam", "ns_nghi_dot_xuat", "ns_nghi_han", "ns_moi", "ns_ho_tro",
          "phan_hoi_khach_bia", "vd_phat_sinh_bia", "cach_giai_quyet_bia", "xuat_ban_tiec",
          "mon_day", "mon_ban_chay", "phan_hoi_khach_mon", "vd_phat_sinh_mon", "cach_giai_quyet_mon",
          "hong_hoc_can_sua", "hang_muc_sua_trong_ngay",
          "dao_tao", "doi_ngoai"
        ];
        var sysVals = data.systemEvaluation || {};
        storeCodes.forEach(function(code, idx) {
          var storeVals = data.stores[code] || {};
          var storeRow = [timeVal, dateVal, reporterVal];
          systemKeys.forEach(function(k) {
            if (idx === 0) {
              var val = sysVals[k] !== undefined ? sysVals[k] : (storeVals[k] !== undefined ? storeVals[k] : "");
              storeRow.push(String(val || ""));
            } else {
              storeRow.push("");
            }
          });
          storeRow.push(code);
          storeKeys.forEach(function(k) {
            storeRow.push(storeVals[k] !== undefined ? String(storeVals[k]) : "");
          });
          if (idx === 0) {
            storeRow.push(sysVals.y_kien_khac ? String(sysVals.y_kien_khac) : "");
          } else {
            storeRow.push("");
          }
          sheet.appendRow(storeRow);
        });
      } else if (data.items && Array.isArray(data.items)) {
        var legacyRow = [new Date(), data.date || "", data.reporter || "", data.location || ""];
        data.items.forEach(function(item) {
          legacyRow.push(item.value || "");
        });
        sheet.appendRow(legacyRow);
      }

      return ContentService.createTextOutput(JSON.stringify({
        "status": "success",
        "message": "Đã lưu 6 cơ sở vào " + sheetName
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. BÁO CÁO BẾP
    else if (sheetName === "BC Bếp") {
      if (sheet.getLastRow() === 0) {
        var headersBep = [
          "Thời gian gửi", "Cơ sở", "Ngày", "Người báo cáo",
          "Số người làm việc trong ca? Có đủ nv làm việc không?", "",
          "Có nv xin nghỉ hẳn không?", "",
          "NV mới đi làm",
          "Hàng đặt có về đủ không?",
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
      
      var itemMap = {};
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item, idx) {
          if (item.id) {
            itemMap[item.id] = item.value || "";
          }
          itemMap["idx_" + idx] = item.value || "";
        });
      }

      var val201 = itemMap[201] !== undefined ? itemMap[201] : (itemMap["idx_0"] || "");
      var val202 = itemMap[202] !== undefined ? itemMap[202] : (itemMap["idx_1"] || "");
      var val203 = itemMap[203] !== undefined ? itemMap[203] : (itemMap["idx_2"] || "");
      var val204 = itemMap[204] !== undefined ? itemMap[204] : (itemMap["idx_3"] || "");
      var val205 = itemMap[205] !== undefined ? itemMap[205] : (itemMap["idx_4"] || "");
      var val206 = itemMap[206] !== undefined ? itemMap[206] : (itemMap["idx_5"] || "");
      var val207 = itemMap[207] !== undefined ? itemMap[207] : (itemMap["idx_6"] || "");
      var val208 = itemMap[208] !== undefined ? itemMap[208] : (itemMap["idx_7"] || "");
      var val209 = itemMap[209] !== undefined ? itemMap[209] : (itemMap["idx_8"] || "");

      // Cột A: Thời gian gửi
      // Cột B: Cơ sở
      // Cột C: Ngày
      // Cột D: Người báo cáo
      row.push(new Date(), data.location, data.date || "", data.reporter || "");

      // Cột E: Số người làm việc trong ca? Có đủ nv làm việc không?
      row.push(val201);

      // Cột F: để trống
      row.push("");

      // Cột G: Có nv xin nghỉ hẳn không?
      row.push(val202);

      // Cột H: để trống
      row.push("");

      // Cột I: NV mới đi làm
      row.push(val203);

      // Cột J: Hàng đặt có về đủ không?
      row.push(val204);

      // Cột K: Sự cố xảy ra trong ngày không?
      row.push(val205);

      // Cột L: Món bán chạy trong ngày
      row.push(val206);

      // Cột M: CCDC, thiết bị hỏng trong ngày
      row.push(val207);

      // Cột N: CCDC, thiết bị được sửa trong ngày
      row.push(val208);

      // Cột O: Đề xuất
      row.push(val209);
    }

    // 7. BÁO CÁO VẬN HÀNH (GIỮ NGUYÊN 100%)
    else if (sheetName === "BC Vận hành" || sheetName === "BC vận hành") {
      if (sheet.getLastRow() === 0) {
        var row1 = ["", "", "", "", "NHÂN SỰ", "", "", "", "", "", "SỬA CHỮA", "", "KINH DOANH", "", "", "", "", "", "", "", "", ""];
        sheet.appendRow(row1);
        sheet.getRange("E1:J1").mergeAcross().setHorizontalAlignment("center").setFontWeight("bold").setBackground("#fff2cc");
        sheet.getRange("K1:L1").mergeAcross().setHorizontalAlignment("center").setFontWeight("bold").setBackground("#ffe599");
        sheet.getRange("M1:V1").mergeAcross().setHorizontalAlignment("center").setFontWeight("bold").setBackground("#fff2cc");
        
        var row2 = [
          "Thời gian gửi", "Cơ Sở", "Ngày", "Người báo cáo",
          "Nhân viên mới", "Nhân viên nghỉ việc (đột xuất/nghỉ hẳn/cho nghỉ)", "Số lượng nhân viên làm trong ngày", "Nhân viên vi phạm quy định", "Số lượng nv ngủ tại CH", "Đào tạo nhân viên",
          "Thiết bị, hạng mục cần sửa chữa", "Thiết bị đã sửa trong ngày",
          "Món ăn bán chạy trong ngày", "Món lên chậm nhất", "Phản hồi không tốt của KH", "Số bill chênh lệch tạm tính và thanh toán", "CTKM áp dụng trong ngày", 
          "Hoạt động offline trong ngày", "Xuất bán đơn khách tiệc", "Số lượng Thành viên tích điểm/ tổng bill",
          "Phát sinh bất thường trong ngày", "Đề xuất"
        ];
        sheet.appendRow(row2);
        var headerRange = sheet.getRange("A2:V2");
        headerRange.setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
        sheet.getRange("A1:A2").merge().setVerticalAlignment("middle").setHorizontalAlignment("center").setFontWeight("bold");
        sheet.getRange("B1:B2").merge().setVerticalAlignment("middle").setHorizontalAlignment("center").setFontWeight("bold");
        sheet.getRange("C1:C2").merge().setVerticalAlignment("middle").setHorizontalAlignment("center").setFontWeight("bold");
        sheet.getRange("D1:D2").merge().setVerticalAlignment("middle").setHorizontalAlignment("center").setFontWeight("bold");
        sheet.setFrozenRows(2);
      }

      row.push(new Date(), data.location, data.date || "", data.reporter || "");
      if (data.items && data.items.length > 0) {
        data.items.forEach(function(item) {
          row.push(item.value);
        });
      }
    }

    // Ghi dữ liệu dòng mới vào bảng tính nếu có (cho các báo cáo đơn)
    if (row && row.length > 0) {
      sheet.appendRow(row);
    }
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base sm:text-lg">Mã Google Apps Script (Mới nhất)</h3>
              <p className="text-xs text-slate-500">Giữ nguyên 100% các báo cáo khác | Cập nhật vị trí cột BC Bếp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm flex-1">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs sm:text-sm">
            <span className="font-bold">Lưu ý sau khi dán:</span> Nhấn <strong>Deploy</strong> (Triển khai) &gt; <strong>Manage deployments</strong> &gt; Chỉnh sửa và chọn <strong>New version</strong> (Phiên bản mới) để cập nhật code đang chạy.
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[350px]">
              {scriptCode}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-3 justify-end items-center">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
              copied
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Đã sao chép mã!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Sao chép toàn bộ mã
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
