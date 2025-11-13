# 🎯 ODOO ORCHESTRATOR - YENİ VİZYON SPRINT 8-11

**Tarih:** 13 Kasım 2024  
**Vizyon:** Template-Driven Odoo Deployment & Management Platform  
**Bağımlılık:** Sprint 6-7 tamamlanmalı

---

## 📅 SPRINT 8: TEMPLATE LIBRARY (CORE)

**Süre:** 3-4 hafta  
**Öncelik:** ⭐⭐⭐⭐⭐ (KRİTİK)  
**Durum:** 🆕 Başlanmadı  
**Bağımlılık:** Sprint 6, 7 tamamlanmalı

### **🎯 Amaç:**

Olmazsa olmaz template'leri oluşturmak. AEKA, Şahbaz, FWA'dan çıkardığımız template'leri sisteme eklemek. **Bu sprint olmadan platform kullanılamaz!**

### **🔑 Neden Yapıyoruz?**

1. **Hızlı Başlangıç:** Yeni firma: 0 → Çalışan sistem: 1 gün
2. **Kanıtlanmış Yapılar:** Gerçek firmalardan çıkarıldı
3. **Sektörel Uzmanlık:** Her sektör için özel
4. **Sürekli İyileşme:** Kullanıldıkça gelişir
5. **Competitive Advantage:** Rakiplerden ayıran özellik

### **⚠️ Dikkat Edilecekler:**

1. **Kalite:** Her template test edilmeli
2. **Dokümantasyon:** Kullanım kılavuzu şart
3. **Versiyonlama:** Template güncellemeleri takip edilmeli
4. **Geri Uyumluluk:** Eski template'ler çalışmaya devam etmeli
5. **Preview:** Template önizlemesi olmalı
6. **Customization:** Template özelleştirilebilmeli
7. **Testing:** Her template deploy edilmeden test edilmeli

---

### **📦 Deliverables:**

#### **1. Sektörel Kick-off Template'leri (Hafta 1-2)**

**Oluşturulacak Template'ler:**

