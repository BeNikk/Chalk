// Sending emails through Resend. Without a RESEND_API_KEY (on your laptop and in tests)
// emails are printed in the terminal instead, so you can still click the links.

import { Resend } from 'resend';
import config from '../config.js';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

// Emails "sent" without Resend are also kept here, so tests can read the links in them.
export const sentEmails = [];

export async function sendEmail({ to, subject, text }) {
  if (!resend) {
    sentEmails.push({ to, subject, text });
    if (!config.isTest) {
      console.log(`\n--- Email to ${to}: ${subject} ---\n${text}\n---\n`);
    }
    return;
  }

  const { error } = await resend.emails.send({ from: config.emailFrom, to, subject, text });
  if (error) {
    throw new Error(`Could not send email: ${error.message}`);
  }
}

export function sendVerificationEmail(to, token) {
  const link = `${config.appUrl}/verify.html?token=${token}`;
  return sendEmail({
    to,
    subject: 'Verify your email for Chalk',
    text: `Welcome to Chalk!\n\nClick this link to verify your email:\n${link}\n\nThe link works for 24 hours. If you didn't sign up, you can ignore this email.`,
  });
}

export function sendPasswordResetEmail(to, token) {
  const link = `${config.appUrl}/reset.html?token=${token}`;
  return sendEmail({
    to,
    subject: 'Reset your Chalk password',
    text: `Someone asked to reset the password for your Chalk account.\n\nClick this link to choose a new password:\n${link}\n\nThe link works for 1 hour. If it wasn't you, ignore this email and your password stays the same.`,
  });
}
