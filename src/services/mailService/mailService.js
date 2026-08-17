const { Resend } = require("resend");
const buildProgramApprovalHTML = require("./templates/buildProgramApprovalHTML");

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Trung Nam Hub <onboarding@resend.dev>";

const formatToEmail = (toInput) => {
  if (Array.isArray(toInput)) {
    return toInput.map((e) => e.trim()).filter(Boolean);
  }
  if (typeof toInput === "string") {
    return toInput.split(",").map((e) => e.trim()).filter(Boolean);
  }
  return [];
};

/**
  Send email requesting program approval
 */
const sendProgramApprovalMail = async ({
  toEmail,
  programTitle,
  reviewerName,
  senderName,
  approvalLink,
  lessonCount = 0,
}) => {
  if (!resend) {
    console.warn("⚠️ RESEND_API_KEY is not configured in .env");
    return;
  }

  try {
    const htmlContent = buildProgramApprovalHTML({
      programTitle,
      reviewerName,
      senderName,
      approvalLink,
      lessonCount,
    });

    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: formatToEmail(toEmail),
      subject: `🔔 Yêu cầu phê duyệt chương trình: ${programTitle}`,
      html: htmlContent,
    });

    if (response.error) {
      console.error("❌ Resend Program Approval Mail Error:", response.error);
      return;
    }

    console.log(`📧 Program Approval email sent to: ${toEmail} (for ${reviewerName}) | ID: ${response.data?.id}`);
    return response.data;
  } catch (error) {
    console.error("❌ Mail Service Error - Failed to send program approval email:", error);
  }
};

module.exports = {
  sendProgramApprovalMail,
};