**A) Mobilya Kick-off Template (AEKA'dan)**

```typescript
const mobilyaKickoffTemplate: KickoffTemplate = {
  id: 'kickoff-mobilya-v1',
  name: 'Mobilya Üretim & E-Ticaret Kick-off',
  industry: 'furniture',
  subCategory: 'modular_furniture_ecommerce',
  version: '1.0.0',

  description:
    "Modüler mobilya üretimi ve e-ticaret yapan firmalar için kapsamlı kick-off template'i",

  features: [
    'E-ticaret odaklı (Trendyol, N11, Shopify)',
    'Modüler BOM yapısı',
    'İade yönetimi',
    '9 modül analizi',
    '5 fazlı proje planı',
    'Atölye ziyareti checklist',
  ],

  targetCompanies: [
    'Modüler mobilya üreticileri',
    'E-ticaret satış kanalı olan mobilya firmaları',
    'Make-to-order üretim yapan firmalar',
  ],

  requiredOdooModules: [
    'mrp', // Manufacturing
    'stock', // Inventory
    'purchase', // Purchase
    'quality_control', // Quality
    'sale_management', // Sales
    'account', // Accounting
    'hr', // Human Resources
    'website_sale', // E-commerce
    'helpdesk', // Support & Returns
  ],

  modules: [
    {
      name: 'Üretim (MRP)',
      priority: 1,
      estimatedDuration: 7, // gün
      questions: [
        {
          id: 'mrp_1',
          question: 'Üretim tipiniz nedir?',
          type: 'single_choice',
          options: ['Make to Stock', 'Make to Order', 'Karma'],
          required: true,
          helpText: 'Stok için mi üretim yapıyorsunuz yoksa siparişe göre mi?',
        },
        {
          id: 'mrp_2',
          question: 'BOM yapınız nasıl?',
          type: 'single_choice',
          options: ['1 Seviye', '2 Seviye', '3+ Seviye'],
          required: true,
          helpText: 'Kaç seviyeli malzeme ağacınız var?',
        },
        {
          id: 'mrp_3',
          question: 'Üretim operasyonlarınızı listeleyin',
          type: 'multi_line_text',
          required: true,
          placeholder: 'Örn: Kesim, Kenar Bantlama, Delme, Montaj, Paketleme',
          helpText: 'Her satıra bir operasyon yazın',
        },
        {
          id: 'mrp_4',
          question: 'Günlük üretim kapasitesi (adet)?',
          type: 'number',
          required: true,
          min: 1,
          max: 10000,
        },
        {
          id: 'mrp_5',
          question: 'İş merkezleriniz nelerdir?',
          type: 'multi_line_text',
          required: true,
          placeholder: 'Örn: CNC Kesim, Kenar Bant Makinesi, Montaj Hattı',
        },
        // ... 20+ soru daha
      ],

      documents: [
        {
          name: 'BOM Listesi',
          format: 'Excel',
          required: true,
          deadline: 7, // gün
          description: 'Tüm ürünlerin malzeme listeleri',
          template: '/templates/bom-template.xlsx',
          exampleFile: '/examples/bom-example-mobilya.xlsx',
        },
        {
          name: 'Üretim Planı',
          format: 'PDF/Excel',
          required: false,
          deadline: 10,
          description: 'Mevcut üretim planınız (varsa)',
          template: '/templates/production-plan-template.xlsx',
        },
        {
          name: 'İş Merkezi Listesi',
          format: 'Excel',
          required: true,
          deadline: 7,
          description: 'İş merkezleri ve kapasiteleri',
          template: '/templates/work-centers-template.xlsx',
        },
        // ... 12+ belge daha
      ],

      stakeholders: [
        {
          role: 'Üretim Müdürü',
          required: true,
          responsibilities: ['BOM onayı', 'Üretim süreci açıklaması', 'Kapasite bilgisi'],
          meetingCount: 2,
        },
        {
          role: 'Planlama Sorumlusu',
          required: true,
          responsibilities: ['Kapasite bilgisi', 'Üretim planı', 'Stok politikaları'],
          meetingCount: 1,
        },
        {
          role: 'Kalite Sorumlusu',
          required: false,
          responsibilities: ['Kalite kontrol noktaları', 'Test prosedürleri'],
          meetingCount: 1,
        },
      ],
    },

    {
      name: 'Stok Yönetimi',
      priority: 2,
      estimatedDuration: 5,
      questions: [
        {
          id: 'stock_1',
          question: 'Kaç deponuz var?',
          type: 'number',
          required: true,
          min: 1,
          max: 50,
        },
        {
          id: 'stock_2',
          question: 'Stok takip yönteminiz?',
          type: 'single_choice',
          options: ['FIFO', 'LIFO', 'Ortalama Maliyet'],
          required: true,
        },
        {
          id: 'stock_3',
          question: 'Barkod sistemi kullanıyor musunuz?',
          type: 'single_choice',
          options: ['Evet', 'Hayır', 'Kısmen'],
          required: true,
        },
        // ... 15+ soru daha
      ],
      documents: [
        {
          name: 'Depo Listesi',
          format: 'Excel',
          required: true,
          deadline: 7,
          template: '/templates/warehouses-template.xlsx',
        },
        {
          name: 'Mevcut Stok Listesi',
          format: 'Excel',
          required: true,
          deadline: 10,
          template: '/templates/stock-list-template.xlsx',
        },
        // ... 8+ belge daha
      ],
      stakeholders: [
        {
          role: 'Depo Müdürü',
          required: true,
          responsibilities: ['Depo yapısı', 'Stok politikaları'],
          meetingCount: 1,
        },
      ],
    },

    {
      name: 'Satınalma',
      priority: 3,
      estimatedDuration: 4,
      questions: [
        {
          id: 'purchase_1',
          question: 'Kaç tedarikçiniz var?',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          id: 'purchase_2',
          question: 'Satınalma onay süreci nasıl?',
          type: 'multi_line_text',
          required: true,
          placeholder: 'Örn: Talep → Teklif → Onay → Sipariş',
        },
        // ... 12+ soru daha
      ],
      documents: [
        {
          name: 'Tedarikçi Listesi',
          format: 'Excel',
          required: true,
          deadline: 7,
          template: '/templates/suppliers-template.xlsx',
        },
        // ... 6+ belge daha
      ],
      stakeholders: [
        {
          role: 'Satınalma Müdürü',
          required: true,
          responsibilities: ['Tedarikçi yönetimi', 'Satınalma süreci'],
          meetingCount: 1,
        },
      ],
    },

    // ... 6 modül daha (Kalite, Depo, Finans, İK, Satış, İade)
  ],

  phases: [
    {
      name: 'Pre-Analiz',
      duration: 14, // gün
      sequence: 1,
      description: 'Firma ve süreçlerin genel analizi',
      tasks: [
        {
          name: 'Kick-off Toplantısı',
          duration: 1,
          assignee: 'consultant',
          description: 'İlk tanışma ve proje kapsamı belirleme',
          deliverables: ['Toplantı notları', 'Proje kapsamı'],
        },
        {
          name: 'Organizasyon Şeması Alma',
          duration: 1,
          assignee: 'company',
          description: 'Firma organizasyon yapısı',
          deliverables: ['Organizasyon şeması'],
        },
        {
          name: 'Atölye Ziyareti',
          duration: 1,
          assignee: 'consultant',
          description: 'Üretim alanı gezisi ve gözlem',
          deliverables: ['Atölye gözlem raporu', 'Fotoğraflar'],
        },
        {
          name: 'Trendyol Satış Verilerini İnceleme',
          duration: 2,
          assignee: 'consultant',
          description: 'E-ticaret satış analizi',
          deliverables: ['Satış analiz raporu'],
        },
        {
          name: 'Mevcut Sistemler Envanteri',
          duration: 2,
          assignee: 'company',
          description: 'Kullanılan yazılımlar ve süreçler',
          deliverables: ['Sistem envanteri'],
        },
        {
          name: 'Departman Bazlı İlk Toplantılar',
          duration: 5,
          assignee: 'both',
          description: 'Her departmanla ayrı toplantı',
          deliverables: ['Departman raporları'],
        },
        {
          name: 'Pre-Analiz Raporu Hazırlama',
          duration: 2,
          assignee: 'consultant',
          description: 'Kapsamlı analiz raporu',
          deliverables: ['Pre-Analiz Raporu (25-35 sayfa)'],
        },
      ],
      deliverables: ['Pre-Analiz Raporu (25-35 sayfa)'],
      milestones: [
        {
          name: 'Pre-Analiz Tamamlandı',
          deadline: 14,
          criteria: ['Tüm departmanlar görüşüldü', 'Rapor onaylandı'],
        },
      ],
    },

    {
      name: 'Detaylı Analiz',
      duration: 21,
      sequence: 2,
      description: 'Modül bazlı detaylı analiz',
      tasks: [
        {
          name: 'Üretim Modülü Analizi',
          duration: 7,
          assignee: 'both',
          deliverables: ['Üretim analiz raporu', 'BOM listesi'],
        },
        {
          name: 'Stok Modülü Analizi',
          duration: 5,
          assignee: 'both',
          deliverables: ['Stok analiz raporu', 'Depo yapısı'],
        },
        {
          name: 'Satınalma Modülü Analizi',
          duration: 4,
          assignee: 'both',
          deliverables: ['Satınalma analiz raporu'],
        },
        {
          name: 'Diğer Modüller Analizi',
          duration: 5,
          assignee: 'both',
          deliverables: ['Modül raporları'],
        },
      ],
      deliverables: ['Detaylı Analiz Raporu (50-70 sayfa)'],
      milestones: [
        {
          name: 'Tüm Modüller Analiz Edildi',
          deadline: 21,
          criteria: ['9 modül tamamlandı', 'Tüm belgeler toplandı'],
        },
      ],
    },

    {
      name: 'Konfigürasyon',
      duration: 14,
      sequence: 3,
      description: 'Odoo konfigürasyonu ve özelleştirme',
      tasks: [
        {
          name: 'Temel Modüller Kurulumu',
          duration: 2,
          assignee: 'consultant',
          deliverables: ['Kurulu modüller listesi'],
        },
        {
          name: 'BOM Yapısı Oluşturma',
          duration: 5,
          assignee: 'consultant',
          deliverables: ['BOM yapısı', 'Ürün ağacı'],
        },
        {
          name: 'İş Akışları Tanımlama',
          duration: 4,
          assignee: 'consultant',
          deliverables: ['İş akışları', 'Onay süreçleri'],
        },
        {
          name: 'Özel Alanlar ve Raporlar',
          duration: 3,
          assignee: 'consultant',
          deliverables: ['Özel alanlar', 'Raporlar'],
        },
      ],
      deliverables: ['Konfigüre edilmiş Odoo sistemi'],
      milestones: [
        {
          name: 'Konfigürasyon Tamamlandı',
          deadline: 14,
          criteria: ['Tüm modüller aktif', 'Test verileri yüklendi'],
        },
      ],
    },

    {
      name: 'Test & Eğitim',
      duration: 14,
      sequence: 4,
      description: 'Sistem testi ve kullanıcı eğitimi',
      tasks: [
        {
          name: 'Sistem Testi',
          duration: 5,
          assignee: 'consultant',
          deliverables: ['Test raporu', 'Hata listesi'],
        },
        {
          name: 'Kullanıcı Eğitimleri',
          duration: 7,
          assignee: 'consultant',
          description: 'Departman bazlı eğitimler',
          deliverables: ['Eğitim materyalleri', 'Eğitim videoları'],
        },
        {
          name: 'Pilot Çalışma',
          duration: 2,
          assignee: 'both',
          deliverables: ['Pilot raporu'],
        },
      ],
      deliverables: ['Test raporu', 'Eğitim materyalleri'],
      milestones: [
        {
          name: 'Sistem Teste Hazır',
          deadline: 14,
          criteria: ['Tüm testler geçti', 'Kullanıcılar eğitildi'],
        },
      ],
    },

    {
      name: 'Go-Live & Destek',
      duration: 7,
      sequence: 5,
      description: 'Canlıya geçiş ve ilk destek',
      tasks: [
        {
          name: 'Veri Göçü',
          duration: 2,
          assignee: 'consultant',
          deliverables: ['Göç raporu'],
        },
        {
          name: 'Canlıya Geçiş',
          duration: 1,
          assignee: 'both',
          deliverables: ['Go-live raporu'],
        },
        {
          name: 'İlk Hafta Destek',
          duration: 4,
          assignee: 'consultant',
          deliverables: ['Destek raporları'],
        },
      ],
      deliverables: ['Canlı sistem', 'Destek raporları'],
      milestones: [
        {
          name: 'Sistem Canlıda',
          deadline: 7,
          criteria: ['Sistem aktif', 'Kullanıcılar çalışıyor'],
        },
      ],
    },
  ],

  priorityStrategy: 'production_first', // Üretim önce, e-ticaret son

  estimatedDuration: 70, // gün (14 hafta)
  estimatedCost: {
    min: 150000,
    max: 250000,
    currency: 'TRY',
  },

  successCriteria: [
    'Tüm modüller aktif ve çalışıyor',
    'Kullanıcılar sistemi kullanabiliyor',
    'Üretim planlaması yapılabiliyor',
    'Stok takibi yapılabiliyor',
    'E-ticaret entegrasyonu çalışıyor',
  ],

  risks: [
    {
      risk: 'BOM yapısı çok karmaşık',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Erken analiz ve basitleştirme',
    },
    {
      risk: 'E-ticaret entegrasyonu sorunlu',
      probability: 'low',
      impact: 'medium',
      mitigation: 'Test ortamında pilot çalışma',
    },
    {
      risk: 'Kullanıcı direnci',
      probability: 'medium',
      impact: 'high',
      mitigation: 'Kapsamlı eğitim ve destek',
    },
  ],

  metadata: {
    createdFrom: 'AEKA Mobilya',
    createdBy: 'NSL Consulting',
    createdAt: '2024-11-13',
    lastUpdated: '2024-11-13',
    usageCount: 0,
    successRate: 0,
    rating: 0,
    reviews: [],
  },
}
```

**B) Genel Üretim Kick-off Template (Şahbaz'dan)**

```typescript
const genelUretimKickoffTemplate: KickoffTemplate = {
  id: 'kickoff-general-manufacturing-v1',
  name: 'Genel Üretim Kick-off',
  industry: 'manufacturing',
  subCategory: 'general',
  version: '1.0.0',

  description: "Genel üretim yapan firmalar için kapsamlı kick-off template'i",

  features: [
    'Esnek üretim yapısı',
    'Çoklu ürün ailesi desteği',
    'Bakım yönetimi',
    '8 modül analizi',
    '4 fazlı proje planı',
  ],

  // Benzer yapı, farklı modüller ve sorular...
}
```

**C) Hizmet Sektörü Kick-off Template (FWA'dan)**

```typescript
const hizmetKickoffTemplate: KickoffTemplate = {
  id: 'kickoff-service-events-v1',
  name: 'Hizmet Sektörü (Etkinlik) Kick-off',
  industry: 'service',
  subCategory: 'event_management',
  version: '1.0.0',

  description: "Etkinlik yönetimi ve hizmet sektörü firmaları için kick-off template'i",

  features: [
    'Proje bazlı çalışma',
    'Kaynak yönetimi',
    'Müşteri portalı',
    '6 modül analizi',
    '3 fazlı proje planı',
  ],

  // Benzer yapı, hizmet sektörüne özel modüller...
}
```

**Database Schema:**

```sql
-- Template library
CREATE TABLE template_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  template_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'kickoff', 'bom', 'workflow', 'dashboard'
  version TEXT NOT NULL DEFAULT '1.0.0',

  -- Classification
  industry TEXT NOT NULL,
  sub_category TEXT,
  tags TEXT[],

  -- Content
  structure JSONB NOT NULL,
  description TEXT,
  features TEXT[],
  preview_images TEXT[],

  -- Requirements
  required_odoo_modules TEXT[],
  required_odoo_version TEXT DEFAULT '17.0',
  estimated_duration INTEGER,  -- gün
  estimated_cost_min DECIMAL(10,2),
  estimated_cost_max DECIMAL(10,2),

  -- Metadata
  created_from_company UUID REFERENCES companies(id),
  created_from_company_name TEXT,
  created_by UUID REFERENCES profiles(id),

  -- Status
  status TEXT DEFAULT 'draft',  -- 'draft', 'published', 'deprecated'
  is_official BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,

  -- Stats
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_template_library_type ON template_library(type);
CREATE INDEX idx_template_library_industry ON template_library(industry);
CREATE INDEX idx_template_library_status ON template_library(status);
CREATE INDEX idx_template_library_featured ON template_library(is_featured) WHERE is_featured = true;
CREATE INDEX idx_template_library_rating ON template_library(rating DESC NULLS LAST);

-- RLS Policies
ALTER TABLE template_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published templates"
  ON template_library FOR SELECT
  USING (status = 'published');

CREATE POLICY "Super admins manage all templates"
  ON template_library FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );
```

**Çıktı:**

```
✅ 3 sektörel kick-off template hazır
✅ Database schema oluşturuldu
✅ Template validation çalışıyor
✅ Dokümantasyon tamamlandı
```

**Süre:** 80 saat (10 gün)

---

#### **2. BOM Template'leri (Hafta 2)**

**A) Mobilya BOM Template**

