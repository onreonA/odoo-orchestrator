/**
 * Alert Utility
 * 
 * Send alerts via email, Slack, Discord, etc.
 * Sprint 5 - Monitoring Setup
 */

interface AlertOptions {
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  context?: Record<string, any>
  channel?: 'email' | 'slack' | 'discord'
}

export async function sendAlert(options: AlertOptions): Promise<void> {
  const { severity, message, context, channel = 'slack' } = options

  const alertData = {
    severity,
    message,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }

  try {
    switch (channel) {
      case 'slack':
        await sendSlackAlert(message, alertData)
        break
      case 'discord':
        await sendDiscordAlert(message, alertData)
        break
      case 'email':
        await sendEmailAlert(message, alertData)
        break
    }
  } catch (error) {
    console.error('Failed to send alert:', error)
  }
}

async function sendSlackAlert(message: string, data: any): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured')
    return
  }

  const colorMap: Record<string, string> = {
    low: '#36a64f',
    medium: '#ffa500',
    high: '#ff6347',
    critical: '#8b0000',
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `*${data.severity.toUpperCase()}:* ${message}`,
      attachments: [
        {
          color: colorMap[data.severity] || '#808080',
          fields: Object.entries(data.context || {}).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
          footer: `Environment: ${data.environment}`,
          ts: Math.floor(new Date(data.timestamp).getTime() / 1000),
        },
      ],
    }),
  })
}

async function sendDiscordAlert(message: string, data: any): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL not configured')
    return
  }

  const colorMap: Record<string, number> = {
    low: 0x36a64f,
    medium: 0xffa500,
    high: 0xff6347,
    critical: 0x8b0000,
  }

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: `${data.severity.toUpperCase()}: ${message}`,
          color: colorMap[data.severity] || 0x808080,
          fields: Object.entries(data.context || {}).map(([key, value]) => ({
            name: key,
            value: String(value),
            inline: true,
          })),
          footer: {
            text: `Environment: ${data.environment}`,
          },
          timestamp: data.timestamp,
        },
      ],
    }),
  })
}

async function sendEmailAlert(message: string, data: any): Promise<void> {
  // Email sending implementation
  // This would typically use SendGrid, Resend, or similar service
  const emailServiceUrl = process.env.EMAIL_SERVICE_URL
  if (!emailServiceUrl) {
    console.warn('EMAIL_SERVICE_URL not configured')
    return
  }

  await fetch(emailServiceUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
      subject: `[${data.severity.toUpperCase()}] ${message}`,
      html: `
        <h2>Alert: ${data.severity.toUpperCase()}</h2>
        <p>${message}</p>
        <h3>Context:</h3>
        <pre>${JSON.stringify(data.context, null, 2)}</pre>
        <p><small>Environment: ${data.environment}</small></p>
        <p><small>Timestamp: ${data.timestamp}</small></p>
      `,
    }),
  })
}

