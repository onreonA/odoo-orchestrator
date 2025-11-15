import { createClient } from '@/lib/supabase/server'

interface MeetingPreparation {
  meetingId: string
  previousMeetingNotes: string[]
  missingInformation: string[]
  questionList: string[]
  relatedDocuments: Array<{ id: string; name: string; url: string }>
  meetingLink?: string
  preparationSummary: string
}

export class MeetingPreparationService {
  private supabase: any

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient()
    }
    return this.supabase
  }

  /**
   * Prepare meeting automatically (24 hours before)
   */
  async prepareMeeting(meetingId: string): Promise<MeetingPreparation> {
    const supabase = await this.getSupabase()
    const { data: meeting } = await supabase
      .from('meeting_requests')
      .select(
        `
        *,
        company:companies(id, name, description),
        consultant:profiles!meeting_requests_consultant_id_fkey(id, full_name),
        requested_by_user:profiles!meeting_requests_requested_by_fkey(id, full_name, email)
      `
      )
      .eq('id', meetingId)
      .single()

    if (!meeting) {
      throw new Error('Meeting not found')
    }

    // Get previous meeting notes
    const previousMeetingNotes = await this.getPreviousMeetingNotes(
      meeting.company_id,
      meeting.consultant_id
    )

    // Get missing information
    const missingInformation = await this.getMissingInformation(meeting.company_id)

    // Generate question list
    const questionList = await this.generateQuestionList(meeting.meeting_type, meeting.company)

    // Get related documents
    const relatedDocuments = await this.getRelatedDocuments(
      meeting.company_id,
      meeting.meeting_type
    )

    // Generate meeting link (Zoom, Google Meet, etc.)
    const meetingLink = await this.generateMeetingLink(meeting)

    // Create preparation summary
    const preparationSummary = this.createPreparationSummary({
      meeting,
      previousMeetingNotes,
      missingInformation,
      questionList,
      relatedDocuments,
    })

    // Store preparation in database
    await this.storePreparation(meetingId, {
      previousMeetingNotes,
      missingInformation,
      questionList,
      relatedDocuments,
      meetingLink,
      preparationSummary,
    })

    return {
      meetingId,
      previousMeetingNotes,
      missingInformation,
      questionList,
      relatedDocuments,
      meetingLink,
      preparationSummary,
    }
  }

  /**
   * Get previous meeting notes for the company
   */
  private async getPreviousMeetingNotes(
    companyId: string,
    consultantId: string
  ): Promise<string[]> {
    const supabase = await this.getSupabase()
    const { data: previousMeetings } = await supabase
      .from('meeting_requests')
      .select('notes, requested_date')
      .eq('company_id', companyId)
      .eq('consultant_id', consultantId)
      .eq('status', 'completed')
      .not('notes', 'is', null)
      .order('requested_date', { ascending: false })
      .limit(5)

    return (previousMeetings || [])
      .filter(m => m.notes)
      .map(m => `[${new Date(m.requested_date).toLocaleDateString('tr-TR')}] ${m.notes}`)
  }

  /**
   * Get missing information for the company
   */
  private async getMissingInformation(companyId: string): Promise<string[]> {
    const supabase = await this.getSupabase()
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    const missing: string[] = []

    if (!company?.description || company.description.length < 50) {
      missing.push('Şirket açıklaması eksik veya yetersiz')
    }

    // Check for projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('company_id', companyId)
      .limit(1)

    if (!projects || projects.length === 0) {
      missing.push('Şirket için henüz proje oluşturulmamış')
    }

    // Check for Odoo instance
    const { data: odooInstance } = await supabase
      .from('odoo_instances')
      .select('id')
      .eq('company_id', companyId)
      .limit(1)

    if (!odooInstance || odooInstance.length === 0) {
      missing.push('Odoo instance bilgisi eksik')
    }

    return missing
  }

  /**
   * Generate question list based on meeting type
   */
  private async generateQuestionList(meetingType: string, company: any): Promise<string[]> {
    const baseQuestions = [
      'Mevcut süreçleriniz nelerdir?',
      'Hangi modülleri kullanıyorsunuz?',
      'En büyük zorluklarınız nelerdir?',
    ]

    const typeSpecificQuestions: Record<string, string[]> = {
      discovery: [
        'İş süreçlerinizi detaylıca anlatabilir misiniz?',
        'Hangi departmanlarınız var?',
        'Mevcut sistemleriniz nelerdir?',
        'Entegrasyon ihtiyaçlarınız var mı?',
      ],
      kickoff: [
        'Proje ekibiniz hazır mı?',
        'Başlangıç tarihi ne zaman?',
        'Bütçe onaylandı mı?',
        'İlk adımlar neler olacak?',
      ],
      review: [
        'Proje ilerlemesi nasıl?',
        'Herhangi bir sorun var mı?',
        'Sonraki adımlar neler?',
        'Ek ihtiyaçlar var mı?',
      ],
      support: [
        'Hangi konuda destek gerekiyor?',
        'Sorunun detayları nelerdir?',
        'Acil mi?',
        'Daha önce benzer bir sorun yaşadınız mı?',
      ],
    }

    return [...baseQuestions, ...(typeSpecificQuestions[meetingType] || [])]
  }

  /**
   * Get related documents
   */
  private async getRelatedDocuments(
    companyId: string,
    meetingType: string
  ): Promise<Array<{ id: string; name: string; url: string }>> {
    // Get documents from projects
    const supabase = await this.getSupabase()
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('company_id', companyId)
      .limit(5)

    const documents: Array<{ id: string; name: string; url: string }> = []

    if (projects) {
      for (const project of projects) {
        documents.push({
          id: project.id,
          name: `Proje: ${project.name}`,
          url: `/projects/${project.id}`,
        })
      }
    }

    // Get discovery documents if available
    if (meetingType === 'discovery') {
      const { data: discoveries } = await supabase
        .from('discoveries')
        .select('id, company_name')
        .eq('company_id', companyId)
        .limit(3)

      if (discoveries) {
        for (const discovery of discoveries) {
          documents.push({
            id: discovery.id,
            name: `Discovery: ${discovery.company_name}`,
            url: `/discoveries/${discovery.id}`,
          })
        }
      }
    }

    return documents
  }

  /**
   * Generate meeting link
   */
  private async generateMeetingLink(meeting: any): Promise<string | undefined> {
    // In production, integrate with Zoom, Google Meet, or Microsoft Teams API
    // For now, return a placeholder
    return `https://meet.example.com/${meeting.id}`
  }

  /**
   * Create preparation summary
   */
  private createPreparationSummary(data: {
    meeting: any
    previousMeetingNotes: string[]
    missingInformation: string[]
    questionList: string[]
    relatedDocuments: Array<{ id: string; name: string; url: string }>
  }): string {
    const { meeting, previousMeetingNotes, missingInformation, questionList, relatedDocuments } =
      data

    const summary = `
Toplantı Hazırlık Özeti
=======================

Toplantı Bilgileri:
- Firma: ${meeting.company?.name}
- Tarih: ${new Date(meeting.requested_date).toLocaleString('tr-TR')}
- Süre: ${meeting.duration_minutes} dakika
- Tür: ${meeting.meeting_type}

${
  previousMeetingNotes.length > 0
    ? `
Geçmiş Toplantı Notları:
${previousMeetingNotes.map((note, i) => `${i + 1}. ${note}`).join('\n')}
`
    : ''
}

${
  missingInformation.length > 0
    ? `
Eksik Bilgiler:
${missingInformation.map((info, i) => `${i + 1}. ${info}`).join('\n')}
`
    : ''
}

${
  questionList.length > 0
    ? `
Sorulacak Sorular:
${questionList.map((q, i) => `${i + 1}. ${q}`).join('\n')}
`
    : ''
}

${
  relatedDocuments.length > 0
    ? `
İlgili Dokümanlar:
${relatedDocuments.map((doc, i) => `${i + 1}. ${doc.name}`).join('\n')}
`
    : ''
}
    `.trim()

    return summary
  }

  /**
   * Store preparation in database
   */
  private async storePreparation(
    meetingId: string,
    preparation: Omit<MeetingPreparation, 'meetingId'>
  ): Promise<void> {
    // Store in meeting_requests table or a separate meeting_preparations table
    // For now, update the meeting_requests table with preparation data
    const supabase = await this.getSupabase()
    await supabase
      .from('meeting_requests')
      .update({
        preparation_data: {
          previousMeetingNotes: preparation.previousMeetingNotes,
          missingInformation: preparation.missingInformation,
          questionList: preparation.questionList,
          relatedDocuments: preparation.relatedDocuments,
          meetingLink: preparation.meetingLink,
          preparationSummary: preparation.preparationSummary,
        },
      })
      .eq('id', meetingId)
  }

  /**
   * Get preparation for a meeting
   */
  async getPreparation(meetingId: string): Promise<MeetingPreparation | null> {
    const supabase = await this.getSupabase()
    const { data: meeting } = await supabase
      .from('meeting_requests')
      .select('preparation_data')
      .eq('id', meetingId)
      .single()

    if (!meeting?.preparation_data) {
      return null
    }

    return {
      meetingId,
      ...meeting.preparation_data,
    }
  }
}

export function getMeetingPreparationService(): MeetingPreparationService {
  return new MeetingPreparationService()
}