```typescript
const mobilyaBOMTemplate: BOMTemplate = {
  id: 'bom-mobilya-modular-v1',
  name: 'Modüler Mobilya BOM Template',
  industry: 'furniture',
  version: '1.0.0',

  description: 'Modüler mobilya üretimi için BOM yapısı',

  structure: {
    levels: 2, // Kaç seviyeli BOM

    materialCategories: [
      {
        name: 'Levha Parçaları',
        code: 'PANEL',
        color: '#3498db',
        description: 'MDF, sunta, kontrplak parçalar',
      },
      {
        name: 'Kenar Bandı',
        code: 'EDGE',
        color: '#e74c3c',
        description: 'PVC, ABS kenar bantları',
      },
      {
        name: 'Aksamlar',
        code: 'FITTING',
        color: '#2ecc71',
        description: 'Menteşe, ray, kulp vb.',
      },
      {
        name: 'Paketleme',
        code: 'PACK',
        color: '#f39c12',
        description: 'Karton, köpük, streç',
      },
    ],

    operations: [
      {
        name: 'Kesim',
        workCenter: 'CNC Kesim',
        duration: 30, // dakika
        sequence: 1,
        qualityCheck: true,
        description: 'Levha kesim işlemi',
      },
      {
        name: 'Kenar Bantlama',
        workCenter: 'Kenar Bant Makinesi',
        duration: 20,
        sequence: 2,
        qualityCheck: false,
        description: 'Kenar bantı yapıştırma',
      },
      {
        name: 'Delme',
        workCenter: 'CNC Delme',
        duration: 15,
        sequence: 3,
        qualityCheck: false,
        description: 'Montaj delikleri',
      },
      {
        name: 'Montaj',
        workCenter: 'Montaj Hattı',
        duration: 45,
        sequence: 4,
        qualityCheck: true,
        description: 'Ürün montajı',
      },
      {
        name: 'Paketleme',
        workCenter: 'Paketleme',
        duration: 20,
        sequence: 5,
        qualityCheck: true,
        description: 'Ürün paketleme',
      },
    ],

    exampleBOM: {
      product: 'Dolap 2 Kapılı 3 Raflı (100x180x50cm)',
      productCode: 'DLP-2K-3R-100180',
      components: [
        {
          category: 'PANEL',
          items: [
            {
              name: 'Yan Panel',
              code: 'YAN-100180',
              quantity: 2,
              uom: 'Adet',
              material: 'MDF 18mm Beyaz Melamin',
              dimensions: '50x180cm',
              cost: 85.5,
            },
            {
              name: 'Üst Panel',
              code: 'UST-10050',
              quantity: 1,
              uom: 'Adet',
              material: 'MDF 18mm Beyaz Melamin',
              dimensions: '100x50cm',
              cost: 42.75,
            },
            {
              name: 'Alt Panel',
              code: 'ALT-10050',
              quantity: 1,
              uom: 'Adet',
              material: 'MDF 18mm Beyaz Melamin',
              dimensions: '100x50cm',
              cost: 42.75,
            },
            {
              name: 'Arka Panel',
              code: 'ARKA-100180',
              quantity: 1,
              uom: 'Adet',
              material: 'MDF 6mm Ham',
              dimensions: '100x180cm',
              cost: 28.5,
            },
            {
              name: 'Kapı',
              code: 'KAPI-50180',
              quantity: 2,
              uom: 'Adet',
              material: 'MDF 18mm Beyaz Melamin',
              dimensions: '50x180cm',
              cost: 85.5,
            },
            {
              name: 'Raf',
              code: 'RAF-10050',
              quantity: 3,
              uom: 'Adet',
              material: 'MDF 18mm Beyaz Melamin',
              dimensions: '100x50cm',
              cost: 42.75,
            },
          ],
        },
        {
          category: 'EDGE',
          items: [
            {
              name: 'PVC Kenar Bandı 18mm Beyaz',
              code: 'KB-18-BYZ',
              quantity: 25,
              uom: 'Metre',
              cost: 1.25,
            },
            {
              name: 'PVC Kenar Bandı 6mm Beyaz',
              code: 'KB-6-BYZ',
              quantity: 5,
              uom: 'Metre',
              cost: 0.75,
            },
          ],
        },
        {
          category: 'FITTING',
          items: [
            {
              name: 'Gizli Menteşe',
              code: 'MNT-GZL',
              quantity: 4,
              uom: 'Adet',
              cost: 3.5,
            },
            {
              name: 'Kulp',
              code: 'KLP-STD',
              quantity: 2,
              uom: 'Adet',
              cost: 8.75,
            },
            {
              name: 'Raf Pimi (32mm)',
              code: 'PIM-32',
              quantity: 12,
              uom: 'Adet',
              cost: 0.25,
            },
            {
              name: 'Ayarlanabilir Ayak',
              code: 'AYK-AYR',
              quantity: 4,
              uom: 'Adet',
              cost: 2.5,
            },
            {
              name: 'Minifix',
              code: 'MNF-STD',
              quantity: 16,
              uom: 'Adet',
              cost: 0.75,
            },
            {
              name: 'Eksantrik',
              code: 'EKS-STD',
              quantity: 16,
              uom: 'Adet',
              cost: 0.5,
            },
          ],
        },
        {
          category: 'PACK',
          items: [
            {
              name: 'Karton Kutu',
              code: 'KRT-L',
              quantity: 1,
              uom: 'Adet',
              cost: 15.0,
            },
            {
              name: 'Köpük Koruma',
              code: 'KPK-L',
              quantity: 4,
              uom: 'Adet',
              cost: 2.5,
            },
            {
              name: 'Streç Film',
              code: 'STR-STD',
              quantity: 1,
              uom: 'Rulo',
              cost: 5.0,
            },
            {
              name: 'Montaj Kılavuzu',
              code: 'KLV-DLP',
              quantity: 1,
              uom: 'Adet',
              cost: 0.5,
            },
          ],
        },
      ],
      totalCost: 485.75,
      productionTime: 130, // dakika
    },
  },

  metadata: {
    createdFrom: 'AEKA Mobilya',
    createdAt: '2024-11-13',
    usageCount: 0,
  },
}
```

