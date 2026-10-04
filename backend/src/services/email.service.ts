import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import logger from '../config/logger';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export const isEmailEnabled = (): boolean => Boolean(env.SMTP_HOST);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface EmailLayoutOptions {
  subject: string;
  headline: string;
  greeting: string;
  bodyHtml: string;
  actionLabel?: string;
  actionUrl?: string;
  noteHtml?: string;
}

/**
 * Shared professional email shell. Deliberately avoids cards, panels and
 * solid-color component backgrounds — content sits directly on a light
 * canvas and the primary action is an outlined button.
 */
function renderLayout({
  subject,
  headline,
  greeting,
  bodyHtml,
  actionLabel,
  actionUrl,
  noteHtml,
}: EmailLayoutOptions): string {
  const action =
    actionLabel && actionUrl
      ? `
          <div style="margin:28px 0 6px;">
            <a
              href="${escapeHtml(actionUrl)}"
              style="display:inline-block;padding:12px 26px;border:1.5px solid #0f766e;border-radius:8px;color:#0f766e;text-decoration:none;font-size:14px;font-weight:700;background:transparent;letter-spacing:0.2px;"
            >${escapeHtml(actionLabel)} &rarr;</a>
            <p style="margin:12px 0 0;font-size:12px;color:#64748b;line-height:1.6;">
              If the button does not work, copy and paste this link into your browser:<br />
              <a href="${escapeHtml(actionUrl)}" style="color:#0f766e;text-decoration:underline;word-break:break-all;">${escapeHtml(actionUrl)}</a>
            </p>
          </div>`
      : '';

  const note =
    noteHtml
      ? `<div style="margin:22px 0 0;font-size:12px;color:#64748b;line-height:1.6;">${noteHtml}</div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <div style="max-width:600px;width:100%;text-align:left;">

          <!-- Brand -->
          <div style="padding-bottom:18px;border-bottom:2px solid #e2e8f0;">
            <span style="font-size:18px;font-weight:800;letter-spacing:-0.3px;color:#0f172a;">Taskmandu</span>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#0f766e;margin-left:6px;vertical-align:middle;"></span>
          </div>

          <!-- Headline -->
          <h1 style="margin:30px 0 8px;font-size:22px;line-height:1.3;font-weight:800;color:#0f172a;">${escapeHtml(headline)}</h1>

          <!-- Greeting -->
          <p style="margin:0 0 14px;font-size:14px;color:#334155;line-height:1.6;">${escapeHtml(greeting)}</p>

          <!-- Body -->
          <div style="font-size:14px;color:#334155;line-height:1.65;">${bodyHtml}</div>

          ${action}
          ${note}

          <!-- Footer -->
          <div style="margin-top:36px;padding-top:16px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
              Taskmandu workforce platform &middot; This message was sent automatically by the Taskmandu system. Please do not reply directly to this email.
            </p>
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendInvitationEmail(options: {
  to: string;
  name: string;
  roleName: string;
  inviteLink: string;
  invitedByName: string;
}): Promise<void> {
  const { to, name, roleName, inviteLink, invitedByName } = options;
  const subject = `You've been invited to Taskmandu as ${roleName}`;
  const text = [
    `Hi ${name},`,
    '',
    `${invitedByName} has invited you to join the Taskmandu workforce platform with the role of ${roleName}.`,
    '',
    `Accept your invitation here: ${inviteLink}`,
    '',
    'If you were not expecting this invitation, you can safely ignore or reject it.',
  ].join('\n');

  const html = renderLayout({
    subject,
    headline: "You're invited to join Taskmandu",
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 6px;">${escapeHtml(invitedByName)} has invited you to join the Taskmandu workforce platform as <strong>${escapeHtml(roleName)}</strong>.</p>
      <p style="margin:0;">Accept the invitation to set up your account and get started.</p>
    `,
    actionLabel: 'Accept Invitation',
    actionUrl: inviteLink,
    noteHtml:
      'If you were not expecting this invitation, you can safely ignore or reject it.',
  });

  const smtp = getTransporter();
  if (!smtp) {
    logger.info(`📧 [DEV] Invitation email for ${to} (${roleName})`);
    logger.info(`🔗 [DEV] Invite link: ${inviteLink}`);
    return;
  }

  await smtp.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  logger.info(`📧 Invitation email queued for ${to}`);
}

export async function sendPasswordResetEmail(options: {
  to: string;
  name: string;
  resetLink: string;
}): Promise<void> {
  const { to, name, resetLink } = options;
  const subject = 'Reset your Taskmandu password';
  const text = [
    `Hi ${name},`,
    '',
    'We received a request to reset your Taskmandu account password.',
    '',
    `Reset your password here: ${resetLink}`,
    '',
    'This link is valid for 30 minutes. If you did not request a reset, you can safely ignore this email.',
  ].join('\n');

  const html = renderLayout({
    subject,
    headline: 'Reset your password',
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0;">We received a request to reset the password for your Taskmandu account. If this was you, use the button below to choose a new password.</p>
    `,
    actionLabel: 'Reset Password',
    actionUrl: resetLink,
    noteHtml:
      'This link is valid for <strong>30 minutes</strong>. If you did not request a reset, you can safely ignore this email &mdash; your password will not change.',
  });

  const smtp = getTransporter();
  if (!smtp) {
    logger.info(`📧 [DEV] Password reset email for ${to}`);
    logger.info(`🔗 [DEV] Reset link: ${resetLink}`);
    return;
  }

  await smtp.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  logger.info(`📧 Password reset email queued for ${to}`);
}

