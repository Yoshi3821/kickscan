import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createHash, randomBytes } from "crypto";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * POST /api/forgot
 * Actions:
 *   - forgot_password: sends temp password to registered email
 *   - forgot_username: sends username to registered email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email } = body;

    if (!action || !email) {
      return NextResponse.json({ error: "action and email required" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, email')
      .eq('email', trimmedEmail)
      .single();

    if (userError || !user) {
      // Don't reveal whether email exists — always show success
      return NextResponse.json({
        success: true,
        message: "If this email is registered, you will receive an email shortly."
      });
    }

    if (action === "forgot_username") {
      // Send username reminder
      await sendEmail(
        trimmedEmail,
        "Your KickScan Username",
        `Hi there!\n\nYour KickScan username is: ${user.username}\n\nYou can log in at https://kickscan.io/predict\n\nIf you didn't request this, please ignore this email.\n\n— KickScan Team`
      );

      return NextResponse.json({
        success: true,
        message: "If this email is registered, you will receive an email shortly."
      });

    } else if (action === "forgot_password") {
      // Generate temporary password
      const tempPassword = randomBytes(4).toString('hex'); // 8 char hex string
      const tempHash = hashPassword(tempPassword);

      // Update password in DB
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ password_hash: tempHash })
        .eq('id', user.id);

      if (updateError) {
        console.error("Failed to update password:", updateError);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
      }

      // Send temp password via email
      await sendEmail(
        trimmedEmail,
        "KickScan Password Reset",
        `Hi ${user.username}!\n\nYour password has been reset.\n\nTemporary password: ${tempPassword}\n\nPlease log in at https://kickscan.io and change your password.\n\nIf you didn't request this, please contact us immediately.\n\n— KickScan Team`
      );

      return NextResponse.json({
        success: true,
        message: "If this email is registered, you will receive a password reset email shortly."
      });

    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (err) {
    console.error("Forgot API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendEmail(to: string, subject: string, text: string) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — email not sent");
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'KickScan <noreply@kickscan.io>',
        to: [to],
        subject,
        text
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      // Fallback: try with Resend's default domain
      const res2 = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'KickScan <onboarding@resend.dev>',
          to: [to],
          subject,
          text
        })
      });
      if (!res2.ok) {
        console.error("Resend fallback error:", await res2.text());
      }
    }
  } catch (err) {
    console.error("Email send failed:", err);
  }
}
