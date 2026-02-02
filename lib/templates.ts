import { SupabaseClient } from "@supabase/supabase-js";

export type EmailTemplate = {
  subject: string;
  heading: string;
  body: string;
  button_text: string;
};

// Default fallbacks if user hasn't edited anything
const DEFAULTS: Record<string, EmailTemplate> = {
  review: {
    subject: "How was your visit?",
    heading: "Hi {{name}}! 👋",
    body: "Thanks for visiting us recently. We'd love to know how we did. It only takes a second!",
    button_text: "⭐⭐⭐⭐⭐ Leave a Review",
  },
  retention: {
    subject: "We miss you!",
    heading: "Hi {{name}},",
    body: "It's been a while since we saw you. We'd love to see you again soon!",
    button_text: "Book a Visit",
  },
};

export async function getTemplate(
  supabase: SupabaseClient,
  tenantId: string,
  type: "review" | "retention",
): Promise<EmailTemplate> {
  const { data } = await supabase
    .from("email_templates")
    .select("subject, heading, body, button_text")
    .eq("tenant_id", tenantId)
    .eq("type", type)
    .single();

  if (data) return data;
  return DEFAULTS[type];
}

export function compileTemplate(
  template: EmailTemplate,
  variables: Record<string, string>,
) {
  let { subject, heading, body, button_text } = template;

  // Replace {{key}} with value
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, variables[key]);
    heading = heading.replace(regex, variables[key]);
    body = body.replace(regex, variables[key]);
  });

  return { subject, heading, body, button_text };
}
