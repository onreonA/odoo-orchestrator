import { createClient } from '@/lib/supabase/server'
import { getNotificationService } from './notification-service'

interface MeetingRequest {
  id: string
  consultant_id: string
  company_id: string
  requested_by: string
  requested_date: string
  duration_minutes: number
  meeting_type: string
  notes?: string
  status: string
}

export class MeetingNotificationService {
  private supabase: any

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Send notification when meeting request is created
   */
  async notifyMeetingRequestCreated(meetingId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { data: meeting } = await supabase
      .from('meeting_requests')
      .select(
        `
        *,
        consultant:profiles!meeting_requests_consultant_id_fkey(id, full_name, email),
        company:companies(id, name),
        requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
      `
      )
      .eq('id', meetingId)
      .single()

    if (!meeting) return

    const notificationService = getNotificationService()

    // Notify consultant
    await notificationService.sendNotification({
      userId: meeting.consultant_id,
      title: 'Yeni Randevu Talebi',
      message: `${meeting.company?.name} firmasından randevu talebi geldi`,
      notificationType: 'meeting_request',
      data: {
        meeting_id: meeting.id,
        company_name: meeting.company?.name,
        requested_date: meeting.requested_date,
      },
    })

    // Send email to consultant
    await this.sendMeetingRequestEmail(
      meeting.consultant?.email || '',
      meeting.consultant?.full_name || 'Danışman',
      meeting as any,
      'consultant'
    )
  }

  /**
   * Send notification when meeting request is approved
   */
  async notifyMeetingRequestApproved(meetingId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { data: meeting } = await supabase
      .from('meeting_requests')
      .select(
        `
        *,
        consultant:profiles!meeting_requests_consultant_id_fkey(id, full_name, email),
        company:companies(id, name),
        requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
      `
      )
      .eq('id', meetingId)
      .single()

    if (!meeting) return

    const notificationService = getNotificationService()

    // Notify requester
    await notificationService.sendNotification({
      userId: meeting.requested_by,
      title: 'Randevu Onaylandı',
      message: `${meeting.consultant?.full_name} randevunuzu onayladı`,
      notificationType: 'meeting_approved',
      data: {
        meeting_id: meeting.id,
        consultant_name: meeting.consultant?.full_name,
        requested_date: meeting.requested_date,
      },
    })

    // Send email to requester
    await this.sendMeetingRequestEmail(
      meeting.requested_by_user?.email || '',
      meeting.requested_by_user?.full_name || 'Kullanıcı',
      meeting as any,
      'approved'
    )

    // Send reminder email (24 hours before)
    await this.scheduleMeetingReminder(meetingId, meeting.requested_date)
  }

  /**
   * Send notification when meeting request is rejected
   */
  async notifyMeetingRequestRejected(meetingId: string, reason?: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { data: meeting } = await supabase
      .from('meeting_requests')
      .select(
        `
        *,
        consultant:profiles!meeting_requests_consultant_id_fkey(id, full_name, email),
        company:companies(id, name),
        requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
      `
      )
      .eq('id', meetingId)
      .single()

    if (!meeting) return

    const notificationService = getNotificationService()

    // Notify requester
    await notificationService.sendNotification({
      userId: meeting.requested_by,
      title: 'Randevu Reddedildi',
      message: `${meeting.consultant?.full_name} randevunuzu reddetti`,
      notificationType: 'meeting_rejected',
      data: {
        meeting_id: meeting.id,
        consultant_name: meeting.consultant?.full_name,
        rejection_reason: reason,
      },
    })

    // Send email to requester
    await this.sendMeetingRequestEmail(
      meeting.requested_by_user?.email || '',
      meeting.requested_by_user?.full_name || 'Kullanıcı',
      meeting as any,
      'rejected',
      reason
    )
  }

