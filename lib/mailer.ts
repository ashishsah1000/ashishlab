import nodemailer from "nodemailer";

export interface GoalEmailData {
  toEmail: string;
  userName: string;
  reportType: "midweek" | "friday";
  weeklyRate: number;
  totalTasksWeek: number;
  completedTasksWeek: number;
  isRewardUnlocked: boolean;
  goalsSummary: Array<{
    title: string;
    completed: number;
    total: number;
  }>;
  aiAdvice: string;
}

export function createTransporter() {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

export async function sendGoalProgressEmail(data: GoalEmailData) {
  const transporter = createTransporter();
  const title =
    data.reportType === "midweek"
      ? "🎯 Mid-Week Goal Check-in & Momentum Boost"
      : "🌟 Friday Progress Report & Weekly Reward Status";

  const bannerColor = data.isRewardUnlocked ? "#10b981" : "#3b82f6";
  const rewardBadgeHtml = data.isRewardUnlocked
    ? `<div style="background-color: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <span style="font-size: 28px;">🎁</span>
        <h3 style="color: #065f46; margin: 8px 0 4px 0; font-size: 18px;">80% Target Achieved! Weekly Reward Unlocked</h3>
        <p style="color: #047857; margin: 0; font-size: 14px;">Great job! You have qualified for your Small Weekly Reward in your Goal Monitor store.</p>
       </div>`
    : `<div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
        <h3 style="color: #334155; margin: 0 0 4px 0; font-size: 16px;">Current Consistency: ${data.weeklyRate}%</h3>
        <p style="color: #64748b; margin: 0; font-size: 14px;">Reach 80% to unlock this week's Small Reward!</p>
       </div>`;

  const goalsListHtml = data.goalsSummary
    .map(
      (g) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 8px; font-weight: 600; color: #1e293b;">${g.title}</td>
        <td style="padding: 12px 8px; text-align: right; color: #475569;">${g.completed} / ${g.total} tasks</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: ${g.total > 0 && (g.completed / g.total) >= 0.8 ? "#10b981" : "#64748b"};">
          ${g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0}%
        </td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .header { background: #0f172a; padding: 32px 24px; text-align: center; color: #ffffff; }
          .content { padding: 32px 24px; }
          .stat-box { display: flex; justify-content: space-around; background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; }
          .ai-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 12px 12px 0; margin: 24px 0; }
          .btn { display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-top: 16px; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; padding: 20px; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800;">${title}</h1>
            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">Goal Monitor • Ashish Lab</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; line-height: 1.5; color: #334155;">Hello <strong>${data.userName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.5; color: #475569;">
              ${
                data.reportType === "midweek"
                  ? "Here is your mid-week pulse check. Consistency is the compound interest of achievement. Take a moment to review where you stand today."
                  : "Another week of focus! Here is your official Friday wrap-up report and your reward eligibility status."
              }
            </p>

            ${rewardBadgeHtml}

            <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; color: #64748b;">
                  <th style="padding: 8px;">Goal</th>
                  <th style="padding: 8px; text-align: right;">Completed</th>
                  <th style="padding: 8px; text-align: right;">Rate</th>
                </tr>
              </thead>
              <tbody>
                ${goalsListHtml}
              </tbody>
            </table>

            <div class="ai-box">
              <h4 style="margin: 0 0 8px 0; color: #1d4ed8; font-size: 15px;">🤖 AI Coach Recommendation</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #1e3a8a;">${data.aiAdvice}</p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <a href="http://localhost:3000/weekly/goals" class="btn" style="color: #ffffff;">Open Goal Monitor & Weekly Calendar</a>
            </div>
          </div>
          <div class="footer">
            Sent automatically by Goal Monitor System. Stay disciplined, celebrate your wins!
          </div>
        </div>
      </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[Goal Monitor Mailer] SMTP credentials not set. Simulated email to ${data.toEmail}:`);
    console.log(`Subject: ${title}`);
    console.log(`Summary: Rate ${data.weeklyRate}%, Reward Unlocked: ${data.isRewardUnlocked}`);
    return {
      success: true,
      simulated: true,
      message: "Email simulated (GMAIL_USER or GMAIL_APP_PASSWORD not configured).",
      previewHtml: htmlContent,
    };
  }

  const mailOptions = {
    from: `"Goal Monitor" <${process.env.GMAIL_USER}>`,
    to: data.toEmail,
    subject: title,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return {
    success: true,
    simulated: false,
    messageId: info.messageId,
  };
}
