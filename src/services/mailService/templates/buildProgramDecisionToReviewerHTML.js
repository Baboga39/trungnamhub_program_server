const { getBranchInfo } = require("../../../integrations/core/branchService");

module.exports = function buildProgramDecisionToReviewerHTML({
  program,
  reviewerName,
  action,
  comment,
  programStatus,
  programLink,
}) {
  const isApprove = action === "APPROVE";
  const branch = getBranchInfo(program.branchId);
  const branchName = branch?.name || `Ngành ${program.branchId}`;
  const programTitle = `Chương trình Sinh hoạt Quý ${program.quarter}/${program.year} - ${branchName}`;

  const themeColor = isApprove ? "#10b981" : "#ef4444";
  const headerBg = isApprove
    ? "linear-gradient(135deg, #059669 0%, #10b981 100%)"
    : "linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)";

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận kết quả phê duyệt chương trình sinh hoạt</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 30px auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
        .header {
          background: ${headerBg};
          color: #ffffff;
          padding: 26px 20px;
          text-align: center;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 32px 28px;
          color: #334155;
          line-height: 1.6;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 16px;
        }
        .card {
          background-color: #f8fafc;
          border-left: 4px solid ${themeColor};
          padding: 18px 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .card-title {
          font-size: 17px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 10px;
        }
        .comment-box {
          background-color: #f1f5f9;
          border-radius: 8px;
          padding: 14px 16px;
          margin-top: 12px;
          font-size: 14px;
          color: #334155;
          font-style: italic;
        }
        .btn-wrapper {
          text-align: center;
          margin: 32px 0 16px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .footer {
          background-color: #f1f5f9;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          📋 Xác Nhận Thao Tác Phê Duyệt
        </div>
        <div class="content">
          <p class="greeting">Kính gửi <strong>${reviewerName}</strong>,</p>
          <p>
            Hệ thống xác nhận bạn vừa thực hiện 
            <strong style="color: ${themeColor};">${isApprove ? "ĐỒNG Ý PHÊ DUYỆT" : "TỪ CHỐI"}</strong> 
            đối với chương trình sinh hoạt dưới đây:
          </p>

          <div class="card">
            <div class="card-title">📌 ${programTitle}</div>
            
            <div style="margin-bottom: 8px; font-size: 14px;">
              <span style="color: #64748b;">Hành động:</span> 
              <strong style="color: ${themeColor};">${isApprove ? "Đã Phê Duyệt" : "Đã Từ Chối"}</strong>
            </div>

            <div style="margin-bottom: 8px; font-size: 14px;">
              <span style="color: #64748b;">Phiên bản:</span> 
              <strong>v${program.version}</strong>
            </div>

            ${
              comment
                ? `
                <div style="margin-top: 12px; font-size: 14px;">
                  <span style="color: #64748b;">Ghi chú / Nhận xét của bạn:</span>
                  <div class="comment-box">"${comment}"</div>
                </div>
              `
                : ""
            }
          </div>

          <div class="btn-wrapper">
            <a href="${programLink}" class="btn">XEM CHƯƠNG TRÌNH TRÊN HỆ THỐNG</a>
          </div>
        </div>
        <div class="footer">
          Email này được gửi tự động từ Hệ thống Quản lý Trung Nam Hub.
        </div>
      </div>
    </body>
    </html>
  `;
};
