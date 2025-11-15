/**
 * Şahbaz Genel Üretim Kick-off Template
 *
 * Genel üretim sektörü için hazırlanmış kick-off template'i.
 * Departmanlar, görevler, takvim olayları ve proje fazları içerir.
 */

import type { ExtendedKickoffTemplateData } from '@/lib/types/kickoff-template'

export const sahbazManufacturingKickoffTemplate: ExtendedKickoffTemplateData = {
  // Modüller
  modules: [
    {
      name: 'Manufacturing (MRP)',
      technical_name: 'mrp',
      category: 'manufacturing',
      priority: 1,
      phase: 1,
    },
    {
      name: 'Inventory',
      technical_name: 'stock',
      category: 'warehouse',
      priority: 1,
      phase: 1,
    },
    {
      name: 'Purchase',
      technical_name: 'purchase',
      category: 'purchase',
      priority: 1,
      phase: 1,
    },
    {
      name: 'Quality Control',
      technical_name: 'quality_control',
      category: 'quality',
      priority: 2,
      phase: 1,
    },
    {
      name: 'Maintenance',
      technical_name: 'maintenance',
      category: 'maintenance',
      priority: 2,
      phase: 1,
    },
    {
      name: 'Sales',
      technical_name: 'sale',
      category: 'sales',
      priority: 2,
      phase: 2,
    },
    {
      name: 'Accounting',
      technical_name: 'account_accountant',
      category: 'accounting',
      priority: 3,
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
      name: 'Project',
      technical_name: 'project',
      category: 'project',
      priority: 3,
      phase: 2,
    },
  ],

  // Departmanlar ve Görevler
  departments: [
    {
      name: 'Üretim',
      technical_name: 'production',
      description: 'Üretim planlaması, üretim süreçleri, kapasite yönetimi',
      manager_role_title: 'Üretim Müdürü',
      responsibilities: [
        'Üretim planlaması yapmak',
        'Kapasite yönetimi',
        'Üretim süreçlerini optimize etmek',
        'Kalite standartlarını uygulamak',
      ],
      tasks: [
        {
          title: 'Üretim kapasitesi analizi',
          description:
            'Mevcut üretim kapasitesinin analizi. Makine parkı, iş gücü, vardiya sistemi, üretim hızları.',
          type: 'data_collection',
          priority: 'critical',
          due_days: 5,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Makine Parkı Listesi',
              description: 'Tüm üretim makineleri ve kapasiteleri',
              template_url: '/templates/machine_capacity_template.xlsx',
              required: true,
              format: ['xlsx', 'csv'],
              validation: {
                min_rows: 5,
                required_columns: ['Makine Adı', 'Kapasite', 'Birim', 'Vardiya'],
              },
            },
            {
              name: 'İş Gücü Analizi',
              description: 'Üretim personeli ve yetkinlikleri',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: ['hr'],
        },
        {
          title: 'Üretim rotalarını tanımlama',
          description:
            'Odoo MRP modülünde üretim rotalarının tanımlanması. İş merkezleri, operasyonlar, süreler, setup süreleri.',
          type: 'data_collection',
          priority: 'critical',
          due_days: 10,
          estimated_hours: 16,
          required_documents: [
            {
              name: 'Üretim Rotaları',
              description: 'Ürün bazlı üretim rotaları ve süreler',
              template_url: '/templates/routing_template.xlsx',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Üretim kapasitesi analizi'],
          collaborator_departments: ['quality'],
        },
        {
          title: 'BOM listelerini hazırlama',
          description:
            'Tüm ürünler için malzeme listesi (Bill of Materials). Hammadde, yarı mamul ve mamul malzemeler.',
          type: 'data_collection',
          priority: 'critical',
          due_days: 12,
          estimated_hours: 20,
          required_documents: [
            {
              name: 'BOM Listesi',
              description: 'Tüm ürünler için malzeme listesi',
              template_url: '/templates/bom_template.xlsx',
              required: true,
              format: ['xlsx', 'csv'],
              validation: {
                min_rows: 20,
                required_columns: ['Ürün Kodu', 'Malzeme', 'Miktar', 'Birim', 'Alternatif Malzeme'],
              },
            },
          ],
          requires_approval: true,
          depends_on: ['Üretim rotalarını tanımlama'],
          collaborator_departments: ['inventory', 'purchasing'],
        },
      ],
      calendar_events: [
        {
          title: 'Üretim Ekibi Toplantısı',
          description: 'Üretim süreçleri ve kapasite planlaması',
          event_type: 'meeting',
          duration_minutes: 90,
          day_offset: 2,
          attendees: ['manager', 'consultant', 'team'],
        },
        {
          title: 'Atölye Ziyareti',
          description: 'Üretim alanının fiziksel incelenmesi',
          event_type: 'meeting',
          duration_minutes: 120,
          day_offset: 4,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['mrp', 'stock', 'quality_control'],
    },
    {
      name: 'Stok & Depo',
      technical_name: 'inventory',
      description: 'Stok yönetimi, depo operasyonları, envanter kontrolü',
      manager_role_title: 'Depo Müdürü',
      responsibilities: [
        'Stok seviyelerini yönetmek',
        'Depo operasyonlarını optimize etmek',
        'Envanter sayımları yapmak',
        'Stok hareketlerini takip etmek',
      ],
      tasks: [
        {
          title: 'Mevcut stok envanteri',
          description:
            'Tüm depolardaki mevcut stokların sayımı ve kaydı. Hammadde, yarı mamul, mamul stokları.',
          type: 'data_collection',
          priority: 'critical',
          due_days: 7,
          estimated_hours: 16,
          required_documents: [
            {
              name: 'Stok Envanter Listesi',
              description: 'Mevcut stoklar ve lokasyonları',
              template_url: '/templates/inventory_template.xlsx',
              required: true,
              format: ['xlsx'],
              validation: {
                min_rows: 50,
                required_columns: ['Malzeme Kodu', 'Malzeme Adı', 'Miktar', 'Birim', 'Lokasyon'],
              },
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: ['production'],
        },
        {
          title: 'Depo lokasyonlarını tanımlama',
          description:
            'Odoo Warehouse modülünde depo ve lokasyon yapısının kurulması. Depo hiyerarşisi, lokasyon kuralları.',
          type: 'data_collection',
          priority: 'high',
          due_days: 8,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Depo Yapısı',
              description: 'Depo ve lokasyon hiyerarşisi',
              required: true,
              format: ['xlsx', 'docx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Mevcut stok envanteri'],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Depo Operasyonları Toplantısı',
          description: 'Stok yönetimi süreçleri ve beklentiler',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 3,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['stock', 'mrp'],
    },
    {
      name: 'Satınalma',
      technical_name: 'purchasing',
      description: 'Tedarikçi yönetimi, satınalma süreçleri, sipariş takibi',
      manager_role_title: 'Satınalma Müdürü',
      responsibilities: [
        'Tedarikçi ilişkilerini yönetmek',
        'Satınalma siparişlerini takip etmek',
        'Fiyat analizleri yapmak',
        'Tedarik sürelerini optimize etmek',
      ],
      tasks: [
        {
          title: 'Tedarikçi listesi hazırlama',
          description:
            'Tüm tedarikçilerin bilgileri, iletişim detayları, performans kayıtları, fiyat listeleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 7,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Tedarikçi Listesi',
              description: 'Tedarikçi bilgileri ve performans kayıtları',
              template_url: '/templates/supplier_template.xlsx',
              required: true,
              format: ['xlsx'],
              validation: {
                min_rows: 10,
                required_columns: [
                  'Tedarikçi Adı',
                  'İletişim',
                  'Ürün Kategorisi',
                  'Ortalama Teslimat Süresi',
                  'Fiyat Listesi',
                ],
              },
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Satınalma onay süreçlerini tanımlama',
          description:
            "Odoo Purchase modülünde satınalma onay workflow'larının kurulması. Onay limitleri, onay zincirleri.",
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Onay Süreçleri',
              description: 'Satınalma onay limitleri ve süreçleri',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Tedarikçi listesi hazırlama'],
          collaborator_departments: ['accounting'],
        },
      ],
      calendar_events: [
        {
          title: 'Satınalma Ekibi Toplantısı',
          description: 'Tedarikçi yönetimi ve satınalma süreçleri',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 5,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['purchase', 'account'],
    },
    {
      name: 'Kalite Kontrol',
      technical_name: 'quality',
      description: 'Kalite standartları, kontrol süreçleri, test prosedürleri',
      manager_role_title: 'Kalite Müdürü',
      responsibilities: [
        'Kalite standartlarını uygulamak',
        'Kalite kontrol süreçlerini yönetmek',
        'Test prosedürlerini tanımlamak',
        'Kalite raporlarını hazırlamak',
      ],
      tasks: [
        {
          title: 'Kalite kontrol noktalarını tanımlama',
          description:
            'Üretim sürecindeki kalite kontrol noktalarının belirlenmesi. Test prosedürleri, kabul kriterleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Kalite Kontrol Noktaları',
              description: 'QC noktaları ve test prosedürleri',
              required: true,
              format: ['docx', 'pdf'],
            },
          ],
          requires_approval: true,
          depends_on: ['Üretim rotalarını tanımlama'],
          collaborator_departments: ['production'],
        },
      ],
      calendar_events: [
        {
          title: 'Kalite Kontrol Toplantısı',
          description: 'Kalite standartları ve süreçleri',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 6,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['quality_control', 'mrp'],
    },
    {
      name: 'Satış',
      technical_name: 'sales',
      description: 'Müşteri yönetimi, satış süreçleri, sipariş takibi',
      manager_role_title: 'Satış Müdürü',
      responsibilities: [
        'Müşteri ilişkilerini yönetmek',
        'Satış siparişlerini takip etmek',
        'Fiyatlandırma stratejileri',
        'Satış raporlarını hazırlamak',
      ],
      tasks: [
        {
          title: 'Müşteri listesi hazırlama',
          description:
            'Tüm müşterilerin bilgileri, sipariş geçmişi, özel fiyatlandırmalar, kredi limitleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 7,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Müşteri Listesi',
              description: 'Müşteri bilgileri ve sipariş geçmişi',
              template_url: '/templates/customer_template.xlsx',
              required: true,
              format: ['xlsx'],
              validation: {
                min_rows: 20,
                required_columns: ['Müşteri Adı', 'İletişim', 'Özel Fiyat', 'Kredi Limiti'],
              },
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Fiyat listesi hazırlama',
          description:
            'Ürün bazlı fiyatlandırma stratejileri. Standart fiyatlar, müşteri bazlı fiyatlar, kampanyalar.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Fiyat Listesi',
              description: 'Ürün fiyatları ve kampanyalar',
              template_url: '/templates/pricelist_template.xlsx',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Müşteri listesi hazırlama'],
          collaborator_departments: ['accounting'],
        },
      ],
      calendar_events: [
        {
          title: 'Satış Ekibi Toplantısı',
          description: 'Satış süreçleri ve müşteri yönetimi',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 4,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['sale', 'account'],
    },
    {
      name: 'Muhasebe',
      technical_name: 'accounting',
      description: 'Mali işler, faturalama, finansal raporlama',
      manager_role_title: 'Mali İşler Müdürü',
      responsibilities: [
        'Faturalama süreçlerini yönetmek',
        'Finansal raporları hazırlamak',
        'Maliyet analizleri yapmak',
        'Bütçe yönetimi',
      ],
      tasks: [
        {
          title: 'Muhasebe planı kurulumu',
          description:
            'Odoo Accounting modülünde hesap planının kurulması. Gelir-gider hesapları, maliyet merkezleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Hesap Planı',
              description: 'Muhasebe hesap planı yapısı',
              required: true,
              format: ['xlsx', 'docx'],
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Mali İşler Toplantısı',
          description: 'Muhasebe süreçleri ve raporlama',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 8,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['account_accountant', 'sale', 'purchase'],
    },
    {
      name: 'İnsan Kaynakları',
      technical_name: 'hr',
      description: 'Personel yönetimi, bordro, izin takibi',
      manager_role_title: 'İK Müdürü',
      responsibilities: [
        'Personel bilgilerini yönetmek',
        'Bordro süreçlerini yönetmek',
        'İzin takibi',
        'Performans değerlendirme',
      ],
      tasks: [
        {
          title: 'Personel listesi hazırlama',
          description:
            'Tüm personelin bilgileri, departman atamaları, yetkinlikler, maaş bilgileri.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 7,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Personel Listesi',
              description: 'Personel bilgileri ve departman atamaları',
              template_url: '/templates/employee_template.xlsx',
              required: true,
              format: ['xlsx'],
              validation: {
                min_rows: 10,
                required_columns: ['Ad Soyad', 'Departman', 'Pozisyon', 'İletişim'],
              },
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'İK Toplantısı',
          description: 'Personel yönetimi süreçleri',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 5,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['hr', 'project'],
    },
  ],

  // Proje Takvimi
  project_timeline: {
    phases: [
      {
        name: 'Hafta 1: Discovery & Veri Toplama',
        description: 'İlk analizler ve veri toplama',
        duration_weeks: 1,
        focus_areas: ['Üretim', 'Stok', 'Satınalma'],
        milestones: [
          {
            title: 'İlk Veri Paketi Tamamlandı',
            description:
              'Kapasite analizi, stok envanteri, tedarikçi listesi, müşteri listesi toplandı',
            day_offset: 7,
            deliverables: [
              'Kapasite analizi',
              'Stok envanteri',
              'Tedarikçi listesi',
              'Müşteri listesi',
              'Personel listesi',
            ],
            responsible_departments: ['production', 'inventory', 'purchasing', 'sales', 'hr'],
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
        focus_areas: ['MRP', 'Quality', 'Accounting'],
        milestones: [
          {
            title: 'MRP Konfigürasyonu Tamamlandı',
            description: "Üretim rotaları, BOM'lar, kapasite planlaması aktif",
            day_offset: 20,
            deliverables: ['MRP konfigürasyonu', 'Test sonuçları'],
            responsible_departments: ['production'],
          },
        ],
      },
    ],
  },

  // Belge Şablonları
  document_templates: [
    {
      name: 'BOM Template',
      description: 'Standart BOM listesi şablonu',
      template_file_url: '/templates/bom_template.xlsx',
      category: 'bom',
    },
    {
      name: 'Tedarikçi Template',
      description: 'Tedarikçi bilgileri şablonu',
      template_file_url: '/templates/supplier_template.xlsx',
      category: 'supplier',
    },
    {
      name: 'Müşteri Template',
      description: 'Müşteri bilgileri şablonu',
      template_file_url: '/templates/customer_template.xlsx',
      category: 'customer',
    },
    {
      name: 'Personel Template',
      description: 'Personel bilgileri şablonu',
      template_file_url: '/templates/employee_template.xlsx',
      category: 'hr',
    },
    {
      name: 'Stok Envanter Template',
      description: 'Stok envanter sayım şablonu',
      template_file_url: '/templates/inventory_template.xlsx',
      category: 'inventory',
    },
    {
      name: 'Üretim Rotaları Template',
      description: 'Üretim rotaları şablonu',
      template_file_url: '/templates/routing_template.xlsx',
      category: 'routing',
    },
  ],

  // Custom Fields
  customFields: [
    {
      model: 'product.product',
      field_name: 'production_lead_time',
      field_type: 'float',
      label: 'Üretim Süresi (Gün)',
      required: false,
    },
    {
      model: 'mrp.workorder',
      field_name: 'setup_time',
      field_type: 'float',
      label: 'Setup Süresi (Dakika)',
      required: false,
    },
    {
      model: 'stock.quant',
      field_name: 'location_zone',
      field_type: 'char',
      label: 'Depo Bölgesi',
      required: false,
    },
  ],

  // Workflows
  workflows: [
    {
      name: 'Satınalma Onay Süreci',
      model: 'purchase.order',
      states: [
        { name: 'draft', label: 'Taslak' },
        { name: 'sent', label: 'Gönderildi' },
        { name: 'to_approve', label: 'Onay Bekliyor' },
        { name: 'purchase', label: 'Onaylandı' },
        { name: 'done', label: 'Tamamlandı' },
        { name: 'cancel', label: 'İptal' },
      ],
      transitions: [
        { from: 'draft', to: 'sent' },
        { from: 'sent', to: 'to_approve', condition: 'amount_total > 10000' },
        { from: 'to_approve', to: 'purchase' },
        { from: 'purchase', to: 'done' },
      ],
    },
    {
      name: 'Üretim Onay Süreci',
      model: 'mrp.production',
      states: [
        { name: 'draft', label: 'Taslak' },
        { name: 'confirmed', label: 'Onaylandı' },
        { name: 'progress', label: 'Üretimde' },
        { name: 'to_close', label: 'Kapatılacak' },
        { name: 'done', label: 'Tamamlandı' },
        { name: 'cancel', label: 'İptal' },
      ],
      transitions: [
        { from: 'draft', to: 'confirmed' },
        { from: 'confirmed', to: 'progress' },
        { from: 'progress', to: 'to_close' },
        { from: 'to_close', to: 'done' },
      ],
    },
  ],

  // Dashboards
  dashboards: [
    {
      name: 'Üretim Dashboard',
      view_type: 'graph',
      components: [
        {
          type: 'graph',
          model: 'mrp.production',
          domain: [],
          fields: ['state', 'product_qty'],
        },
        {
          type: 'kanban',
          model: 'mrp.workorder',
          domain: [],
          fields: ['state', 'name', 'workcenter_id'],
        },
      ],
    },
    {
      name: 'Stok Dashboard',
      view_type: 'graph',
      components: [
        {
          type: 'graph',
          model: 'stock.quant',
          domain: [],
          fields: ['location_id', 'quantity'],
        },
      ],
    },
  ],
}





