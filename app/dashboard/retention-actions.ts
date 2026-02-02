"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RetentionProgram = {
  id: string;
  tenant_id: string;
  service_tag: string;
  display_name: string;
  enabled: boolean;
  created_at: string;
  steps?: ProgramStep[];
};

export type ProgramStep = {
  id: string;
  program_id: string;
  step_order: number;
  offset_days: number;
  template_id: string | null;
  enabled: boolean;
  cooldown_days: number;
  template?: {
    id: string;
    subject: string;
    heading: string;
    body: string;
    button_text: string;
  };
};

export type CreateProgramInput = {
  display_name: string;
  service_tag: string;
  enabled?: boolean;
};

export type CreateStepInput = {
  program_id: string;
  offset_days: number;
  step_order: number;
  cooldown_days?: number;
  template: {
    subject: string;
    heading: string;
    body: string;
    button_text: string;
  };
};

export async function getRetentionPrograms() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant) throw new Error("Tenant not found");

  // Get programs with their steps and templates
  const { data: programs, error } = await supabase
    .from("retention_programs")
    .select(
      `
      *,
      steps:program_steps(
        *,
        template:email_templates(id, subject, heading, body, button_text)
      )
    `,
    )
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Sort steps by step_order
  const programsWithSortedSteps = programs?.map((program) => ({
    ...program,
    steps: program.steps?.sort((a, b) => a.step_order - b.step_order) || [],
  }));

  return programsWithSortedSteps as RetentionProgram[];
}

export async function createRetentionProgram(input: CreateProgramInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant) throw new Error("Tenant not found");

  // Normalize service_tag: lowercase, trim, replace spaces with underscores
  const normalizedTag = input.service_tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const { data, error } = await supabase
    .from("retention_programs")
    .insert({
      tenant_id: tenant.id,
      display_name: input.display_name,
      service_tag: normalizedTag,
      enabled: input.enabled ?? true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      throw new Error(
        "A program with this service tag already exists. Please use a different tag.",
      );
    }
    throw error;
  }

  revalidatePath("/dashboard");
  return data;
}

export async function updateRetentionProgram(
  programId: string,
  updates: Partial<CreateProgramInput>,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: any = {};

  if (updates.display_name) {
    updateData.display_name = updates.display_name;
  }

  if (updates.service_tag) {
    updateData.service_tag = updates.service_tag
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  }

  if (updates.enabled !== undefined) {
    updateData.enabled = updates.enabled;
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("retention_programs")
    .update(updateData)
    .eq("id", programId)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard");
  return data;
}

// ========================================
// DELETE PROGRAM
// ========================================
export async function deleteRetentionProgram(programId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("retention_programs")
    .delete()
    .eq("id", programId);

  if (error) throw error;

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createProgramStep(input: CreateStepInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant) throw new Error("Tenant not found");

  // 1. Create the template first
  const { data: template, error: templateError } = await supabase
    .from("email_templates")
    .insert({
      tenant_id: tenant.id,
      type: "retention",
      is_program_template: true,
      program_id: input.program_id,
      subject: input.template.subject,
      heading: input.template.heading,
      body: input.template.body,
      button_text: input.template.button_text,
    })
    .select()
    .single();

  if (templateError) throw templateError;

  // 2. Create the step
  const { data: step, error: stepError } = await supabase
    .from("program_steps")
    .insert({
      program_id: input.program_id,
      step_order: input.step_order,
      offset_days: input.offset_days,
      template_id: template.id,
      cooldown_days: input.cooldown_days ?? 0,
      enabled: true,
    })
    .select()
    .single();

  if (stepError) throw stepError;

  revalidatePath("/dashboard");
  return step;
}

export async function updateProgramStep(
  stepId: string,
  updates: {
    offset_days?: number;
    cooldown_days?: number;
    enabled?: boolean;
    template?: {
      subject: string;
      heading: string;
      body: string;
      button_text: string;
    };
  },
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Update step metadata
  const stepUpdates: any = {};
  if (updates.offset_days !== undefined)
    stepUpdates.offset_days = updates.offset_days;
  if (updates.cooldown_days !== undefined)
    stepUpdates.cooldown_days = updates.cooldown_days;
  if (updates.enabled !== undefined) stepUpdates.enabled = updates.enabled;

  if (Object.keys(stepUpdates).length > 0) {
    const { error: stepError } = await supabase
      .from("program_steps")
      .update(stepUpdates)
      .eq("id", stepId);

    if (stepError) throw stepError;
  }

  // 2. Update template if provided
  if (updates.template) {
    // Get template_id from step
    const { data: step } = await supabase
      .from("program_steps")
      .select("template_id")
      .eq("id", stepId)
      .single();

    if (step?.template_id) {
      const { error: templateError } = await supabase
        .from("email_templates")
        .update({
          subject: updates.template.subject,
          heading: updates.template.heading,
          body: updates.template.body,
          button_text: updates.template.button_text,
        })
        .eq("id", step.template_id);

      if (templateError) throw templateError;
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProgramStep(stepId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get the template_id first so we can delete it
  const { data: step } = await supabase
    .from("program_steps")
    .select("template_id")
    .eq("id", stepId)
    .single();

  // Delete the step (will cascade to scheduled_messages)
  const { error: stepError } = await supabase
    .from("program_steps")
    .delete()
    .eq("id", stepId);

  if (stepError) throw stepError;

  // Delete the associated template
  if (step?.template_id) {
    await supabase.from("email_templates").delete().eq("id", step.template_id);
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getCustomerProgramStatus(customerId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get customer info
  const { data: customer } = await supabase
    .from("customers")
    .select("service_tag, last_visit_date")
    .eq("id", customerId)
    .single();

  if (!customer || !customer.service_tag) {
    return {
      hasProgram: false,
      programName: null,
      nextEmailDays: null,
      daysSinceVisit: null,
    };
  }

  // Get the program for this service
  const { data: program } = await supabase
    .from("retention_programs")
    .select(
      `
      id,
      display_name,
      steps:program_steps(offset_days, enabled)
    `,
    )
    .eq("service_tag", customer.service_tag)
    .eq("enabled", true)
    .single();

  if (!program) {
    return {
      hasProgram: false,
      programName: null,
      nextEmailDays: null,
      daysSinceVisit: null,
    };
  }

  // Calculate days since last visit
  const daysSinceVisit = Math.floor(
    (new Date().getTime() - new Date(customer.last_visit_date).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  // Find next enabled step
  const enabledSteps =
    program.steps
      ?.filter((s) => s.enabled)
      .sort((a, b) => a.offset_days - b.offset_days) || [];
  const nextStep = enabledSteps.find(
    (step) => step.offset_days > daysSinceVisit,
  );

  return {
    hasProgram: true,
    programName: program.display_name,
    nextEmailDays: nextStep ? nextStep.offset_days - daysSinceVisit : null,
    daysSinceVisit,
    totalSteps: enabledSteps.length,
  };
}

export async function getServiceTagSuggestions() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!tenant) throw new Error("Tenant not found");

  // Get unique service tags from customers
  const { data: tags } = await supabase
    .from("customers")
    .select("service_tag")
    .eq("tenant_id", tenant.id)
    .not("service_tag", "is", null);

  const uniqueTags = [
    ...new Set(tags?.map((t) => t.service_tag).filter(Boolean)),
  ] as string[];

  return uniqueTags;
}
