import * as postmark from 'postmark';

// Initialize Postmark client
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY || '');

export async function sendMagicLinkEmail(to: string, magicLink: string, nickName?: string): Promise<void> {
  try {
    await client.sendEmailWithTemplate({
      From: "Low Code CTO <no-reply@lowcodecto.com>",
      To: to,
      TemplateId: Number(process.env.POSTMARK_TEMPLATE_ID || "0"),
      TemplateModel: {
        magicLink: magicLink,
        nickName: nickName || to || "Subscriber"
      },
      MessageStream: "outbound"
    });
    console.log(`Magic link email sent to ${to}`);
  } catch (error) {
    console.error("Error sending magic link email via Postmark:", error);
  }
}