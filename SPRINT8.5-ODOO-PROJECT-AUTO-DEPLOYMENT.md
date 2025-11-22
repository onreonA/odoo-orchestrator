# 🎯 SPRINT 8.5: ODOO PROJECT AUTO-DEPLOYMENT FROM KICK-OFF DOCUMENTS

**Tarih:** 16 Kasım 2025  
**Durum:** 🚀 Başlatıldı  
**Süre:** 1-2 gün (8-16 saat)  
**Öncelik:** ⭐⭐⭐⭐⭐ KRİTİK  
**Bağımlılık:** Sprint 8 ✅

---

## 📋 GENEL BAKIŞ

Sprint 8.5'te kick-off dökümanlarından otomatik olarak Odoo'da proje, fazlar (stages) ve görevler (tasks) oluşturulması sistemi geliştirilecek. Bu sayede AEKA, Şahbaz gibi firmalar için hazırlanan kick-off dökümanları tek tıkla Odoo Project modülüne deploy edilebilecek.

---

## 🎯 AMAÇ

Kick-off template'lerini Odoo'ya deploy ederken:
- ✅ Modül kurulumu (mevcut)
- ✅ Custom field oluşturma (mevcut)
- ✅ Workflow deployment (mevcut)
- ✅ Dashboard deployment (mevcut)
- ❌ **Odoo Project oluşturma** (YENİ - Bu sprint'te eklenecek)
- ❌ **Project Stages (Fazlar) oluşturma** (YENİ)
- ❌ **Tasks (Görevler) oluşturma** (YENİ)
- ❌ **Subtasks oluşturma** (YENİ)
- ❌ **Milestones oluşturma** (YENİ)

---

## 📊 MEVCUT DURUM ANALİZİ

### **Ekran Görüntülerinden Çıkarımlar:**

Şahbaz ERP Kurulum Projesi - Odoo Project yapısı:

```
ŞAHBAZ ERP KURULUM PROJESİ
│
├── FAZ 0 - Pre-Analiz (5 görev)
│   ├── F0-01: Proje Organizasyonu ve İletişim Kanalları
│   ├── F0-03: Belge Toplama: Organizasyon Şeması & Yetki Matrisi
│   ├── F0-04: Departman Bazlı İlk Toplantılar
│   ├── F0-05: Veri Toplama ve Veri Kalite Kontrolü
│   └── F0-06: Pre-Analiz Raporu Hazırlığı ve Sunumu
│
├── FAZ 1 - Detaylı Analiz (7 görev)
│   ├── F1-01: Satış & CRM Detaylı Analiz
│   ├── F1-02: Satınalma Detaylı Analiz
│   ├── F1-03: Depo & Stok Detaylı Analiz
│   ├── F1-04: Üretim - MRP Detaylı Analiz
│   ├── F1-05: Finans & Muhasebe Analizi
│   ├── F1-06: İK & Kalite Analizi
│   └── F1-07: Entegrasyon İhtiyaç Analizi
│
├── FAZ 2 - Blueprint & Tasarım (3 görev)
├── FAZ 3 - Uygulama (3 görev)
├── FAZ 4 - Go-Live & Destek (3 görev)
└── Tamamlandı (0 görev)
```

### **Kick-off Döküman Yapısı:**

```markdown
# DÖKÜMAN YAPISI
├── 1. Firma Profili & Giriş
├── 2. ERP Nedir? (Eğitim)
├── 3. Sektörel Zorluklar
├── 4. 5 FAZLI METODOLOJİ ⭐ (Odoo Project'e dönüşecek)
│   ├── FAZ 0: Pre-Analiz (2 hafta)
│   ├── FAZ 1: Detaylı Analiz (4 hafta)
│   ├── FAZ 2: Blueprint & Tasarım (2 hafta)
│   ├── FAZ 3: Uygulama (6 hafta)
│   └── FAZ 4: Go-Live & Destek (2 hafta)
├── 5. MODÜL BAZLI DETAYLAR ⭐ (Departmanlar & Görevler)
│   ├── Modül 1: Satış & CRM
│   ├── Modül 2: Satınalma
│   ├── Modül 3: Stok Yönetimi
│   ├── Modül 4: Üretim (MRP)
│   └── ...
├── 6. VERİ TOPLAMA GEREKSİNİMLERİ ⭐ (Belgeler)
├── 7. ORGANİZASYON YAPISI ⭐ (Roller & Sorumluluklar)
└── 8. ZAMAN ÇİZELGESİ & SONRAKI ADIMLAR
```

---

## 🛠️ DELIVERABLES

### **1. OdooProjectDeploymentService** (YENİ - ÖNCELİK: YÜKSEK ⭐)

**Dosya:** `lib/services/odoo-project-deployment-service.ts`

**Sorumluluklar:**
- Odoo'da `project.project` kaydı oluşturma
- Project stages (`project.task.type`) oluşturma
- Tasks (`project.task`) oluşturma
- Subtasks oluşturma (parent_id ile bağlama)
- Milestones (`project.milestone`) oluşturma
- Task dependencies yönetimi
- Task assignee atama
- Task tags oluşturma ve atama

**Metodlar:**

```typescript
export class OdooProjectDeploymentService {
  /**
   * Create Odoo project from kick-off template
   */
  async deployProjectFromTemplate(
    odooClient: OdooXMLRPCClient,
    template: ExtendedKickoffTemplateData,
    customizations: ProjectCustomizations
  ): Promise<ProjectDeploymentResult>

  /**
   * Create project stages (phases)
   */
  private async createProjectStages(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    phases: Phase[]
  ): Promise<Map<string, number>>

  /**
   * Create project tasks
   */
  private async createProjectTasks(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    template: ExtendedKickoffTemplateData,
    stageMap: Map<string, number>,
    customizations: ProjectCustomizations
  ): Promise<number[]>

  /**
   * Create subtasks for a parent task
   */
  private async createSubtasks(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    parentTaskId: number,
    subtasks: Subtask[]
  ): Promise<number[]>

  /**
   * Create project milestones
   */
  private async createMilestones(
    odooClient: OdooXMLRPCClient,
    projectId: number,
    milestones: Milestone[]
  ): Promise<number[]>

  /**
   * Determine which phase a task belongs to
   */
  private determinePhase(task: Task, template: ExtendedKickoffTemplateData): string

  /**
   * Format task description with documents and collaborators
   */
  private formatTaskDescription(task: Task): string

  /**
   * Calculate deadline from start date and due days
   */
  private calculateDeadline(startDate: string | undefined, dueDays: number): string

  /**
   * Map priority string to Odoo priority value
   */
  private mapPriority(priority: string): string

  /**
   * Create or get tags for task
   */
  private async createOrGetTags(
    odooClient: OdooXMLRPCClient,
    tags: string[]
  ): Promise<number[]>
}
```

---

### **2. TemplateDeploymentEngine Güncellemesi** (GÜNCELLEME)

**Dosya:** `lib/services/template-deployment-engine.ts`

**Değişiklikler:**

```typescript
// deployKickoffTemplate metoduna eklenecek:

async deployKickoffTemplate(
  odooClient: OdooXMLRPCClient,
  template: KickoffTemplateData
): Promise<void> {
  // ... mevcut kod (modül kurulumu, custom fields, workflows, dashboards)
  
  // YENİ: ODOO PROJECT OLUŞTURMA
  await this.updateProgress(70, 'Creating Odoo project structure...')
  await this.logDeployment(this.deploymentId, 'info', 'Starting project deployment...')
  
  const projectService = new OdooProjectDeploymentService()
  const projectResult = await projectService.deployProjectFromTemplate(
    odooClient,
    template,
    {
      projectName: this.customizations.projectName || `${template.companyName} ERP Kurulum Projesi`,
      companyPartnerId: this.customizations.partnerId,
      startDate: this.customizations.startDate || new Date().toISOString(),
      assignDefaultUsers: this.customizations.assignDefaultUsers || false
    }
  )
  
  await this.logDeployment(
    this.deploymentId,
    'info',
    `✅ Created project ${projectResult.projectId} with ${projectResult.stageIds.length} stages and ${projectResult.taskIds.length} tasks`
  )
  
  // Project ID'yi deployment kaydına ekle
  await this.supabase
    .from('template_deployments')
    .update({
      result_data: {
        ...this.resultData,
        odoo_project_id: projectResult.projectId,
        stage_ids: projectResult.stageIds,
        task_ids: projectResult.taskIds,
        milestone_ids: projectResult.milestoneIds
      }
    })
    .eq('id', this.deploymentId)
  
  await this.updateProgress(85, 'Project deployment completed')
}
```

---

### **3. Type Definitions Güncellemesi** (GÜNCELLEME)

**Dosya:** `lib/types/kickoff-template.ts`

**Yeni Tipler:**

```typescript
export interface ProjectCustomizations {
  projectName: string
  companyPartnerId?: number
  startDate?: string
  assignDefaultUsers?: boolean
  defaultUserId?: number
}

export interface ProjectDeploymentResult {
  projectId: number
  stageIds: number[]
  taskIds: number[]
  subtaskIds: number[]
  milestoneIds: number[]
  errors: string[]
  warnings: string[]
}

export interface Subtask {
  title: string
  description?: string
  estimated_hours?: number
  priority?: 'low' | 'medium' | 'high' | 'critical'
}

export interface Milestone {
  name: string
  deadline: string
  description?: string
}

// Task interface'ine eklenecek:
export interface Task {
  // ... mevcut alanlar
  subtasks?: Subtask[]
  phase?: string  // Hangi faza ait olduğunu belirtir (örn: "FAZ 0: Pre-Analiz")
}

// ExtendedKickoffTemplateData interface'ine eklenecek:
export interface ExtendedKickoffTemplateData {
  // ... mevcut alanlar
  project_timeline: {
    phases: Phase[]
    milestones?: Milestone[]
  }
  companyName?: string  // Project adı için kullanılacak
}
```

---

### **4. Template Güncellemeleri** (GÜNCELLEME)

**Dosyalar:**
- `lib/templates/sahbaz-manufacturing-kickoff.ts`
- `lib/templates/aeka-mobilya-kickoff.ts` (YENİ)

**Şahbaz Template'ine Eklenecek:**

```typescript
export const sahbazManufacturingKickoffTemplate: ExtendedKickoffTemplateData = {
  // ... mevcut alanlar
  
  companyName: 'Şahbaz',
  
  project_timeline: {
    phases: [
      {
        name: 'FAZ 0: Pre-Analiz',
        sequence: 0,
        duration_weeks: 2,
        description: 'Firma DNA\'sını çıkarmak, genel durumu anlamak'
      },
      {
        name: 'FAZ 1: Detaylı Analiz',
        sequence: 1,
        duration_weeks: 4,
        description: 'Her departmanı derinlemesine incelemek'
      },
      {
        name: 'FAZ 2: Blueprint & Tasarım',
        sequence: 2,
        duration_weeks: 2,
        description: 'Odoo\'da nasıl çalışacağımızı tasarlamak'
      },
      {
        name: 'FAZ 3: Uygulama',
        sequence: 3,
        duration_weeks: 6,
        description: 'Sistemi kurmak, test etmek'
      },
      {
        name: 'FAZ 4: Go-Live & Destek',
        sequence: 4,
        duration_weeks: 2,
        description: 'Eski sistemden yeni sisteme geçmek'
      },
      {
        name: 'Tamamlandı',
        sequence: 5,
        duration_weeks: 0,
        description: 'Tamamlanan görevler'
      }
    ],
    milestones: [
      {
        name: 'Pre-Analiz Raporu Tamamlandı',
        deadline: '2025-11-25',
        description: 'Pre-analiz fazı tamamlandı ve rapor sunuldu'
      },
      {
        name: 'Detaylı Analiz Raporu Tamamlandı',
        deadline: '2025-12-23',
        description: 'Tüm departmanların detaylı analizi tamamlandı'
      },
      {
        name: 'Blueprint Onaylandı',
        deadline: '2026-01-06',
        description: 'Blueprint dokümanı hazırlandı ve onaylandı'
      },
      {
        name: 'UAT Tamamlandı',
        deadline: '2026-02-17',
        description: 'Kullanıcı kabul testleri tamamlandı'
      },
      {
        name: 'Go-Live',
        deadline: '2026-03-03',
        description: 'Sistem canlıya alındı'
      }
    ]
  },
  
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
          title: 'F0-01: Proje Organizasyonu ve İletişim Kanalları',
          description: 'Proje sponsoru, koordinatör ve departman temsilcilerini belirlemek. WhatsApp/Slack grubu oluşturmak. E-posta dağıtım listesi oluşturmak.',
          type: 'organization',
          priority: 'critical',
          due_days: 2,
          estimated_hours: 8,
          phase: 'FAZ 0: Pre-Analiz',
          requires_approval: false,
          depends_on: [],
          collaborator_departments: ['all']
        },
        {
          title: 'F0-03: Belge Toplama: Organizasyon Şeması & Yetki Matrisi',
          description: 'Organizasyon şemasını almak. Yetki matrisini belirlemek (kim neyi onaylıyor?).',
          type: 'data_collection',
          priority: 'critical',
          due_days: 3,
          estimated_hours: 6,
          phase: 'FAZ 0: Pre-Analiz',
          required_documents: [
            {
              name: 'Organizasyon Şeması',
              description: 'Şirket organizasyon yapısı',
              required: true,
              format: ['pdf', 'xlsx', 'png']
            },
            {
              name: 'Yetki Matrisi',
              description: 'Onay yetkileri ve limitler',
              required: true,
              format: ['xlsx']
            }
          ],
          requires_approval: false,
          depends_on: ['F0-01: Proje Organizasyonu ve İletişim Kanalları'],
          collaborator_departments: ['hr']
        },
        // ... diğer görevler
      ]
    },
    // ... diğer departmanlar
  ]
}
```

**AEKA Template Oluşturma:**

AEKA için yeni bir template oluşturulacak, Şahbaz template'inden kopyalanarak mobilya sektörüne özel görevler eklenecek.

---

### **5. Deployment UI Güncellemesi** (GÜNCELLEME - OPSİYONEL)

**Dosya:** `app/(dashboard)/odoo/deployments/[id]/page.tsx`

**Değişiklikler:**

Deployment sonuçlarına project bilgilerini ekle:

```typescript
// Deployment result display'e eklenecek:
{resultData?.odoo_project_id && (
  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
    <h3 className="font-semibold text-green-900 mb-2">
      ✅ Odoo Project Oluşturuldu
    </h3>
    <div className="space-y-1 text-sm text-green-800">
      <p>Project ID: {resultData.odoo_project_id}</p>
      <p>Stages: {resultData.stage_ids?.length || 0}</p>
      <p>Tasks: {resultData.task_ids?.length || 0}</p>
      {resultData.milestone_ids?.length > 0 && (
        <p>Milestones: {resultData.milestone_ids.length}</p>
      )}
    </div>
  </div>
)}
```

---

## 📅 UYGULAMA PLANI

### **Gün 1: Core Service Development (6-8 saat)**

#### **Saat 1-3: OdooProjectDeploymentService Temel Yapı**
- ✅ Service dosyası oluştur
- ✅ Type definitions güncelle
- ✅ `deployProjectFromTemplate` metodu
- ✅ `createProjectStages` metodu
- ✅ `createProjectTasks` metodu

#### **Saat 4-6: Task & Subtask Management**
- ✅ `createSubtasks` metodu
- ✅ `createMilestones` metodu
- ✅ `determinePhase` helper metodu
- ✅ `formatTaskDescription` helper metodu
- ✅ `calculateDeadline` helper metodu
- ✅ `mapPriority` helper metodu

#### **Saat 7-8: Tags & Integration**
- ✅ `createOrGetTags` metodu
- ✅ TemplateDeploymentEngine entegrasyonu
- ✅ Error handling ve logging

---

### **Gün 2: Template Creation & Testing (6-8 saat)**

#### **Saat 1-3: Template Updates**
- ✅ Şahbaz template güncelleme
  - ✅ `project_timeline` ekleme
  - ✅ `phases` tanımlama
  - ✅ `milestones` ekleme
  - ✅ Task'lara `phase` alanı ekleme
- ✅ AEKA template oluşturma
  - ✅ Şahbaz'dan kopyala
  - ✅ Mobilya sektörüne özel görevler ekle
  - ✅ 9 modül yapısı

#### **Saat 4-5: Database & Seed**
- ✅ Template'leri database'e seed et
- ✅ Seed script güncelle

#### **Saat 6-8: Testing & Debugging**
- ✅ Manuel test: Şahbaz template deploy
- ✅ Manuel test: AEKA template deploy
- ✅ Odoo'da proje kontrolü
- ✅ Stages kontrolü
- ✅ Tasks kontrolü
- ✅ Bug fixes

---

## 🧪 TEST PLANI

### **Manuel Test Senaryoları:**

#### **Test 1: Şahbaz Template Deployment**

```bash
# 1. Template'i deploy et
POST /api/templates/library/deploy
{
  "template_id": "sahbaz-manufacturing-kickoff-v1",
  "company_id": "...",
  "project_id": "..."
}

# 2. Odoo'da kontrol et:
- Project oluşturuldu mu?
- 6 stage var mı? (5 faz + Tamamlandı)
- Görevler doğru stage'lerde mi?
- Task açıklamaları doğru mu?
- Milestones oluşturuldu mu?
```

#### **Test 2: AEKA Template Deployment**

```bash
# 1. Template'i deploy et
POST /api/templates/library/deploy
{
  "template_id": "aeka-mobilya-kickoff-v1",
  "company_id": "...",
  "project_id": "..."
}

# 2. Odoo'da kontrol et:
- Project adı: "AEKA Mobilya ERP Kurulum Projesi"
- 6 stage var mı?
- Mobilya sektörüne özel görevler var mı?
- Gerekli belgeler task açıklamalarında mı?
```

#### **Test 3: Task Dependencies**

```bash
# Odoo'da kontrol et:
- F0-03 görevi F0-01'e bağımlı mı?
- Depends_on alanları doğru mu?
```

#### **Test 4: Subtasks**

```bash
# Eğer subtask varsa:
- Subtask'lar parent task'a bağlı mı?
- Subtask'lar doğru oluşturuldu mu?
```

---

## 📊 BAŞARI KRİTERLERİ

- ✅ `OdooProjectDeploymentService` oluşturuldu
- ✅ `TemplateDeploymentEngine` güncellendi
- ✅ Şahbaz template güncellendi (project_timeline eklendi)
- ✅ AEKA template oluşturuldu
- ✅ Template deployment Odoo'da proje oluşturuyor
- ✅ Stages (fazlar) doğru oluşturuluyor
- ✅ Tasks doğru stage'lere atanıyor
- ✅ Task açıklamaları belgeler ve işbirlikçi departmanları içeriyor
- ✅ Milestones oluşturuluyor
- ✅ Manuel test başarılı

---

## 🔧 TEKNİK DETAYLAR

### **Odoo Models:**

```python
# project.project
{
  'name': 'AEKA Mobilya ERP Kurulum Projesi',
  'use_tasks': True,
  'use_subtasks': True,
  'allow_milestones': True,
  'privacy_visibility': 'portal',
  'partner_id': 123,  # Company partner ID
  'date_start': '2025-11-17'
}

# project.task.type (Stages)
{
  'name': 'FAZ 0: Pre-Analiz',
  'description': 'Firma DNA\'sını çıkarmak',
  'project_ids': [[6, 0, [project_id]]],
  'sequence': 0,
  'fold': False
}

# project.task
{
  'name': 'F0-01: Proje Organizasyonu',
  'description': '...',
  'project_id': project_id,
  'stage_id': stage_id,
  'planned_hours': 8.0,
  'date_deadline': '2025-11-19',
  'priority': '3',  # 0=Low, 1=Medium, 2=High, 3=Critical
  'tag_ids': [[6, 0, [tag1_id, tag2_id]]]
}

# project.task (Subtask)
{
  'name': 'Subtask 1',
  'description': '...',
  'project_id': project_id,
  'parent_id': parent_task_id,
  'planned_hours': 2.0
}

# project.milestone
{
  'name': 'Pre-Analiz Raporu Tamamlandı',
  'project_id': project_id,
  'deadline': '2025-11-25',
  'is_reached': False
}
```

### **Priority Mapping:**

```typescript
const priorityMap: Record<string, string> = {
  'low': '0',
  'medium': '1',
  'high': '2',
  'critical': '3'
}
```

### **Phase Determination Logic:**

```typescript
private determinePhase(task: Task, template: ExtendedKickoffTemplateData): string {
  // 1. Eğer task.phase tanımlıysa direkt kullan
  if (task.phase) {
    return task.phase
  }
  
  // 2. Task title'dan çıkar (örn: "F0-01" → "FAZ 0")
  const match = task.title.match(/^F(\d+)-/)
  if (match) {
    const phaseIndex = parseInt(match[1])
    return template.project_timeline.phases[phaseIndex]?.name || template.project_timeline.phases[0].name
  }
  
  // 3. Default: İlk faz
  return template.project_timeline.phases[0].name
}
```

---

## 📝 ÖRNEK KULLANIM

### **Scenario: AEKA Template Deployment**

```typescript
// 1. Template'i database'den al
const template = await templateLibraryService.getTemplateById('aeka-mobilya-kickoff-v1')

// 2. Deploy et
const deploymentEngine = new TemplateDeploymentEngine()
const result = await deploymentEngine.deployTemplate({
  instanceId: 'aeka-odoo-instance-123',
  templateId: 'aeka-mobilya-kickoff-v1',
  templateType: 'kickoff',
  userId: 'user-123',
  customizations: {
    projectName: 'AEKA Mobilya ERP Kurulum Projesi',
    startDate: '2025-11-17',
    partnerId: 456  // AEKA company partner ID in Odoo
  }
})

// 3. Sonuç:
// - Odoo'da proje oluşturuldu (ID: 789)
// - 6 stage oluşturuldu
// - 21 task oluşturuldu
// - 5 milestone oluşturuldu
```

---

## 🚀 SONRAKI ADIMLAR (Sprint 9+)

### **Potansiyel İyileştirmeler:**

1. **Task Assignment:**
   - Otomatik kullanıcı atama
   - Departman bazlı atama
   - Role-based assignment

2. **Task Dependencies:**
   - Odoo'da task dependencies kurma
   - Gantt chart entegrasyonu

3. **Document Parsing:**
   - Markdown dökümanlardan otomatik template oluşturma
   - AI ile döküman analizi

4. **Template Customization:**
   - Deployment öncesi task ekleme/çıkarma
   - Phase düzenleme
   - Deadline özelleştirme

5. **Progress Tracking:**
   - Deployment sonrası proje takibi
   - Task completion tracking
   - Milestone tracking

---

## 📚 REFERANSLAR

### **İlgili Dökümanlar:**
- `SPRINT8-FINAL-SUMMARY.md` - Template Library temel yapısı
- `Sahbaz_ERP_Kick-off_Dokumani_TASLAK.md` - Şahbaz kick-off dökümanı
- `AEKA_Mobilya_ERP_Kick-off_Dokumani_TASLAK.md` - AEKA kick-off dökümanı

### **İlgili Dosyalar:**
- `lib/services/template-deployment-engine.ts` - Mevcut deployment engine
- `lib/templates/sahbaz-manufacturing-kickoff.ts` - Şahbaz template
- `lib/types/kickoff-template.ts` - Type definitions

---

## ✅ SPRINT 8.5 BAŞLATILDI

**Tarih:** 16 Kasım 2025  
**Durum:** 🚀 Başlatıldı  
**Tahmini Tamamlanma:** 17-18 Kasım 2025  
**Sonraki Sprint:** Sprint 9 - Website Builder & Translation

---

**Hazırlayan:** AI Assistant (Claude Sonnet 4.5)  
**Versiyon:** 1.0  
**Son Güncelleme:** 16 Kasım 2025