export async function sendTaskAssignmentEmail(options: {
  to: string;
  name: string;
  taskTitle: string;
  projectName: string;
  taskLink: string;
  assignedByName?: string;
}): Promise<void> {
  const { to, name, taskTitle, projectName, taskLink, assignedByName } = options;
  const subject = `Task assigned to you: ${taskTitle}`;
  const text = [
    `Hi ${name},`,
    '',
    `A task has been assigned to you in the project "${projectName}".`,
    '',
    `Task: ${taskTitle}`,
    ...(assignedByName ? [`Assigned by: ${assignedByName}`] : []),
    '',
    `Open the task here: ${taskLink}`,
    '',
    'You can view the full details and update its status from your Taskmandu workspace.',
  ].join('\n');

  const html = renderLayout({
    subject,
    headline: 'You have a new task',
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 6px;">A task has been assigned to you in the project <strong>${escapeHtml(projectName)}</strong>.</p>
      <p style="margin:0 0 10px;"><strong>${escapeHtml(taskTitle)}</strong></p>
      ${assignedByName ? `<p style="margin:0;">Assigned by ${escapeHtml(assignedByName)}.</p>` : ''}
    `,
    actionLabel: 'View Task',
    actionUrl: taskLink,
    noteHtml:
      'Open the task from your Taskmandu workspace to see the full details, add comments, and update its status.',
  });

  const smtp = getTransporter();
  if (!smtp) {
    logger.info(`📧 [DEV] Task assignment email for ${to} (${taskTitle})`);
    logger.info(`🔗 [DEV] Task link: ${taskLink}`);
    return;
  }

  await smtp.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  logger.info(`📧 Task assignment email queued for ${to}`);
}

export async function sendOnboardingActivationEmail(options: {
  to: string;
  name: string;
  acceptLink: string;
}): Promise<void> {
  const { to, name, acceptLink } = options;
  const subject = 'Accept your Taskmandu onboarding invitation';
  const text = [
    `Hi ${name},`,
    '',
    'Your onboarding has been completed and an employee profile has been created for you.',
    '',
    'To create your employee account and join the workforce, please accept your invitation below:',
    '',
    `✅ Accept Invitation: ${acceptLink}`,
    '',
    'You will be asked to create your own password to activate the account.',
    '',
    'If you were not expecting this email, you can safely ignore it.',
  ].join('\n');

  const html = renderLayout({
    subject,
    headline: 'Complete your onboarding',
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 6px;">Your onboarding has been completed and an employee profile has been created for you.</p>
      <p style="margin:0;">Accept the invitation below to create your account and join the workforce.</p>
    `,
    actionLabel: 'Accept Invitation',
    actionUrl: acceptLink,
    noteHtml:
      "You'll be asked to create your own password to activate your account. If you were not expecting this email, you can safely ignore it.",
  });

  const smtp = getTransporter();
  if (!smtp) {
    logger.info(`📧 [DEV] Onboarding activation email for ${to}`);
    logger.info(`🔗 [DEV] Accept link: ${acceptLink}`);
    return;
  }

  await smtp.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
  logger.info(`📧 Onboarding activation email queued for ${to}`);
}

export async function sendProjectMemberEmail(options: {
  to: string[];
  name: string;
  projectName: string;
  projectLink: string;
  addedByName?: string;
}): Promise<void> {
  const { to, name, projectName, projectLink, addedByName } = options;
  const uniqueEmails = [...new Set(to.map((e) => e.trim().toLowerCase()))];
  if (!uniqueEmails.length) return;

  const subject = `You've been added to project "${projectName}"`;
  const text = [
    `Hi ${name},`,
    '',
    `You have been added as a member to the project "${projectName}".`,
    ...(addedByName ? [`Added by: ${addedByName}`] : []),
    '',
    `View the project here: ${projectLink}`,
    '',
    'You can view tasks, documents, and other project details from your Taskmandu workspace.',
  ].join('\n');

  const html = renderLayout({
    subject,
    headline: 'You joined a project',
    greeting: `Hi ${name},`,
    bodyHtml: `
      <p style="margin:0 0 6px;">You have been added as a member to the project <strong>${escapeHtml(projectName)}</strong>.</p>
      ${addedByName ? `<p style="margin:0;">Added by ${escapeHtml(addedByName)}.</p>` : ''}
    `,
    actionLabel: 'View Project',
    actionUrl: projectLink,
    noteHtml:
      'Open the project from your Taskmandu workspace to see tasks, documents, and other details.',
  });

  const smtp = getTransporter();
  if (!smtp) {
    logger.info(`📧 [DEV] Project member email for ${uniqueEmails.join(', ')} (project: ${projectName})`);
    logger.info(`🔗 [DEV] Project link: ${projectLink}`);
    return;
  }

  await smtp.sendMail({
    from: env.SMTP_FROM,
    to: uniqueEmails.join(','),
    subject,
    text,
    html,
  });
  logger.info(`📧 Project member email queued for ${uniqueEmails.join(', ')}`);
}