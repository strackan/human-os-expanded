"use server";

import { Resend } from "resend";
import { getSupabaseServer } from "@/lib/supabase-server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function submitEmailForReport({
  email,
  domain,
  companyName,
  jobId,
  score,
  mentionRate,
}: {
  email: string;
  domain: string;
  companyName: string;
  jobId: string;
  score: number;
  mentionRate: number;
}) {
  if (!email || !jobId) {
    return { success: false, error: "Email and job ID are required." };
  }

  const shareUrl = `https://fancyrobot.com/snapshot/share/${jobId}`;
  const downloadUrl = `https://fancyrobot.com/api/v1/lite-report/download/${jobId}`;
  const mentionPct = (mentionRate * 100).toFixed(0);

  try {
    // Send branded report email to user
    await resend.emails.send({
      from: "Fancy Robot <onboarding@resend.dev>",
      to: email,
      subject: `Your AI Visibility Report for ${companyName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="text-align: center; padding: 32px 0 24px;">
            <div style="display: inline-block; width: 48px; height: 48px; background: #1a1a1a; border-radius: 50%; line-height: 48px; color: #fff; font-weight: bold; font-size: 16px;">FR</div>
            <h1 style="margin: 16px 0 4px; font-size: 22px;">AI Visibility Report</h1>
            <p style="color: #666; margin: 0; font-size: 15px;">${companyName}</p>
          </div>

          <div style="background: #f8f5f0; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">ARI Score</p>
            <p style="margin: 0; font-size: 48px; font-weight: bold;">${Math.round(score)}</p>
            <p style="margin: 8px 0 0; font-size: 14px; color: #666;">Mention rate: ${mentionPct}%</p>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${downloadUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 600; font-size: 14px;">Download PDF Report</a>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${shareUrl}" style="color: #666; font-size: 13px;">View report online →</a>
          </div>

          <div style="background: #f0f7ff; border-radius: 16px; padding: 24px; text-align: center;">
            <h3 style="margin: 0 0 8px; font-size: 16px;">Want to go deeper?</h3>
            <p style="color: #666; font-size: 14px; margin: 0 0 16px;">Get a full AI Visibility Audit with 60+ prompts, 8 scoring dimensions, and a consultant-quality narrative report.</p>
            <a href="mailto:hello@fancyrobot.ai" style="display: inline-block; background: #fff; border: 1px solid #1a1a1a; color: #1a1a1a; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: 600; font-size: 14px;">Email Us: hello@fancyrobot.ai</a>
          </div>

          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 32px;">Fancy Robot Creative · AI Visibility Intelligence</p>
        </div>
      `,
    });

    // Send internal notification
    await resend.emails.send({
      from: "Fancy Robot <onboarding@resend.dev>",
      to: "strackan@gmail.com",
      replyTo: email,
      subject: `Snapshot Lead: ${email} — ${companyName} (Score: ${Math.round(score)})`,
      html: `
        <h2>Snapshot Email Capture</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Domain:</strong> ${domain}</p>
        <p><strong>ARI Score:</strong> ${Math.round(score)}</p>
        <p><strong>Mention Rate:</strong> ${mentionPct}%</p>
        <p><strong>Job ID:</strong> ${jobId}</p>
        <p><a href="${shareUrl}">View Report</a> · <a href="${downloadUrl}">Download PDF</a></p>
      `,
    });

    // Store in Supabase (non-blocking)
    const supabase = getSupabaseServer();
    if (supabase) {
      await supabase
        .schema("crm")
        .from("contact_submissions")
        .insert({
          product_id: "fancy-robot-snapshot",
          email,
          company: companyName,
          snapshot_domain: domain,
          message: `Snapshot email capture. ARI Score: ${Math.round(score)}, Mention rate: ${mentionPct}%`,
        })
        .then(({ error }) => {
          if (error) console.warn("Failed to store contact submission:", error.message);
        });

      await supabase
        .schema("founder_os")
        .from("messages")
        .insert({
          from_forest: "product:fancy-robot",
          from_name: "Fancy Robot",
          to_forest: "founder:justin",
          to_name: "Justin Strackany",
          subject: `Snapshot lead captured: ${email} for ${companyName}`,
          content: [
            `Email captured from AI Visibility Snapshot.`,
            ``,
            `Email: ${email}`,
            `Company: ${companyName}`,
            `Domain: ${domain}`,
            `ARI Score: ${Math.round(score)}`,
            `Mention Rate: ${mentionPct}%`,
            `Job ID: ${jobId}`,
          ].join("\n"),
          status: "pending",
        })
        .then(({ error }) => {
          if (error) console.warn("Failed to log founder message:", error.message);
        });
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to send report. Please try again." };
  }
}

export async function submitContactForm(formData: FormData) {
  const name = formData.get("name") as string;
  const company = formData.get("company") as string;
  const email = formData.get("email") as string;
  const product = formData.get("product") as string;
  const snapshotDomain = formData.get("snapshot_domain") as string | null;

  if (!name || !company || !email || !product) {
    return { success: false, error: "All fields are required." };
  }

  const domainLine = snapshotDomain
    ? `<p><strong>Snapshot domain:</strong> ${snapshotDomain}</p>`
    : "";

  try {
    // Send notification email
    await resend.emails.send({
      from: "Fancy Robot <onboarding@resend.dev>",
      to: "strackan@gmail.com",
      replyTo: email,
      subject: `New AI Visibility Score Request — ${company}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>What they sell:</strong> ${product}</p>
        ${domainLine}
      `,
    });

    // Store in Supabase (non-blocking — don't fail the form if DB is down)
    const supabase = getSupabaseServer();
    if (supabase) {
      // Store contact submission
      await supabase
        .schema("crm")
        .from("contact_submissions")
        .insert({
          product_id: "fancy-robot",
          name,
          email,
          company,
          message: product,
          snapshot_domain: snapshotDomain || null,
        })
        .then(({ error }) => {
          if (error) console.warn("Failed to store contact submission:", error.message);
        });

      // Log founder message
      await supabase
        .schema("founder_os")
        .from("messages")
        .insert({
          from_forest: "product:fancy-robot",
          from_name: "Fancy Robot",
          to_forest: "founder:justin",
          to_name: "Justin Strackany",
          subject: `Contact Request received from ${email} for Fancy Robot`,
          content: [
            `Contact form submission for Fancy Robot.`,
            ``,
            `Name: ${name}`,
            `Company: ${company}`,
            `Email: ${email}`,
            `What they sell: ${product}`,
            snapshotDomain ? `Snapshot domain: ${snapshotDomain}` : null,
          ]
            .filter(Boolean)
            .join("\n"),
          status: "pending",
        })
        .then(({ error }) => {
          if (error) console.warn("Failed to log founder message:", error.message);
        });
    }

    return { success: true };
  } catch {
    return { success: false, error: "Failed to send message. Please try again." };
  }
}