**B) Metal BOM Template**

```typescript
const metalBOMTemplate: BOMTemplate = {
  id: 'bom-metal-fabrication-v1',
  name: 'Metal İmalat BOM Template',
  industry: 'metal',
  // Benzer yapı, metal işleme operasyonları...
}
```

**Çıktı:**

```
✅ 2 BOM template hazır
✅ Örnek BOM'lar oluşturuldu
✅ Maliyet hesaplama formülleri
✅ Dokümantasyon tamamlandı
```

**Süre:** 40 saat (5 gün)

---

#### **3. Workflow Template'leri (Hafta 3)**

**A) İade Workflow Template (E-ticaret)**

```typescript
const iadeWorkflowTemplate: WorkflowTemplate = {
  id: 'workflow-ecommerce-return-v1',
  name: 'E-Ticaret İade Yönetimi Workflow',
  industry: 'ecommerce',
  version: '1.0.0',

  description: 'E-ticaret firmaları için kapsamlı iade yönetimi iş akışı',

  stages: [
    {
      name: 'İade Talebi',
      sequence: 1,
      type: 'new',
      color: '#3498db',
      requirements: [],
      automations: [
        {
          trigger: 'on_enter',
          action: 'send_email',
          template: 'return_request_received',
          to: 'customer',
        },
        {
          trigger: 'on_enter',
          action: 'create_task',
          details: {
            title: 'İade talebini incele',
            assignee: 'sales_team',
            deadline: '+1 day',
          },
        },
      ],
      sla: {
        responseTime: 24, // saat
        resolutionTime: 168, // saat (7 gün)
      },
    },
    {
      name: 'İade Onayı',
      sequence: 2,
      type: 'approval',
      color: '#f39c12',
      requirements: [
        'Müşteri bilgileri doğrulandı',
        'İade süresi içinde (14 gün)',
        'Ürün durumu kontrol edildi',
      ],
      approvers: ['Satış Müdürü'],
      automations: [
        {
          trigger: 'on_approve',
          action: 'send_email',
          template: 'return_approved',
          to: 'customer',
        },
        {
          trigger: 'on_approve',
          action: 'create_task',
          details: {
            title: 'Kargo ayarla',
            assignee: 'logistics',
            deadline: '+1 day',
          },
        },
        {
          trigger: 'on_reject',
          action: 'send_email',
          template: 'return_rejected',
          to: 'customer',
        },
      ],
    },
    {
      name: 'Kargo Ayarlama',
      sequence: 3,
      type: 'logistics',
      color: '#9b59b6',
      requirements: [
        'Kargo şirketi seçildi',
        'Toplama tarihi belirlendi',
        'Müşteriye bilgi verildi',
      ],
      automations: [
        {
          trigger: 'on_complete',
          action: 'send_sms',
          template: 'cargo_scheduled',
          to: 'customer',
        },
      ],
    },
    {
      name: 'Ürün Depoda',
      sequence: 4,
      type: 'warehouse',
      color: '#1abc9c',
      requirements: ['Ürün teslim alındı', 'Fotoğraflar çekildi', 'Barkod okutuldu'],
      automations: [
        {
          trigger: 'on_enter',
          action: 'create_task',
          details: {
            title: 'Kalite kontrolü yap',
            assignee: 'quality_team',
            deadline: '+1 day',
          },
        },
      ],
    },
    {
      name: 'Kalite Kontrol',
      sequence: 5,
      type: 'quality',
      color: '#e67e22',
      requirements: ['Hasar kontrolü yapıldı', 'Kullanım kontrolü yapıldı', 'Rapor oluşturuldu'],
      qualityChecks: [
        {
          question: 'Ürün hasarlı mı?',
          type: 'boolean',
          required: true,
        },
        {
          question: 'Ürün kullanılmış mı?',
          type: 'boolean',
          required: true,
        },
        {
          question: 'Tüm parçalar var mı?',
          type: 'boolean',
          required: true,
        },
        {
          question: 'Hasar nedeni?',
          type: 'selection',
          options: ['Üretim hatası', 'Kargo hasarı', 'Müşteri kaynaklı', 'Yok'],
          required: true,
        },
        {
          question: 'Ürün durumu notu',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'Karar',
      sequence: 6,
      type: 'decision',
      color: '#e74c3c',
      options: [
        {
          value: 'accept',
          label: 'Kabul (Para iadesi)',
          nextStage: 'Finansal İşlem',
          conditions: ['Ürün hasarsız', 'İade süresi içinde'],
        },
        {
          value: 'accept_exchange',
          label: 'Kabul (Değişim)',
          nextStage: 'Değişim İşlemi',
          conditions: ['Ürün hasarlı', 'Üretim hatası'],
        },
        {
          value: 'partial',
          label: 'Kısmi Kabul (İndirimli iade)',
          nextStage: 'Finansal İşlem',
          conditions: ['Ürün kullanılmış', 'Hafif hasar'],
        },
        {
          value: 'reject',
          label: 'Red (Müşteriye geri gönder)',
          nextStage: 'Kargo Ayarlama',
          conditions: ['Ürün çok hasarlı', 'Müşteri kaynaklı'],
        },
      ],
      automations: [
        {
          trigger: 'on_decision',
          action: 'send_email',
          template: 'return_decision',
          to: 'customer',
        },
      ],
    },
    {
      name: 'Finansal İşlem',
      sequence: 7,
      type: 'finance',
      color: '#27ae60',
      requirements: ['Para iadesi yapıldı', 'Fatura düzeltildi', 'Muhasebe kaydı yapıldı'],
      automations: [
        {
          trigger: 'on_complete',
          action: 'send_email',
          template: 'refund_completed',
          to: 'customer',
        },
        {
          trigger: 'on_complete',
          action: 'update_accounting',
          details: {
            account: 'returns',
            amount: 'refund_amount',
          },
        },
      ],
    },
    {
      name: 'Stok İşlemi',
      sequence: 8,
      type: 'inventory',
      color: '#16a085',
      options: [
        {
          value: 'resale',
          label: 'Satışa Hazır (A Kalite)',
          location: 'Mamul Deposu',
          stockStatus: 'available',
        },
        {
          value: 'b_grade',
          label: 'B Kalite',
          location: 'B Kalite Deposu',
          stockStatus: 'available',
          priceAdjustment: -20, // %20 indirim
        },
        {
          value: 'scrap',
          label: 'Hurda (Parça olarak kullan)',
          location: 'Hurda',
          stockStatus: 'scrap',
        },
      ],
      automations: [
        {
          trigger: 'on_complete',
          action: 'update_inventory',
          details: {
            updateStock: true,
            updateLocation: true,
          },
        },
      ],
    },
    {
      name: 'Tamamlandı',
      sequence: 9,
      type: 'done',
      color: '#95a5a6',
      fold: true,
      automations: [
        {
          trigger: 'on_enter',
          action: 'send_email',
          template: 'return_completed',
          to: 'customer',
        },
        {
          trigger: 'on_enter',
          action: 'create_survey',
          details: {
            type: 'customer_satisfaction',
            questions: [
              'İade sürecinden memnun kaldınız mı?',
              'Süreç ne kadar sürdü?',
              'İyileştirme önerileriniz',
            ],
          },
        },
        {
          trigger: 'on_enter',
          action: 'update_analytics',
          details: {
            metric: 'return_rate',
            category: 'product_category',
          },
        },
      ],
    },
  ],

  emailTemplates: [
    {
      name: 'return_request_received',
      subject: 'İade Talebiniz Alındı - ${object.name}',
      body: `
        <p>Sayın ${object.partner_id.name},</p>
        <p>İade talebiniz alınmıştır. Talep numaranız: <strong>${object.name}</strong></p>
        <p>İade sürecimiz:</p>
        <ol>
          <li>Talebiniz 24 saat içinde incelenecektir</li>
          <li>Onay sonrası kargo ayarlanacaktır</li>
          <li>Ürün depoya ulaştığında kalite kontrolü yapılacaktır</li>
          <li>İade işlemi 7 iş günü içinde tamamlanacaktır</li>
        </ol>
        <p>Saygılarımızla,<br/>${object.company_id.name}</p>
      `,
    },
    // ... diğer email template'leri
  ],

  metrics: [
    {
      name: 'Ortalama İade Süresi',
      formula: 'AVG(completed_at - created_at)',
      unit: 'gün',
      target: 7,
    },
    {
      name: 'İade Onay Oranı',
      formula: 'COUNT(status=approved) / COUNT(total)',
      unit: '%',
      target: 85,
    },
    {
      name: 'Müşteri Memnuniyeti',
      formula: 'AVG(survey_rating)',
      unit: '/5',
      target: 4.5,
    },
  ],

  metadata: {
    createdFrom: 'AEKA Mobilya',
    createdAt: '2024-11-13',
    usageCount: 0,
  },
}
```