  /**
   * Send email notification for meeting request
   */
  private async sendMeetingRequestEmail(
    toEmail: string,
    toName: string,
    meeting: MeetingRequest & { consultant?: any; company?: any; requested_by_user?: any },
    type: 'consultant' | 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<void> {
    if (!toEmail) return

    const meetingDate = new Date(meeting.requested_date)
    const formattedDate = meetingDate.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    let subject = ''
    let body = ''

    switch (type) {
      case 'consultant':
        subject = `Yeni Randevu Talebi - ${meeting.company?.name}`
        body = `
          <h2>Yeni Randevu Talebi</h2>
          <p>Merhaba ${toName},</p>
          <p><strong>${meeting.company?.name}</strong> firmasından size randevu talebi geldi:</p>
          <ul>
            <li><strong>Tarih:</strong> ${formattedDate}</li>
            <li><strong>Süre:</strong> ${meeting.duration_minutes} dakika</li>
            <li><strong>Tür:</strong> ${meeting.meeting_type}</li>
            <li><strong>Talep Eden:</strong> ${meeting.requested_by_user?.full_name}</li>
          </ul>
          ${meeting.notes ? `<p><strong>Notlar:</strong> ${meeting.notes}</p>` : ''}
          <p>Randevuyu onaylamak veya reddetmek için platforma giriş yapın.</p>
        `
        break

      case 'approved':
        subject = `Randevu Onaylandı - ${meeting.consultant?.full_name}`
        body = `
          <h2>Randevunuz Onaylandı!</h2>
          <p>Merhaba ${toName},</p>
          <p><strong>${meeting.consultant?.full_name}</strong> randevunuzu onayladı:</p>
          <ul>
            <li><strong>Tarih:</strong> ${formattedDate}</li>
            <li><strong>Süre:</strong> ${meeting.duration_minutes} dakika</li>
            <li><strong>Tür:</strong> ${meeting.meeting_type}</li>
          </ul>
          ${meeting.meeting_link ? `<p><strong>Toplantı Linki:</strong> <a href="${meeting.meeting_link}">${meeting.meeting_link}</a></p>` : ''}
          <p>Toplantıya hazırlanmak için platforma giriş yapabilirsiniz.</p>
        `
        break

      case 'rejected':
        subject = `Randevu Reddedildi - ${meeting.consultant?.full_name}`
        body = `
          <h2>Randevu Reddedildi</h2>
          <p>Merhaba ${toName},</p>
          <p>Maalesef <strong>${meeting.consultant?.full_name}</strong> randevunuzu reddetti:</p>
          <ul>
            <li><strong>Tarih:</strong> ${formattedDate}</li>
            <li><strong>Süre:</strong> ${meeting.duration_minutes} dakika</li>
            <li><strong>Tür:</strong> ${meeting.meeting_type}</li>
          </ul>
          ${rejectionReason ? `<p><strong>Red Nedeni:</strong> ${rejectionReason}</p>` : ''}
          <p>Lütfen başka bir tarih seçerek tekrar deneyin.</p>
        `
        break
    }

    // Use email service to send email
    // For now, we'll use the notification service which might have email integration
    // In production, you would use a proper email service (SendGrid, AWS SES, etc.)
    console.log(`Email would be sent to ${toEmail}:`, { subject, body })

    // TODO: Integrate with actual email service
    // await emailService.sendEmail({
    //   to: toEmail,
    //   subject,
    //   html: body,
    // })
  }

  /**
   * Schedule meeting reminder (24 hours before)
   */
  private async scheduleMeetingReminder(meetingId: string, meetingDate: string): Promise<void> {
    const meetingDateTime = new Date(meetingDate)
    const reminderTime = new Date(meetingDateTime.getTime() - 24 * 60 * 60 * 1000) // 24 hours before

    // Store reminder in database or use a job scheduler
    // For now, we'll just log it
    console.log(`Meeting reminder scheduled for ${reminderTime.toISOString()}`)

    // TODO: Implement actual reminder scheduling (e.g., using cron job or queue)
  }

  /**
   * Send meeting reminder
   */
  async sendMeetingReminder(meetingId: string): Promise<void> {
    const supabase = await this.getSupabase()
    const { data: meeting } = await supabase
      .from('meeting_requests')
      .select(
        `
        *,
        consultant:profiles!meeting_requests_consultant_id_fkey(id, full_name, email),
        company:companies(id, name),
        requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
      `
      )
      .eq('id', meetingId)
      .single()

    if (!meeting || meeting.status !== 'approved') return

    const meetingDate = new Date(meeting.requested_date)
    const formattedDate = meetingDate.toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const notificationService = getNotificationService()

    // Notify both parties
    await notificationService.sendNotification({
      userId: meeting.consultant_id,
      title: 'Toplantı Hatırlatıcısı',
      message: `Yarın ${formattedDate} tarihinde ${meeting.company?.name} ile toplantınız var`,
      notificationType: 'meeting_reminder',
      data: {
        meeting_id: meeting.id,
        meeting_date: meeting.requested_date,
      },
    })

    await notificationService.sendNotification({
      userId: meeting.requested_by,
      title: 'Toplantı Hatırlatıcısı',
      message: `Yarın ${formattedDate} tarihinde ${meeting.consultant?.full_name} ile toplantınız var`,
      notificationType: 'meeting_reminder',
      data: {
        meeting_id: meeting.id,
        meeting_date: meeting.requested_date,
      },
    })
  }
}

export function getMeetingNotificationService(): MeetingNotificationService {
  return new MeetingNotificationService()
}
