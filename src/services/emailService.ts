
import * as postmark from 'postmark';

// Initialize Postmark client
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY || '');

export async function sendMagicLinkEmail(to: string, magicLink: string): Promise<void> {
  try {
    await client.sendEmail({
      From: "no-reply@lowcodecto.com", // Must be a verified sender in Postmark
      To: process.env.POSTMARK_TO_EMAIL || "",
      Subject: process.env.POSTMARK_SUBJECT || "",
      TextBody: `Click the link below to log in:\n\n${magicLink}\n\nThis link will expire soon.`,
      HtmlBody: `<p>Click the link below to log in:</p><p><a href="${magicLink}">${magicLink}</a></p><p>This link will expire soon.</p>`,
      MessageStream: "outbound", // Use the correct Postmark stream
    });
    console.log(`Magic link email sent to ${to}`);
  } catch (error) {
    console.error("Error sending magic link email via Postmark:", error);
  }
}