**B) Üretim Onay Workflow**
**C) Satınalma Onay Workflow**

**Çıktı:**

```
✅ 3 workflow template hazır
✅ Email templates oluşturuldu
✅ Automation rules tanımlandı
✅ Metrics hesaplama formülleri
✅ Dokümantasyon tamamlandı
```

**Süre:** 40 saat (5 gün)

---

#### **4. Dashboard Template'leri (Hafta 4)**

**A) Üretim Dashboard Template**

```typescript
const uretimDashboardTemplate: DashboardTemplate = {
  id: 'dashboard-manufacturing-v1',
  name: 'Üretim Dashboard',
  industry: 'manufacturing',
  version: '1.0.0',

  description: 'Üretim yöneticileri için kapsamlı dashboard',

  layout: 'grid', // 'grid' veya 'flex'
  gridColumns: 12,
  gridRows: 10,

  widgets: [
    {
      id: 'production_orders',
      type: 'kpi',
      title: 'Üretim Emirleri',
      position: { row: 1, col: 1, width: 3, height: 2 },
      config: {
        model: 'mrp.production',
        metric: 'count',
        filters: [['state', 'in', ['confirmed', 'progress']]],
        icon: 'factory',
        color: '#3498db',
        comparison: {
          period: 'last_week',
          showTrend: true,
        },
      },
    },
    {
      id: 'capacity_usage',
      type: 'chart',
      title: 'Kapasite Kullanımı',
      position: { row: 1, col: 4, width: 6, height: 4 },
      config: {
        chartType: 'bar',
        model: 'mrp.workcenter',
        xAxis: 'name',
        yAxis: 'capacity_usage_percentage',
        colors: ['#2ecc71', '#f39c12', '#e74c3c'],
        thresholds: [
          { value: 70, color: '#2ecc71', label: 'Normal' },
          { value: 85, color: '#f39c12', label: 'Yüksek' },
          { value: 100, color: '#e74c3c', label: 'Aşırı' },
        ],
        refreshInterval: 300, // saniye
      },
    },
    {
      id: 'delayed_orders',
      type: 'list',
      title: 'Geciken Siparişler',
      position: { row: 3, col: 1, width: 5, height: 4 },
      config: {
        model: 'mrp.production',
        fields: ['name', 'product_id', 'date_planned_start', 'delay_days'],
        filters: [
          ['date_planned_start', '<', 'today'],
          ['state', '!=', 'done'],
        ],
        sortBy: 'delay_days',
        sortOrder: 'desc',
        limit: 10,
        actions: [
          { label: 'Detay', action: 'open_record' },
          { label: 'Yeniden Planla', action: 'reschedule' },
        ],
        rowColors: [
          { condition: 'delay_days > 7', color: '#e74c3c' },
          { condition: 'delay_days > 3', color: '#f39c12' },
        ],
      },
    },
    {
      id: 'quality_issues',
      type: 'kpi',
      title: 'Kalite Sorunları',
      position: { row: 3, col: 6, width: 2, height: 2 },
      config: {
        model: 'quality.check',
        metric: 'count',
        filters: [
          ['quality_state', '=', 'fail'],
          ['create_date', '>=', 'this_week'],
        ],
        icon: 'alert-circle',
        color: '#e74c3c',
        trend: 'down_is_good',
        comparison: {
          period: 'last_week',
          showTrend: true,
        },
      },
    },
    {
      id: 'production_timeline',
      type: 'gantt',
      title: 'Üretim Zaman Çizelgesi',
      position: { row: 5, col: 1, width: 9, height: 5 },
      config: {
        model: 'mrp.production',
        startField: 'date_planned_start',
        endField: 'date_planned_finished',
        labelField: 'name',
        groupBy: 'workcenter_id',
        filters: [['state', 'in', ['confirmed', 'progress']]],
        colors: {
          confirmed: '#3498db',
          progress: '#f39c12',
          done: '#2ecc71',
          late: '#e74c3c',
        },
        showToday: true,
        showWeekends: false,
      },
    },
    {
      id: 'oee_metric',
      type: 'gauge',
      title: 'OEE (Overall Equipment Effectiveness)',
      position: { row: 1, col: 10, width: 3, height: 2 },
      config: {
        model: 'mrp.workcenter.productivity',
        metric: 'oee_percentage',
        min: 0,
        max: 100,
        thresholds: [
          { value: 60, color: '#e74c3c', label: 'Düşük' },
          { value: 75, color: '#f39c12', label: 'Orta' },
          { value: 85, color: '#2ecc71', label: 'İyi' },
          { value: 100, color: '#27ae60', label: 'Mükemmel' },
        ],
        target: 85,
      },
    },
    {
      id: 'material_shortage',
      type: 'alert',
      title: 'Malzeme Eksiklikleri',
      position: { row: 3, col: 8, width: 4, height: 2 },
      config: {
        model: 'stock.move',
        filters: [
          ['state', '=', 'waiting'],
          ['product_uom_qty', '>', 'available_qty'],
        ],
        groupBy: 'product_id',
        sortBy: 'shortage_qty',
        sortOrder: 'desc',
        limit: 5,
        showQuantity: true,
        actions: [{ label: 'Satınalma Talebi Oluştur', action: 'create_purchase_request' }],
      },
    },
    {
      id: 'production_by_product',
      type: 'chart',
      title: 'Ürün Bazlı Üretim',
      position: { row: 5, col: 10, width: 3, height: 3 },
      config: {
        chartType: 'pie',
        model: 'mrp.production',
        groupBy: 'product_id',
        metric: 'count',
        filters: [
          ['create_date', '>=', 'this_month'],
          ['state', 'in', ['confirmed', 'progress', 'done']],
        ],
        limit: 10,
        showLegend: true,
        showPercentage: true,
      },
    },
    {
      id: 'work_order_status',
      type: 'chart',
      title: 'İş Emri Durumu',
      position: { row: 8, col: 10, width: 3, height: 3 },
      config: {
        chartType: 'doughnut',
        model: 'mrp.workorder',
        groupBy: 'state',
        metric: 'count',
        filters: [['create_date', '>=', 'this_week']],
        colors: {
          pending: '#95a5a6',
          ready: '#3498db',
          progress: '#f39c12',
          done: '#2ecc71',
          cancel: '#e74c3c',
        },
        showLegend: true,
      },
    },
  ],

  filters: [
    {
      id: 'date_range',
      type: 'date_range',
      label: 'Tarih Aralığı',
      default: 'this_month',
      options: ['today', 'this_week', 'this_month', 'this_quarter', 'this_year', 'custom'],
    },
    {
      id: 'workcenter',
      type: 'many2one',
      label: 'İş Merkezi',
      model: 'mrp.workcenter',
      multiple: true,
    },
    {
      id: 'product_category',
      type: 'many2one',
      label: 'Ürün Kategorisi',
      model: 'product.category',
      multiple: true,
    },
  ],

  refreshInterval: 300, // saniye (5 dakika)

  permissions: {
    view: ['production_manager', 'production_user'],
    edit: ['production_manager'],
    export: ['production_manager'],
  },

  metadata: {
    createdFrom: 'Best Practices',
    createdAt: '2024-11-13',
    usageCount: 0,
  },
}
```

