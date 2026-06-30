import * as React from 'react'
import { render } from '@react-email/components'
import { Resend } from 'resend'
import { createFileRoute } from '@tanstack/react-router'
import { SignupEmail } from '@/lib/email-templates/signup'
import { InviteEmail } from '@/lib/email-templates/invite'
import { MagicLinkEmail } from '@/lib/email-templates/magic-link'
import { RecoveryEmail } from '@/lib/email-templates/recovery'
import { EmailChangeEmail } from '@/lib/email-templates/email-change'
import { ReauthenticationEmail } from '@/lib/email-templates/reauthentication'

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirma tu email',
  invite: 'Has sido invitado',
  magiclink: 'Tu enlace de acceso',
  recovery: 'Restablece tu contraseña',
  email_change: 'Confirma tu nuevo email',
  reauthentication: 'Tu código de verificación',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = 'Itineraya'
const ROOT_DOMAIN = 'itineraya.com'
// RESEND_FROM lets you point to a verified domain without redeploying code.
// Defaults to Resend's sandbox sender so emails work out of the box until
// you verify your own domain at https://resend.com/domains.
const FROM_ADDRESS = process.env.RESEND_FROM || 'Itineraya <noreply@itineraya.com>'

function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  return `${localPart[0]}***@${domain}`
}

export const Route = createFileRoute('/email/email/auth/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const resendApiKey = process.env.RESEND_API_KEY
        if (!resendApiKey) {
          console.error('RESEND_API_KEY not configured')
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        let payload: any
        try {
          payload = JSON.parse(await request.text())
        } catch (error) {
          console.error('Webhook parsing failed', { error })
          return Response.json({ error: 'Invalid payload' }, { status: 400 })
        }

        if (!payload?.data?.action_type) {
          return Response.json({ success: true, ignored: true })
        }

        const emailType: string = payload.data.action_type
        const EmailTemplate = EMAIL_TEMPLATES[emailType]
        if (!EmailTemplate) {
          console.error('Unknown email type', { emailType })
          return Response.json({ error: `Unknown email type: ${emailType}` }, { status: 400 })
        }

        const templateProps = {
          siteName: SITE_NAME,
          siteUrl: `https://${ROOT_DOMAIN}`,
          recipient: payload.data.email,
          confirmationUrl: payload.data.url,
          token: payload.data.token,
          email: payload.data.email,
          oldEmail: payload.data.old_email,
          newEmail: payload.data.new_email,
        }

        const element = React.createElement(EmailTemplate, templateProps)
        const html = await render(element)
        const text = await render(element, { plainText: true })

        const resend = new Resend(resendApiKey)
        try {
          const result = await resend.emails.send({
            from: FROM_ADDRESS,
            to: [payload.data.email],
            subject: EMAIL_SUBJECTS[emailType] || 'Notificación',
            html,
            text,
          })
          if ((result as any).error) {
            console.error('Resend send error', {
              emailType,
              email_redacted: redactEmail(payload.data.email),
              error: (result as any).error,
            })
            return Response.json({ error: 'Failed to send email' }, { status: 500 })
          }
          console.log('Auth email sent via Resend', {
            emailType,
            email_redacted: redactEmail(payload.data.email),
          })
          return Response.json({ success: true, sent: true })
        } catch (error) {
          console.error('Resend exception', {
            emailType,
            email_redacted: redactEmail(payload.data.email),
            error: error instanceof Error ? error.message : String(error),
          })
          return Response.json({ error: 'Failed to send email' }, { status: 500 })
        }
      },
    },
  },
})
