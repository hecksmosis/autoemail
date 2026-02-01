import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
};

export const sendEmail = async ({
  to,
  subject,
  html,
  replyTo,
  fromName,
}: EmailOptions) => {
  try {
    // UNTIL YOU VERIFY A DOMAIN: You must use 'onboarding@resend.dev'
    // AFTER VERIFICATION: Change this to 'reviews@your-domain.com'
    const fromAddress = "onboarding@resend.dev";

    // Display name logic: "Acme Corp <onboarding@resend.dev>"
    const fromString = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

    const data = await resend.emails.send({
      from: fromString,
      to,
      subject,
      html,
      reply_to: replyTo, // Critical for SaaS
    });

    if (data.error) {
      console.error("Resend API Error:", data.error);
      return { success: false, error: data.error.message };
    }

    return { success: true, id: data.data?.id };
  } catch (error: any) {
    console.error("Email Sending Exception:", error);
    return { success: false, error: error.message };
  }
};