**B) Satış Dashboard Template**
**C) Stok Dashboard Template**

**Çıktı:**

```
✅ 3 dashboard template hazır
✅ Widget konfigürasyonları
✅ Filter definitions
✅ Permission settings
✅ Dokümantasyon tamamlandı
```

**Süre:** 32 saat (4 gün)

---

### **✅ Sprint 8 Başarı Kriterleri:**

```
✅ 3 sektörel kick-off template hazır
✅ 2 BOM template hazır
✅ 3 workflow template hazır
✅ 3 dashboard template hazır
✅ Template'ler database'de
✅ Preview çalışıyor
✅ Template validation çalışıyor
✅ UI tamamlandı

TEST SENARYOSU:
✅ Mobilya kick-off template'ini seç
✅ Preview'da tüm detayları gör
✅ Template'i AEKA'ya deploy et
✅ Tüm modüller, fazlar, görevler oluşuyor
✅ BOM template'i deploy et
✅ Workflow template'i deploy et
✅ Dashboard görünüyor ve çalışıyor
✅ Template customization çalışıyor
```

**Toplam Süre:** 192 saat (24 gün / 3-4 hafta)

---

## 📅 SPRINT 9: CONSULTANT CALENDAR & FEEDBACK LOOP

**Süre:** 2-3 hafta  
**Öncelik:** ⭐⭐⭐⭐ (YÜKSEK)  
**Durum:** 🆕 Başlanmadı  
**Bağımlılık:** Sprint 6, 7, 8 tamamlanmalı

