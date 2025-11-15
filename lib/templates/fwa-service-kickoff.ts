/**
 * FWA Hizmet Sektörü Kick-off Template
 *
 * Hizmet sektörü için hazırlanmış kick-off template'i.
 * Proje yönetimi, zaman takibi, müşteri ilişkileri odaklı.
 */

import type { ExtendedKickoffTemplateData } from '@/lib/types/kickoff-template'

export const fwaServiceKickoffTemplate: ExtendedKickoffTemplateData = {
  // Modüller
  modules: [
    {
      name: 'Project',
      technical_name: 'project',
      category: 'project',
      priority: 1,
      phase: 1,
    },
    {
      name: 'Timesheet',
      technical_name: 'hr_timesheet',
      category: 'project',
      priority: 1,
      phase: 1,
    },
    {
      name: 'CRM',
      technical_name: 'crm',
      category: 'sales',
      priority: 1,
      phase: 1,
    },
    {
      name: 'Sales',
      technical_name: 'sale',
      category: 'sales',
      priority: 2,
      phase: 1,
    },
    {
      name: 'Accounting',
      technical_name: 'account_accountant',
      category: 'accounting',
      priority: 2,
      phase: 1,
    },
    {
      name: 'Helpdesk',
      technical_name: 'helpdesk',
      category: 'support',
      priority: 2,
      phase: 2,
    },
    {
      name: 'HR',
      technical_name: 'hr',
      category: 'hr',
      priority: 3,
      phase: 2,
    },
    {
      name: 'Website',
      technical_name: 'website',
      category: 'website',
      priority: 3,
      phase: 2,
    },
  ],

  // Departmanlar ve Görevler
  departments: [
    {
      name: 'Proje Yönetimi',
      technical_name: 'project_management',
      description: 'Proje planlama, takip ve yönetimi',
      manager_role_title: 'Proje Müdürü',
      responsibilities: [
        'Proje planlaması yapmak',
        'Proje ilerlemesini takip etmek',
        'Kaynak planlaması',
        'Müşteri iletişimini yönetmek',
      ],
      tasks: [
        {
          title: 'Mevcut proje listesi hazırlama',
          description:
            'Tüm aktif ve geçmiş projelerin listesi. Proje detayları, müşteri bilgileri, bütçeler, zaman çizelgeleri.',
          type: 'data_collection',
          priority: 'critical',
          due_days: 5,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Proje Listesi',
              description: 'Tüm projeler ve detayları',
              template_url: '/templates/project_list_template.xlsx',
              required: true,
              format: ['xlsx'],
              validation: {
                min_rows: 5,
                required_columns: [
                  'Proje Adı',
                  'Müşteri',
                  'Başlangıç Tarihi',
                  'Bitiş Tarihi',
                  'Bütçe',
                ],
              },
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: ['sales'],
        },
        {
          title: 'Proje şablonlarını tanımlama',
          description:
            'Odoo Project modülünde tekrarlayan projeler için şablonların oluşturulması. Görev şablonları, zaman tahminleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 8,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Proje Şablonları',
              description: 'Standart proje şablonları ve görevleri',
              required: true,
              format: ['xlsx', 'docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Mevcut proje listesi hazırlama'],
          collaborator_departments: [],
        },
        {
          title: 'Zaman takip süreçlerini kurma',
          description:
            'Odoo Timesheet modülünde zaman takip kurallarının belirlenmesi. Proje bazlı zaman kaydı, onay süreçleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Zaman Takip Kuralları',
              description: 'Zaman kaydı ve onay süreçleri',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Proje şablonlarını tanımlama'],
          collaborator_departments: ['hr'],
        },
      ],
      calendar_events: [
        {
          title: 'Proje Yönetimi Ekibi Toplantısı',
          description: 'Proje süreçleri ve beklentiler',
          event_type: 'meeting',
          duration_minutes: 90,
          day_offset: 2,
          attendees: ['manager', 'consultant', 'team'],
        },
        {
          title: 'Proje Şablonları İnceleme',
          description: 'Standart proje şablonlarının gözden geçirilmesi',
          event_type: 'review',
          duration_minutes: 60,
          day_offset: 7,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['project', 'hr_timesheet'],
    },
    {
      name: 'Müşteri İlişkileri',
      technical_name: 'customer_relations',
      description: 'CRM, müşteri yönetimi, satış süreçleri',
      manager_role_title: 'Satış Müdürü',
      responsibilities: [
        'Müşteri ilişkilerini yönetmek',
        'Satış fırsatlarını takip etmek',
        'Teklif hazırlamak',
        'Müşteri memnuniyetini ölçmek',
      ],
      tasks: [
        {
          title: 'Müşteri veritabanı hazırlama',
          description:
            'Tüm müşterilerin bilgileri, iletişim geçmişi, proje geçmişi, özel notlar, fırsatlar.',
          type: 'data_collection',
          priority: 'critical',
          due_days: 7,
          estimated_hours: 16,
          required_documents: [
            {
              name: 'Müşteri Veritabanı',
              description: 'Müşteri bilgileri ve geçmiş',
              template_url: '/templates/customer_database_template.xlsx',
              required: true,
              format: ['xlsx'],
              validation: {
                min_rows: 20,
                required_columns: ['Müşteri Adı', 'İletişim', 'Proje Geçmişi', 'Fırsat Durumu'],
              },
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'CRM pipeline kurulumu',
          description:
            "Odoo CRM modülünde satış pipeline'ının kurulması. Aşamalar, kurallar, otomasyonlar.",
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'CRM Pipeline Yapısı',
              description: 'Satış aşamaları ve kuralları',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Müşteri veritabanı hazırlama'],
          collaborator_departments: [],
        },
        {
          title: 'Teklif şablonlarını hazırlama',
          description:
            'Standart teklif şablonlarının oluşturulması. Fiyatlandırma kuralları, şartlar ve koşullar.',
          type: 'data_collection',
          priority: 'high',
          due_days: 12,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Teklif Şablonları',
              description: 'Standart teklif formatları',
              required: true,
              format: ['docx', 'pdf'],
            },
          ],
          requires_approval: true,
          depends_on: ['CRM pipeline kurulumu'],
          collaborator_departments: ['accounting'],
        },
      ],
      calendar_events: [
        {
          title: 'Satış Ekibi Toplantısı',
          description: 'CRM süreçleri ve müşteri yönetimi',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 4,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['crm', 'sale'],
    },
    {
      name: 'Müşteri Desteği',
      technical_name: 'customer_support',
      description: 'Müşteri desteği, ticket yönetimi, sorun çözümü',
      manager_role_title: 'Destek Müdürü',
      responsibilities: [
        'Müşteri sorunlarını çözmek',
        'Ticket yönetimi',
        'SLA takibi',
        'Müşteri memnuniyeti',
      ],
      tasks: [
        {
          title: 'Destek süreçlerini tanımlama',
          description:
            'Müşteri destek süreçlerinin dokümante edilmesi. Ticket kategorileri, öncelikler, SLA kuralları.',
          type: 'data_collection',
          priority: 'high',
          due_days: 8,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Destek Süreçleri',
              description: 'Ticket yönetimi ve SLA kuralları',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Helpdesk kurulumu',
          description:
            'Odoo Helpdesk modülünde ticket yönetim sisteminin kurulması. Kategoriler, takımlar, otomasyonlar.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Helpdesk Yapısı',
              description: 'Ticket kategorileri ve takımlar',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Destek süreçlerini tanımlama'],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Destek Ekibi Toplantısı',
          description: 'Müşteri destek süreçleri ve SLA',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 6,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['helpdesk', 'project'],
    },
    {
      name: 'Muhasebe',
      technical_name: 'accounting',
      description: 'Faturalama, ödeme takibi, finansal raporlama',
      manager_role_title: 'Mali İşler Müdürü',
      responsibilities: [
        'Proje bazlı faturalama',
        'Ödeme takibi',
        'Finansal raporlar',
        'Bütçe yönetimi',
      ],
      tasks: [
        {
          title: 'Faturalama süreçlerini tanımlama',
          description:
            'Proje bazlı faturalama kurallarının belirlenmesi. İlerleme bazlı faturalama, sabit fiyat, zaman bazlı.',
          type: 'data_collection',
          priority: 'high',
          due_days: 8,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Faturalama Kuralları',
              description: 'Proje bazlı faturalama süreçleri',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: ['project_management'],
        },
        {
          title: 'Muhasebe planı kurulumu',
          description:
            'Odoo Accounting modülünde hesap planının kurulması. Gelir-gider hesapları, proje bazlı maliyet takibi.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Hesap Planı',
              description: 'Muhasebe hesap planı yapısı',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Faturalama süreçlerini tanımlama'],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Mali İşler Toplantısı',
          description: 'Faturalama ve muhasebe süreçleri',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 7,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['account_accountant', 'sale', 'project'],
    },
    {
      name: 'İnsan Kaynakları',
      technical_name: 'hr',
      description: 'Personel yönetimi, zaman takibi, performans',
      manager_role_title: 'İK Müdürü',
      responsibilities: [
        'Personel bilgilerini yönetmek',
        'Zaman takibi',
        'Performans değerlendirme',
        'Bordro süreçleri',
      ],
      tasks: [
        {
          title: 'Personel listesi hazırlama',
          description:
            'Tüm personelin bilgileri, departman atamaları, yetkinlikler, proje atamaları.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 5,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Personel Listesi',
              description: 'Personel bilgileri ve atamaları',
              template_url: '/templates/employee_template.xlsx',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Zaman takip kurallarını tanımlama',
          description:
            'Proje bazlı zaman kaydı kurallarının belirlenmesi. Onay süreçleri, raporlama.',
          type: 'data_collection',
          priority: 'high',
          due_days: 8,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Zaman Takip Kuralları',
              description: 'Zaman kaydı ve onay süreçleri',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Personel listesi hazırlama'],
          collaborator_departments: ['project_management'],
        },
      ],
      calendar_events: [
        {
          title: 'İK Toplantısı',
          description: 'Personel yönetimi ve zaman takibi',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 5,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['hr', 'hr_timesheet', 'project'],
    },
  ],

  // Proje Takvimi
  project_timeline: {
    phases: [
      {
        name: 'Hafta 1: Discovery & Veri Toplama',
        description: 'Mevcut süreçlerin analizi ve veri toplama',
        duration_weeks: 1,
        focus_areas: ['Proje Yönetimi', 'Müşteri İlişkileri'],
        milestones: [
          {
            title: 'İlk Veri Paketi Tamamlandı',
            description:
              'Proje listesi, müşteri veritabanı, personel listesi, mevcut süreçler dokümante edildi',
            day_offset: 7,
            deliverables: [
              'Proje listesi',
              'Müşteri veritabanı',
              'Personel listesi',
              'Süreç dokümantasyonu',
            ],
            responsible_departments: ['project_management', 'customer_relations', 'hr'],
          },
        ],
      },
      {
        name: 'Hafta 2: Konfigürasyon & Test',
        description: 'Odoo konfigürasyonu ve ilk testler',
        duration_weeks: 1,
        focus_areas: ['Tüm Departmanlar'],
        milestones: [
          {
            title: 'Pre-Analiz Raporu Sunumu',
            description: 'İlk 2 haftalık çalışmanın sunumu ve aksiyon planı',
            day_offset: 10,
            deliverables: ['Analiz raporu', 'Sunum', 'Aksiyon planı'],
            responsible_departments: ['all'],
          },
        ],
      },
      {
        name: 'Hafta 3-4: Detaylı Konfigürasyon',
        description: 'Detaylı modül konfigürasyonları ve entegrasyonlar',
        duration_weeks: 2,
        focus_areas: ['Project', 'CRM', 'Helpdesk'],
        milestones: [
          {
            title: 'Proje Yönetimi Aktif',
            description: 'Proje modülü ve zaman takibi aktif',
            day_offset: 20,
            deliverables: ['Proje konfigürasyonu', 'Zaman takip sistemi', 'Test sonuçları'],
            responsible_departments: ['project_management'],
          },
        ],
      },
    ],
  },

  // Belge Şablonları
  document_templates: [
    {
      name: 'Proje Listesi Template',
      description: 'Proje bilgileri şablonu',
      template_file_url: '/templates/project_list_template.xlsx',
      category: 'project',
    },
    {
      name: 'Müşteri Veritabanı Template',
      description: 'Müşteri bilgileri şablonu',
      template_file_url: '/templates/customer_database_template.xlsx',
      category: 'customer',
    },
    {
      name: 'Personel Template',
      description: 'Personel bilgileri şablonu',
      template_file_url: '/templates/employee_template.xlsx',
      category: 'hr',
    },
    {
      name: 'Teklif Şablonu',
      description: 'Standart teklif formatı',
      template_file_url: '/templates/quotation_template.docx',
      category: 'sales',
    },
  ],

  // Custom Fields
  customFields: [
    {
      model: 'project.project',
      field_name: 'customer_satisfaction_score',
      field_type: 'float',
      label: 'Müşteri Memnuniyet Skoru',
      required: false,
    },
    {
      model: 'project.task',
      field_name: 'estimated_hours',
      field_type: 'float',
      label: 'Tahmini Süre (Saat)',
      required: false,
    },
    {
      model: 'account.move',
      field_name: 'project_billing_type',
      field_type: 'selection',
      label: 'Faturalama Tipi',
      required: false,
      options: {
        selection: [
          ['fixed', 'Sabit Fiyat'],
          ['time', 'Zaman Bazlı'],
          ['milestone', 'Milestone Bazlı'],
        ],
      },
    },
  ],

  // Workflows
  workflows: [
    {
      name: 'Proje Onay Süreci',
      model: 'project.project',
      states: [
        { name: 'draft', label: 'Taslak' },
        { name: 'in_progress', label: 'Devam Ediyor' },
        { name: 'on_hold', label: 'Beklemede' },
        { name: 'done', label: 'Tamamlandı' },
        { name: 'cancel', label: 'İptal' },
      ],
      transitions: [
        { from: 'draft', to: 'in_progress' },
        { from: 'in_progress', to: 'on_hold' },
        { from: 'on_hold', to: 'in_progress' },
        { from: 'in_progress', to: 'done' },
      ],
    },
    {
      name: 'CRM Fırsat Süreci',
      model: 'crm.lead',
      states: [
        { name: 'new', label: 'Yeni' },
        { name: 'qualified', label: 'Nitelikli' },
        { name: 'proposition', label: 'Teklif' },
        { name: 'won', label: 'Kazanıldı' },
        { name: 'lost', label: 'Kaybedildi' },
      ],
      transitions: [
        { from: 'new', to: 'qualified' },
        { from: 'qualified', to: 'proposition' },
        { from: 'proposition', to: 'won' },
        { from: 'proposition', to: 'lost' },
      ],
    },
  ],

  // Dashboards
  dashboards: [
    {
      name: 'Proje Dashboard',
      view_type: 'graph',
      components: [
        {
          type: 'graph',
          model: 'project.project',
          domain: [],
          fields: ['state', 'budget'],
        },
        {
          type: 'kanban',
          model: 'project.task',
          domain: [],
          fields: ['stage_id', 'name', 'user_id'],
        },
      ],
    },
    {
      name: 'CRM Dashboard',
      view_type: 'graph',
      components: [
        {
          type: 'graph',
          model: 'crm.lead',
          domain: [],
          fields: ['stage_id', 'expected_revenue'],
        },
      ],
    },
  ],
}


