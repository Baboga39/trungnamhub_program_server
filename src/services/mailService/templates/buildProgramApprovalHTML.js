module.exports = function buildProgramApprovalHTML({
  programTitle,
  reviewerName,
  senderName,
  approvalLink,
  lessonCount = 0,
}) {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Yêu cầu phê duyệt chương trình sinh hoạt</title>
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
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
          color: #ffffff;
          padding: 28px;
          text-align: center;
          font-size: 22px;
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
          border-left: 4px solid #3b82f6;
          padding: 16px 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .card-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e293b;
          margin-bottom: 8px;
        }
        .card-meta {
          font-size: 14px;
          color: #64748b;
        }
        .btn-wrapper {
          text-align: center;
          margin: 32px 0 20px 0;
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
          transition: all 0.3s ease;
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
          📋 Yêu cầu Phê duyệt Chương trình Sinh hoạt
        </div>
        <div class="content">
          <p class="greeting">Kính gửi <strong>${reviewerName}</strong>,</p>
          <p>Bạn vừa nhận được một yêu cầu phê duyệt chương trình sinh hoạt từ <strong>${senderName}</strong> thông qua hệ thống Trung Nam Hub.</p>
          
          <div class="card">
            <div class="card-title">📌 ${programTitle}</div>
            <div class="card-meta">Tổng số bài học: <strong>${lessonCount} bài</strong></div>
          </div>
          
          <p>Vui lòng click vào nút bên dưới để xem chi tiết danh sách bài học và thực hiện phê duyệt (hoặc gửi phản hồi từ chối):</p>

          <div class="btn-wrapper">
            <a href="${approvalLink}" class="btn">MỞ VÀ PHÊ DUYỆT CHƯƠNG TRÌNH</a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            <em>Lưu ý: Liên kết phê duyệt có thời hạn trong vòng 48 giờ. Vui lòng không chia sẻ liên kết này với bất kỳ ai khác.</em>
          </p>
        </div>
        <div class="footer">
          Email này được gửi tự động từ Hệ thống Quản lý Trung Nam Hub.
        </div>
      </div>
    </body>
    </html>
  `;
};