### **🎯 Amaç:**

Danışman takvimi ve feedback loop sistemi. Danışmanın takvimini firmalarla paylaşmak, randevu almak, deployment sonrası feedback toplamak.

### **🔑 Neden Yapıyoruz?**

1. **Randevu Yönetimi:** Firmalar danışmandan randevu alabilir
2. **Gizlilik:** Danışman hangi bilgileri paylaşacağını seçer
3. **Feedback Loop:** Deployment sonrası sürekli iyileştirme
4. **Template Evolution:** Kullanım verilerinden template'leri iyileştir

### **⚠️ Dikkat Edilecekler:**

1. **Privacy:** Danışman gizliliği korunmalı
2. **Availability:** Müsaitlik otomatik hesaplanmalı
3. **Sync:** Odoo ile senkronizasyon
4. **Feedback Quality:** Kaliteli feedback topla
5. **Analytics:** Feedback'lerden insight çıkar

---

### **📦 Deliverables:**

#### **1. Consultant Calendar System (Hafta 1)**

#### **2. Meeting Request System (Hafta 1-2)**

#### **3. Feedback Collection System (Hafta 2)**

#### **4. Template Evolution Engine (Hafta 3)**

**Detaylar:** (Önceki response'da verilen detaylar burada olacak)

**Toplam Süre:** 120 saat (15 gün / 2-3 hafta)

---

## 📅 SPRINT 10: WEBSITE BUILDER & TRANSLATION

**Süre:** 3-4 hafta  
**Öncelik:** ⭐⭐⭐ (ORTA)  
**Durum:** 🆕 Başlanmadı  
**Bağımlılık:** Sprint 6, 7 tamamlanmalı

### **🎯 Amaç:**

Odoo website builder ve translation management. Firmalar için otomatik website oluşturma ve Türkçe çeviri yönetimi.

### **🔑 Neden Yapıyoruz?**

1. **Website Oluşturma:** Her firma için otomatik website
2. **AI Content:** AI ile içerik oluşturma
3. **Translation:** Odoo'nun Türkçe çevirisi
4. **SEO:** Otomatik SEO optimizasyonu

**Toplam Süre:** 160 saat (20 gün / 3-4 hafta)

---

## 📅 SPRINT 11: TEMPLATE MARKETPLACE & EVOLUTION

**Süre:** 2-3 hafta  
**Öncelik:** ⭐⭐ (DÜŞÜK)  
**Durum:** 🆕 Başlanmadı  
**Bağımlılık:** Sprint 8, 9 tamamlanmalı

### **🎯 Amaç:**

Template marketplace ve sürekli iyileştirme sistemi. Template'leri paylaşma, rating, review ve otomatik iyileştirme.

### **🔑 Neden Yapıyoruz?**

1. **Template Sharing:** Template'leri paylaş
2. **Community:** Topluluk oluştur
3. **Evolution:** Template'ler kendini iyileştirir
4. **Monetization:** Template satışı (opsiyonel)

**Toplam Süre:** 120 saat (15 gün / 2-3 hafta)

---

## 📊 TOPLAM ÖZET (SPRINT 6-11)

**Toplam Süre:** 944 saat (118 gün / ~24 hafta / ~6 ay)

**Sprint Dağılımı:**

- Sprint 6: Odoo Integration Core (192 saat / 3-4 hafta)
- Sprint 7: Auto-Configuration (168 saat / 3 hafta)
- Sprint 8: Template Library (192 saat / 3-4 hafta)
- Sprint 9: Consultant Calendar & Feedback (120 saat / 2-3 hafta)
- Sprint 10: Website Builder & Translation (160 saat / 3-4 hafta)
- Sprint 11: Template Marketplace (120 saat / 2-3 hafta)

**Öncelik Sırası:**

1. ⭐⭐⭐⭐⭐ Sprint 6 (KRİTİK)
2. ⭐⭐⭐⭐⭐ Sprint 7 (KRİTİK)
3. ⭐⭐⭐⭐⭐ Sprint 8 (KRİTİK)
4. ⭐⭐⭐⭐ Sprint 9 (YÜKSEK)
5. ⭐⭐⭐ Sprint 10 (ORTA)
6. ⭐⭐ Sprint 11 (DÜŞÜK)

**Minimum Viable Product (MVP):**

- Sprint 6 + 7 + 8 = **552 saat (69 gün / ~14 hafta / ~3.5 ay)**

---

**Hazırlayan:** AI Assistant  
**Tarih:** 13 Kasım 2024  
**Versiyon:** 2.0 (Yeni Vizyon)
