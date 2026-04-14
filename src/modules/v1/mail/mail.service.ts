import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.fromEmail = this.config.get<string>('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';
  }

  async sendResetPasswordLink(email: string, firstName: string, resetLink: string) {
    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Spentra — Password Reset Request',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        
        <!-- Logo -->
        <div style="margin-bottom: 24px;">
          <h1 style="color: #10B981; margin: 0;">Spentra</h1>
        </div>

        <!-- Divider -->
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin-bottom: 24px;" />

        <!-- Content -->
        <h2 style="color: #111827;">Password Reset Request</h2>
        <p style="color: #6B7280;">Hi ${firstName},</p>
        <p style="color: #6B7280;">You requested to reset your password. Click the button below to reset it:</p>

        <!-- Button -->
        <a href="${resetLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 6px; margin: 24px 0; font-weight: bold;">
          Reset Password
        </a>

        <!-- Expiry Notice -->
        <p style="color: #6B7280;">This link expires in <strong>15 minutes</strong>.</p>
        <p style="color: #6B7280;">If you did not request this, please ignore this email.</p>

        <!-- Fallback Link -->
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px;">Or copy and paste this link in your browser:</p>
        <p style="color: #9CA3AF; font-size: 12px; word-break: break-all;">${resetLink}</p>

        <!-- Footer -->
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">© 2026 Spentra. All rights reserved.</p>
      </div>
    `,
    });
  }
}
