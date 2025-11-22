/**
 * AEKA Mobilya Kick-off Template
 *
 * Mobilya üretim sektörü için hazırlanmış kick-off template'i.
 * Departmanlar, görevler, takvim olayları ve proje fazları içerir.
 */

import type { ExtendedKickoffTemplateData } from '@/lib/types/kickoff-template'

export const aekaMobilyaKickoffTemplate: ExtendedKickoffTemplateData = {
  companyName: 'AEKA Mobilya',

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
      priority: 2,
      phase: 1,
    },
    {
      name: 'Quality',
      technical_name: 'quality',
      category: 'quality',
      priority: 2,
      phase: 1,
    },
    {
      name: 'Warehouse',
      technical_name: 'stock',
      category: 'warehouse',
      priority: 2,
      phase: 1,
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
      name: 'Sales',
      technical_name: 'sale',
      category: 'sales',
      priority: 3,
      phase: 2,
    },
    {
      name: 'After Sales Support',
      technical_name: 'helpdesk',
      category: 'support',
      priority: 4,
      phase: 2,
    },
  ],

  // Departmanlar ve Görevler
  departments: [
    {
      name: 'Üretim',
      technical_name: 'production',
      description: 'Üretim süreçleri, BOM yönetimi, üretim planlaması',
      manager_role_title: 'Üretim Müdürü',
      responsibilities: [
        'Ürün BOM listelerini hazırlamak',
        'Üretim süreçlerini dokümante etmek',
        'Üretim rotalarını tanımlamak',
        'Kapasite planlaması yapmak',
      ],
      tasks: [
        {
          title: 'Ürün BOM listesi hazırlama',
          description:
            'Tüm ürünler için malzeme listesi (Bill of Materials) hazırlanması. Her ürün için hammadde, yarı mamul ve mamul malzemelerin listelenmesi.',
          type: 'data_collection',
          priority: 'critical',
          due_days: 7,
          estimated_hours: 16,
          required_documents: [
            {
              name: 'BOM Listesi',
              description: 'Tüm ürünler için malzeme listesi',
              template_url: '/templates/bom_template.xlsx',
              required: true,
              format: ['xlsx', 'csv'],
              validation: {
                min_rows: 10,
                required_columns: ['Ürün Kodu', 'Malzeme', 'Miktar', 'Birim'],
              },
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: ['inventory'],
        },
        {
          title: 'Üretim süreci dokümantasyonu',
          description:
            'Her ürün için üretim adımlarının detaylı açıklaması. Üretim rotaları, süreler, kalite kontrol noktaları.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Üretim Süreci Dokümanı',
              description: 'Üretim adımları ve süreler',
              required: true,
              format: ['pdf', 'docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Ürün BOM listesi hazırlama'],
          collaborator_departments: ['quality'],
        },
        {
          title: 'Üretim rotalarını tanımlama',
          description:
            'Odoo MRP modülünde üretim rotalarının (routing) tanımlanması. İş merkezleri, operasyonlar, süreler.',
          type: 'data_collection',
          priority: 'high',
          due_days: 12,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Üretim Rotaları Listesi',
              description: 'İş merkezleri ve operasyonlar',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Üretim süreci dokümantasyonu'],
          collaborator_departments: [],
        },
        {
          title: 'Kapasite planlaması verileri',
          description:
            'Üretim kapasitesi, makine saatleri, çalışan sayıları gibi kapasite planlama için gerekli veriler.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 14,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'Kapasite Verileri',
              description: 'Makine ve iş merkezi kapasiteleri',
              required: false,
              format: ['xlsx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Üretim rotalarını tanımlama'],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Üretim Ekibi Kick-off Toplantısı',
          description:
            'Proje tanıtımı, beklentiler, sorumluluklar. Üretim ekibinin projeye dahil edilmesi.',
          event_type: 'meeting',
          duration_minutes: 90,
          day_offset: 1,
          attendees: ['manager', 'consultant', 'team'],
        },
        {
          title: 'BOM Review Toplantısı',
          description: 'Hazırlanan BOM listelerinin incelenmesi, eksiklerin tespiti, düzeltmeler.',
          event_type: 'review',
          duration_minutes: 120,
          day_offset: 8,
          attendees: ['manager', 'consultant'],
        },
        {
          title: 'Üretim Rotaları Review',
          description: 'Tanımlanan üretim rotalarının gözden geçirilmesi.',
          event_type: 'review',
          duration_minutes: 90,
          day_offset: 13,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['mrp', 'mrp_bom', 'mrp_workorder'],
    },
    {
      name: 'Stok/Depo',
      technical_name: 'inventory',
      description: 'Stok yönetimi, depo operasyonları, envanter takibi',
      manager_role_title: 'Stok/Depo Sorumlusu',
      responsibilities: [
        'Stok seviyelerini belirlemek',
        'Depo yerleşim planını hazırlamak',
        'Envanter sayım süreçlerini tanımlamak',
        'Hammadde/yarı mamul/mamul stok takibi',
      ],
      tasks: [
        {
          title: 'Stok seviyeleri belirleme',
          description:
            'Her ürün için minimum, maksimum ve yeniden sipariş seviyelerinin belirlenmesi.',
          type: 'data_collection',
          priority: 'high',
          due_days: 8,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Stok Seviyeleri Listesi',
              description: 'Ürün bazlı stok seviyeleri',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Ürün BOM listesi hazırlama'],
          collaborator_departments: ['production'],
        },
        {
          title: 'Depo yerleşim planı hazırlama',
          description: 'Depo içi yerleşim planı, lokasyon kodları, stok alanlarının tanımlanması.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 10,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'Depo Yerleşim Planı',
              description: 'Depo haritası ve lokasyon kodları',
              required: true,
              format: ['pdf', 'xlsx'],
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Envanter sayım süreçleri',
          description: 'Periyodik envanter sayım süreçlerinin tanımlanması, sayım takvimi.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 12,
          estimated_hours: 4,
          required_documents: [
            {
              name: 'Envanter Sayım Planı',
              description: 'Sayım takvimi ve süreçleri',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Depo yerleşim planı hazırlama'],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Stok/Depo Ekibi Toplantısı',
          description: 'Stok yönetimi süreçleri ve beklentiler.',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 2,
          attendees: ['manager', 'consultant'],
        },
        {
          title: 'Depo Yerleşim Planı Review',
          description: 'Depo yerleşim planının gözden geçirilmesi.',
          event_type: 'review',
          duration_minutes: 60,
          day_offset: 11,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['stock', 'stock_account'],
    },
    {
      name: 'Satınalma',
      technical_name: 'purchasing',
      description: 'Tedarikçi yönetimi, satınalma süreçleri, sipariş takibi',
      manager_role_title: 'Satınalma Sorumlusu',
      responsibilities: [
        'Tedarikçi listesini hazırlamak',
        'Satınalma süreçlerini dokümante etmek',
        'Fiyat listelerini toplamak',
        'Sipariş takip süreçlerini tanımlamak',
      ],
      tasks: [
        {
          title: 'Tedarikçi listesi hazırlama',
          description: 'Tüm tedarikçilerin listesi, iletişim bilgileri, ürün kategorileri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 5,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Tedarikçi Listesi',
              description: 'Tedarikçi bilgileri ve ürün kategorileri',
              template_url: '/templates/supplier_template.xlsx',
              required: true,
              format: ['xlsx', 'csv'],
              validation: {
                min_rows: 5,
                required_columns: ['Tedarikçi Adı', 'İletişim', 'Ürün Kategorisi'],
              },
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Fiyat listelerini toplama',
          description:
            'Tedarikçilerden güncel fiyat listelerinin toplanması ve sisteme aktarılması.',
          type: 'data_collection',
          priority: 'high',
          due_days: 9,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Fiyat Listeleri',
              description: 'Tedarikçi fiyat listeleri',
              required: true,
              format: ['xlsx', 'pdf'],
            },
          ],
          requires_approval: true,
          depends_on: ['Tedarikçi listesi hazırlama'],
          collaborator_departments: [],
        },
        {
          title: 'Satınalma süreçleri dokümantasyonu',
          description: 'Satınalma siparişi onay süreçleri, limitler, yetkilendirmeler.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 11,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'Satınalma Süreçleri',
              description: 'Onay süreçleri ve limitler',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Tedarikçi listesi hazırlama'],
          collaborator_departments: ['finance'],
        },
      ],
      calendar_events: [
        {
          title: 'Satınalma Ekibi Toplantısı',
          description: 'Satınalma süreçleri ve beklentiler.',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 2,
          attendees: ['manager', 'consultant'],
        },
        {
          title: 'Tedarikçi Listesi Review',
          description: 'Tedarikçi listesinin gözden geçirilmesi.',
          event_type: 'review',
          duration_minutes: 60,
          day_offset: 6,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['purchase', 'purchase_stock'],
    },
    {
      name: 'Kalite',
      technical_name: 'quality',
      description: 'Kalite kontrol süreçleri, test prosedürleri, kalite standartları',
      manager_role_title: 'Kalite Müdürü',
      responsibilities: [
        'Kalite kontrol noktalarını belirlemek',
        'Test prosedürlerini dokümante etmek',
        'Kalite standartlarını tanımlamak',
        'İade kalite kontrol süreçleri',
      ],
      tasks: [
        {
          title: 'Kalite kontrol noktaları belirleme',
          description: 'Üretim sürecindeki kalite kontrol noktalarının belirlenmesi.',
          type: 'data_collection',
          priority: 'high',
          due_days: 9,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Kalite Kontrol Noktaları',
              description: 'Kontrol noktaları ve kriterleri',
              required: true,
              format: ['xlsx', 'docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Üretim süreci dokümantasyonu'],
          collaborator_departments: ['production'],
        },
        {
          title: 'Test prosedürleri dokümantasyonu',
          description: 'Her ürün için test prosedürlerinin detaylı açıklaması.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 11,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'Test Prosedürleri',
              description: 'Ürün bazlı test prosedürleri',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Kalite kontrol noktaları belirleme'],
          collaborator_departments: [],
        },
        {
          title: 'İade kalite kontrol süreçleri',
          description: 'Müşteri iadeleri için kalite kontrol süreçlerinin tanımlanması.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 13,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'İade Kalite Kontrol Süreçleri',
              description: 'İade muayene formu ve süreçleri',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: ['customer_service'],
        },
      ],
      calendar_events: [
        {
          title: 'Kalite Ekibi Toplantısı',
          description: 'Kalite kontrol süreçleri ve beklentiler.',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 3,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['quality', 'quality_control'],
    },
    {
      name: 'Finans',
      technical_name: 'finance',
      description: 'Muhasebe, finansal raporlama, maliyet hesaplama',
      manager_role_title: 'Finans Müdürü',
      responsibilities: [
        'Muhasebe planını hazırlamak',
        'Maliyet merkezlerini tanımlamak',
        'Finansal rapor gereksinimlerini belirlemek',
        'Maliyet hesaplama yöntemlerini tanımlamak',
      ],
      tasks: [
        {
          title: 'Muhasebe planı hazırlama',
          description: 'Muhasebe hesap planının hazırlanması veya mevcut planın kontrolü.',
          type: 'data_collection',
          priority: 'high',
          due_days: 6,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Muhasebe Planı',
              description: 'Hesap planı ve açıklamalar',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Maliyet merkezleri tanımlama',
          description: 'Maliyet merkezlerinin belirlenmesi ve maliyet dağıtım kuralları.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 10,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'Maliyet Merkezleri',
              description: 'Maliyet merkezleri listesi',
              required: false,
              format: ['xlsx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Muhasebe planı hazırlama'],
          collaborator_departments: [],
        },
        {
          title: 'Finansal rapor gereksinimleri',
          description: 'İhtiyaç duyulan finansal raporların listelenmesi ve özellikleri.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 12,
          estimated_hours: 4,
          required_documents: [
            {
              name: 'Rapor Gereksinimleri',
              description: 'İhtiyaç duyulan raporlar listesi',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Finans Ekibi Toplantısı',
          description: 'Muhasebe ve finansal süreçler.',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 2,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['account_accountant', 'account_cost_center'],
    },
    {
      name: 'İK',
      technical_name: 'hr',
      description: 'İnsan kaynakları, personel yönetimi, bordro',
      manager_role_title: 'İK Müdürü',
      responsibilities: [
        'Personel listesini hazırlamak',
        'Organizasyon şemasını oluşturmak',
        'Bordro süreçlerini tanımlamak',
        'İzin ve devamsızlık takibi',
      ],
      tasks: [
        {
          title: 'Personel listesi hazırlama',
          description: 'Tüm personelin listesi, pozisyonlar, departmanlar, iletişim bilgileri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 4,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Personel Listesi',
              description: 'Personel bilgileri ve pozisyonlar',
              template_url: '/templates/employee_template.xlsx',
              required: true,
              format: ['xlsx', 'csv'],
              validation: {
                min_rows: 5,
                required_columns: ['Ad Soyad', 'Pozisyon', 'Departman', 'Email'],
              },
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Organizasyon şeması oluşturma',
          description:
            'Firma organizasyon şemasının oluşturulması, hiyerarşi, raporlama ilişkileri.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 7,
          estimated_hours: 4,
          required_documents: [
            {
              name: 'Organizasyon Şeması',
              description: 'Organizasyon yapısı ve hiyerarşi',
              required: false,
              format: ['pdf', 'docx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Personel listesi hazırlama'],
          collaborator_departments: [],
        },
        {
          title: 'Bordro süreçleri tanımlama',
          description: 'Bordro hesaplama süreçleri, primler, kesintiler, ödeme yöntemleri.',
          type: 'data_collection',
          priority: 'low',
          due_days: 14,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'Bordro Süreçleri',
              description: 'Bordro hesaplama kuralları',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: ['Personel listesi hazırlama'],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'İK Ekibi Toplantısı',
          description: 'İK süreçleri ve beklentiler.',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 2,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['hr', 'hr_payroll'],
    },
    {
      name: 'Satış/E-ticaret',
      technical_name: 'sales',
      description: 'Satış süreçleri, Trendyol entegrasyonu, müşteri yönetimi',
      manager_role_title: 'Satış/E-ticaret Sorumlusu',
      responsibilities: [
        'Müşteri listesini hazırlamak',
        'Fiyat listelerini hazırlamak',
        'Trendyol süreçlerini dokümante etmek',
        'Satış süreçlerini tanımlamak',
      ],
      tasks: [
        {
          title: 'Müşteri listesi hazırlama',
          description: 'Mevcut müşterilerin listesi, iletişim bilgileri, sipariş geçmişi.',
          type: 'data_collection',
          priority: 'high',
          due_days: 5,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Müşteri Listesi',
              description: 'Müşteri bilgileri ve sipariş geçmişi',
              template_url: '/templates/customer_template.xlsx',
              required: true,
              format: ['xlsx', 'csv'],
              validation: {
                min_rows: 10,
                required_columns: ['Müşteri Adı', 'İletişim', 'Adres'],
              },
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Fiyat listesi hazırlama',
          description: 'Ürün fiyat listesi, müşteri bazlı fiyatlandırma, kampanyalar.',
          type: 'data_collection',
          priority: 'high',
          due_days: 8,
          estimated_hours: 10,
          required_documents: [
            {
              name: 'Fiyat Listesi',
              description: 'Ürün bazlı fiyatlandırma',
              required: true,
              format: ['xlsx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Müşteri listesi hazırlama'],
          collaborator_departments: [],
        },
        {
          title: 'Trendyol süreçleri dokümantasyonu',
          description: 'Trendyol sipariş alma, stok senkronizasyonu, kargo entegrasyonu süreçleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'Trendyol Süreçleri',
              description: 'Trendyol iş akışları ve entegrasyon noktaları',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: ['Fiyat listesi hazırlama'],
          collaborator_departments: ['inventory'],
        },
      ],
      calendar_events: [
        {
          title: 'Satış/E-ticaret Ekibi Toplantısı',
          description: 'Satış süreçleri ve Trendyol entegrasyonu.',
          event_type: 'meeting',
          duration_minutes: 90,
          day_offset: 2,
          attendees: ['manager', 'consultant'],
        },
        {
          title: 'Trendyol Süreçleri Review',
          description: 'Trendyol süreçlerinin gözden geçirilmesi.',
          event_type: 'review',
          duration_minutes: 90,
          day_offset: 11,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['sale', 'sale_stock', 'website_sale'],
    },
    {
      name: 'Müşteri Hizmetleri',
      technical_name: 'customer_service',
      description: 'Müşteri desteği, iade yönetimi, şikayet takibi',
      manager_role_title: 'Müşteri Hizmetleri Sorumlusu',
      responsibilities: [
        'İade süreçlerini dokümante etmek',
        'Müşteri şikayet süreçlerini tanımlamak',
        'Destek süreçlerini hazırlamak',
        'Trendyol mesaj yönetimi',
      ],
      tasks: [
        {
          title: 'İade süreçleri dokümantasyonu',
          description: 'Müşteri iadeleri için süreçler, kalite kontrol, stok işlemleri.',
          type: 'data_collection',
          priority: 'high',
          due_days: 9,
          estimated_hours: 8,
          required_documents: [
            {
              name: 'İade Süreçleri',
              description: 'İade iş akışları ve kuralları',
              required: true,
              format: ['docx'],
            },
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: ['quality', 'inventory'],
        },
        {
          title: 'Müşteri şikayet süreçleri',
          description: 'Şikayet alma, değerlendirme, çözüm süreçleri, Trendyol puan yönetimi.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 11,
          estimated_hours: 6,
          required_documents: [
            {
              name: 'Şikayet Süreçleri',
              description: 'Şikayet yönetim süreçleri',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
        {
          title: 'Trendyol mesaj yönetimi süreçleri',
          description: 'Trendyol müşteri mesajlarının yönetimi, yanıt süreleri, şablonlar.',
          type: 'data_collection',
          priority: 'medium',
          due_days: 12,
          estimated_hours: 4,
          required_documents: [
            {
              name: 'Mesaj Yönetimi Süreçleri',
              description: 'Trendyol mesaj yanıt süreçleri',
              required: false,
              format: ['docx'],
            },
          ],
          requires_approval: false,
          depends_on: [],
          collaborator_departments: [],
        },
      ],
      calendar_events: [
        {
          title: 'Müşteri Hizmetleri Ekibi Toplantısı',
          description: 'Müşteri desteği süreçleri ve beklentiler.',
          event_type: 'meeting',
          duration_minutes: 60,
          day_offset: 3,
          attendees: ['manager', 'consultant'],
        },
      ],
      related_modules: ['helpdesk', 'sale'],
    },
  ],

  // Proje Takvimi
  project_timeline: {
    phases: [
      {
        name: 'Hafta 1: Discovery & Veri Toplama',
        description: 'İlk analizler ve veri toplama',
        duration_days: 7,
        focus_areas: ['Üretim', 'Stok', 'Satınalma'],
        milestones: [
          {
            title: 'İlk Veri Paketi Tamamlandı',
            description: 'BOM, ürün listesi, tedarikçi listesi, personel listesi toplandı',
            day_offset: 5,
            deliverables: ['BOM listesi', 'Ürün kataloğu', 'Tedarikçi listesi', 'Personel listesi'],
            responsible_departments: ['production', 'inventory', 'purchasing', 'hr'],
          },
        ],
      },
      {
        name: 'Hafta 2: Konfigürasyon & Test',
        description: 'Odoo konfigürasyonu ve ilk testler',
        duration_days: 7,
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
      name: 'Personel Template',
      description: 'Personel bilgileri şablonu',
      template_file_url: '/templates/employee_template.xlsx',
      category: 'hr',
    },
    {
      name: 'Müşteri Template',
      description: 'Müşteri bilgileri şablonu',
      template_file_url: '/templates/customer_template.xlsx',
      category: 'customer',
    },
    {
      name: 'Üretim Süreci Şablonu',
      description: 'Üretim adımları dokümantasyon şablonu',
      template_file_url: '/templates/production_process_template.docx',
      category: 'process',
    },
  ],

  // Custom Fields (mevcut yapı)
  customFields: [
    {
      model: 'product.product',
      field_name: 'product_dimensions',
      field_type: 'char',
      label: 'Ürün Ölçüleri (En x Boy x Yükseklik)',
      required: false,
    },
    {
      model: 'product.product',
      field_name: 'coating_type',
      field_type: 'selection',
      label: 'Kaplama Tipi',
      required: false,
      options: {
        selection: [
          ['walnut', 'Ceviz'],
          ['oak', 'Meşe'],
          ['laminate', 'Laminant'],
          ['other', 'Diğer'],
        ],
      },
    },
    {
      model: 'sale.order',
      field_name: 'customer_type',
      field_type: 'selection',
      label: 'Müşteri Tipi',
      required: false,
      options: {
        selection: [
          ['retail', 'Perakende'],
          ['wholesale', 'Toptan'],
        ],
      },
    },
  ],

  // Workflows (mevcut yapı)
  workflows: [
    {
      name: 'Sipariş Onay Süreci',
      model: 'sale.order',
      states: [
        { name: 'draft', label: 'Taslak' },
        { name: 'sent', label: 'Gönderildi' },
        { name: 'to_approve', label: 'Onay Bekliyor' },
        { name: 'sale', label: 'Onaylandı' },
        { name: 'done', label: 'Tamamlandı' },
      ],
      transitions: [
        { from: 'draft', to: 'sent' },
        { from: 'sent', to: 'to_approve', condition: 'amount_total > 10000' },
        { from: 'to_approve', to: 'sale' },
        { from: 'sale', to: 'done' },
      ],
    },
  ],

  // Dashboards (mevcut yapı)
  dashboards: [
    {
      name: 'Üretim Dashboard',
      view_type: 'graph',
      components: [
        {
          type: 'graph',
          model: 'mrp.production',
          domain: [],
          fields: ['state', 'qty_produced'],
        },
      ],
    },
  ],

  // Module Configs (mevcut yapı)
  moduleConfigs: [
    {
      module: 'mrp',
      settings: {
        group_mrp_routings: true,
        group_mrp_workorder: true,
      },
    },
  ],

  // Project Timeline (5 Fazlı Metodoloji)
  project_timeline: {
    phases: [
      {
        name: 'FAZ 0: Pre-Analiz',
        description: "Firma DNA'sını çıkarmak, genel durumu anlamak",
        sequence: 0,
        duration_weeks: 2,
      },
      {
        name: 'FAZ 1: Detaylı Analiz',
        description: 'Her departmanı derinlemesine incelemek',
        sequence: 1,
        duration_weeks: 4,
      },
      {
        name: 'FAZ 2: Blueprint & Tasarım',
        description: "Odoo'da nasıl çalışacağımızı tasarlamak",
        sequence: 2,
        duration_weeks: 2,
      },
      {
        name: 'FAZ 3: Uygulama',
        description: 'Sistemi kurmak, test etmek',
        sequence: 3,
        duration_weeks: 6,
      },
      {
        name: 'FAZ 4: Go-Live & Destek',
        description: 'Eski sistemden yeni sisteme geçmek',
        sequence: 4,
        duration_weeks: 2,
      },
      {
        name: 'Tamamlandı',
        description: 'Tamamlanan görevler',
        sequence: 5,
        duration_weeks: 0,
      },
    ],
    milestones: [
      {
        name: 'Pre-Analiz Raporu Tamamlandı',
        deadline: '2025-11-25',
        description: 'Pre-analiz fazı tamamlandı ve rapor sunuldu',
      },
      {
        name: 'Detaylı Analiz Raporu Tamamlandı',
        deadline: '2025-12-23',
        description: 'Tüm departmanların detaylı analizi tamamlandı',
      },
      {
        name: 'Blueprint Onaylandı',
        deadline: '2026-01-06',
        description: 'Blueprint dokümanı hazırlandı ve onaylandı',
      },
      {
        name: 'UAT Tamamlandı',
        deadline: '2026-02-17',
        description: 'Kullanıcı kabul testleri tamamlandı',
      },
      {
        name: 'Go-Live',
        deadline: '2026-03-03',
        description: 'Sistem canlıya alındı',
      },
    ],
  },

  // Document Templates
  document_templates: [],
}
