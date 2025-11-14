# 🎯 SPRINT 6.5: DEPARTMENT & TASK MANAGEMENT

**Tarih:** 13 Kasım 2024  
**Süre:** 4-5 gün (32-40 saat)  
**Durum:** 📋 Planlanıyor  
**Öncelik:** ⭐⭐⭐⭐⭐ KRİTİK  
**Bağımlılık:** Sprint 6 (Odoo Integration Core)

---

## 🎯 AMAÇ

Sprint 6'da Odoo instance oluşturma ve template deployment'ı tamamladık. Ancak **kritik bir eksik** var:

**Kick-off template'i deploy ediyoruz ama:**
- ❌ Departman sorumlularına görev atanmıyor
- ❌ Takvim olayları oluşturulmuyor
- ❌ Danışman-departman iletişimi yok
- ❌ Görev takibi yok

**Sprint 6.5 ile:**
- ✅ Departman yapısı kurulacak
- ✅ Departman sorumlularına otomatik görev atanacak
- ✅ Takvim entegrasyonu olacak
- ✅ Bildirim sistemi çalışacak
- ✅ Görev tamamlama ve onay süreci olacak

---

## 🔍 SORUN ANALİZİ

### **Gerçek Kullanım Senaryosu (AEKA Örneği):**

```
1. Danışman: AEKA Kick-off template'i seç
2. Sistem: Template deploy et
3. Sonuç:
   ✅ Odoo instance oluşturuldu
   ✅ Modüller kuruldu
   ❌ Ama... departman sorumluları manuel atanacak
   ❌ Görevler manuel girilecek
   ❌ Takvim manuel oluşturulacak
   ❌ Danışman her şeyi takip edemeyecek
```

### **Olması Gereken:**

```
1. Danışman: AEKA Kick-off template'i seç
2. Sistem: Template deploy et
3. Sonuç:
   ✅ Odoo instance oluşturuldu
   ✅ Modüller kuruldu
   ✅ 8 departman oluşturuldu
   ✅ Her departman için sorumlu davet edildi
   ✅ 50+ görev otomatik atandı
   ✅ 20+ takvim olayı oluşturuldu
   ✅ Bildirimler gönderildi
   ✅ Danışman tek ekrandan takip ediyor
```

---

## 📋 KAPSAM

### **GÜN 1-2: Database & Core Services (16 saat)**

#### **1.1 Database Migrations**

**Yeni Tablolar:**

```sql
-- 1. departments (Departmanlar)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- 'Üretim', 'Stok', 'Satınalma'
  technical_name TEXT NOT NULL, -- 'production', 'inventory', 'purchasing'
  description TEXT,
  
  -- Departman sorumlusu
  manager_id UUID REFERENCES profiles(id),
  
  -- Odoo mapping
  odoo_department_id INTEGER, -- Odoo'daki hr.department ID'si
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, technical_name)
);

-- 2. department_members (Departman Üyeleri)
CREATE TABLE department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  role TEXT DEFAULT 'member', -- 'manager', 'member', 'viewer'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(department_id, user_id)
);

-- 3. department_contacts (Davet Bekleyen Kişiler)
CREATE TABLE department_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  
  -- Kişi Bilgileri (henüz kullanıcı değil)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,
  
  -- Davet Durumu
  invitation_status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'accepted', 'declined'
  invitation_token TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  invitation_expires_at TIMESTAMPTZ,
  
  -- Kullanıcı oluşturulunca
  user_id UUID REFERENCES profiles(id), -- NULL ise henüz kayıt olmamış
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, email)
);

-- 4. tasks (Görevler)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  type TEXT, -- 'kickoff_task', 'training', 'data_collection', 'review'
  
  -- Atama
  assigned_to UUID REFERENCES profiles(id),
  assigned_department_id UUID REFERENCES departments(id),
  
  -- Durum
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'pending_review', 'completed', 'blocked'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Zaman
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Tamamlama gereksinimleri
  completion_requirements JSONB,
  -- {
  --   "requires_file_upload": true,
  --   "required_file_types": ["xlsx", "csv"],
  --   "requires_approval": true,
  --   "approval_by": "consultant",
  --   "min_data_rows": 10
  -- }
  
  -- Onay süreci
  completed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Bağlantılar
  related_module_id UUID REFERENCES odoo_modules(id),
  related_calendar_event_id UUID REFERENCES calendar_events(id),
  
  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. task_dependencies (Görev Bağımlılıkları)
CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  dependency_type TEXT DEFAULT 'finish_to_start',
  -- 'finish_to_start': Önce bitir, sonra başla
  -- 'start_to_start': Birlikte başla
  -- 'finish_to_finish': Birlikte bitir
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- 6. task_attachments (Görev Dosyaları)
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. task_collaborators (Görev İşbirlikçileri)
CREATE TABLE task_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  department_id UUID REFERENCES departments(id),
  
  role TEXT NOT NULL, -- 'owner', 'collaborator', 'reviewer', 'observer'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, user_id)
);

-- 8. notifications (Bildirimler)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- 'task_assigned', 'task_due', 'meeting_reminder', 'mention', 'approval_request'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Bağlantılar
  related_task_id UUID REFERENCES tasks(id),
  related_event_id UUID REFERENCES calendar_events(id),
  related_company_id UUID REFERENCES companies(id),
  
  -- Durum
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Kanal
  sent_via TEXT[], -- ['email', 'platform', 'sms']
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. notification_preferences (Bildirim Tercihleri)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Kanal tercihleri
  email_enabled BOOLEAN DEFAULT true,
  platform_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Bildirim tipleri
  task_assigned BOOLEAN DEFAULT true,
  task_due_reminder BOOLEAN DEFAULT true,
  meeting_reminder BOOLEAN DEFAULT true,
  mention BOOLEAN DEFAULT true,
  approval_request BOOLEAN DEFAULT true,
  
  -- Zamanlama
  quiet_hours_start TIME, -- '22:00'
  quiet_hours_end TIME,   -- '08:00'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 10. project_phases (Proje Fazları)
CREATE TABLE project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL, -- 'Hafta 1: Discovery', 'Hafta 2: Configuration'
  description TEXT,
  phase_number INTEGER NOT NULL,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'delayed'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. project_milestones (Proje Kilometre Taşları)
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id),
  
  title TEXT NOT NULL, -- 'Pre-Analiz Raporu Sunumu'
  description TEXT,
  due_date DATE NOT NULL,
  
  deliverables TEXT[], -- ['Analiz raporu', 'Sunum', 'Aksiyon planı']
  
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Mevcut Tablolara Eklentiler:**

```sql
-- calendar_events tablosuna ekle
ALTER TABLE calendar_events 
ADD COLUMN department_id UUID REFERENCES departments(id),
ADD COLUMN task_id UUID REFERENCES tasks(id);

-- tasks tablosuna ekle
ALTER TABLE tasks 
ADD COLUMN phase_id UUID REFERENCES project_phases(id),
ADD COLUMN milestone_id UUID REFERENCES project_milestones(id),
ADD COLUMN can_start BOOLEAN DEFAULT true,
ADD COLUMN blocked_by TEXT[];
```

**İndeksler:**

```sql
CREATE INDEX idx_departments_company ON departments(company_id);
CREATE INDEX idx_departments_manager ON departments(manager_id);
CREATE INDEX idx_department_members_dept ON department_members(department_id);
CREATE INDEX idx_department_members_user ON department_members(user_id);
CREATE INDEX idx_department_contacts_company ON department_contacts(company_id);
CREATE INDEX idx_department_contacts_email ON department_contacts(email);
CREATE INDEX idx_tasks_company ON tasks(company_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_department ON tasks(assigned_department_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
```

**RLS Policies:**

```sql
-- departments: Company users can view their company's departments
CREATE POLICY "Users can view company departments"
  ON departments FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- tasks: Users can view their assigned tasks or department tasks
CREATE POLICY "Users can view assigned tasks"
  ON tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR assigned_department_id IN (
      SELECT department_id FROM department_members WHERE user_id = auth.uid()
    )
    OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'company_admin')
    )
  );

-- notifications: Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());
```

#### **1.2 Core Services**

**Services to Create:**

1. **`lib/services/department-service.ts`**
   - `createDepartment()`
   - `getDepartmentsByCompany()`
   - `getDepartmentById()`
   - `updateDepartment()`
   - `deleteDepartment()`
   - `assignManager()`
   - `addMember()`
   - `removeMember()`

2. **`lib/services/department-contact-service.ts`**
   - `inviteContact()`
   - `resendInvitation()`
   - `acceptInvitation()`
   - `declineInvitation()`
   - `getContactsByCompany()`
   - `getPendingInvitations()`

3. **`lib/services/task-service.ts`**
   - `createTask()`
   - `getTasksByCompany()`
   - `getTasksByUser()`
   - `getTasksByDepartment()`
   - `updateTask()`
   - `completeTask()`
   - `approveTask()`
   - `rejectTask()`
   - `addAttachment()`
   - `addCollaborator()`
   - `checkDependencies()`

4. **`lib/services/notification-service.ts`**
   - `sendNotification()`
   - `sendTaskAssignedNotification()`
   - `sendTaskDueReminderNotification()`
   - `sendMeetingReminderNotification()`
   - `sendApprovalRequestNotification()`
   - `markAsRead()`
   - `getUnreadNotifications()`
   - `getUserPreferences()`
   - `updatePreferences()`

5. **`lib/services/project-phase-service.ts`**
   - `createPhase()`
   - `getPhasesByProject()`
   - `updatePhaseStatus()`
   - `createMilestone()`
   - `completeMilestone()`

---

### **GÜN 3: Template & Deployment (8 saat)**

#### **3.1 Kickoff Template Genişletme**

**Yeni Interface:**

```typescript
// lib/types/kickoff-template.ts

export interface KickoffTemplateData {
  // ... mevcut alanlar ...
  
  // YENİ: Departman yapısı
  departments: DepartmentTemplate[]
  
  // YENİ: Proje takvimi
  project_timeline: ProjectTimeline
  
  // YENİ: Belge şablonları
  document_templates: DocumentTemplate[]
}

export interface DepartmentTemplate {
  name: string // 'Üretim'
  technical_name: string // 'production'
  description: string
  manager_role: string // 'Üretim Müdürü'
  responsibilities: string[]
  
  // Bu departman için görevler
  tasks: TaskTemplate[]
  
  // Bu departman için takvim olayları
  calendar_events: CalendarEventTemplate[]
  
  // İlgili modüller
  related_modules: string[] // technical_name'ler
}

export interface TaskTemplate {
  title: string
  description: string
  type: 'data_collection' | 'training' | 'review' | 'approval' | 'meeting'
  priority: 'low' | 'medium' | 'high' | 'critical'
  
  // Zaman
  due_days: number // Kick-off'tan kaç gün sonra
  estimated_hours: number
  
  // Tamamlama gereksinimleri
  required_documents: RequiredDocument[]
  requires_approval: boolean
  
  // Bağımlılıklar
  depends_on: string[] // Diğer task'ların title'ları
  
  // İşbirlikçiler
  collaborator_departments: string[] // Diğer departmanların technical_name'leri
}

export interface RequiredDocument {
  name: string // 'BOM Listesi'
  description: string
  template_url?: string // '/templates/bom_template.xlsx'
  required: boolean
  format: string[] // ['xlsx', 'csv']
  validation?: {
    min_rows?: number
    required_columns?: string[]
    max_size_mb?: number
  }
}

export interface CalendarEventTemplate {
  title: string
  description: string
  event_type: 'meeting' | 'training' | 'review' | 'deadline'
  duration_minutes: number
  day_offset: number // Kick-off'tan kaç gün sonra
  attendees: string[] // Roller: ['manager', 'consultant', 'team']
}

export interface ProjectTimeline {
  phases: PhaseTemplate[]
}

export interface PhaseTemplate {
  name: string // 'Hafta 1: Discovery'
  description: string
  duration_days: number
  focus_areas: string[]
  milestones: MilestoneTemplate[]
}

export interface MilestoneTemplate {
  title: string
  description: string
  day_offset: number
  deliverables: string[]
  responsible_departments: string[]
}

export interface DocumentTemplate {
  name: string
  description: string
  template_file_url: string
  category: string // 'bom', 'process', 'report'
}
```

#### **3.2 AEKA Template Güncelleme**

**`lib/templates/kickoff/aeka-mobilya.ts` güncelleme:**

```typescript
export const aekaKickoffTemplate: KickoffTemplateData = {
  // ... mevcut alanlar ...
  
  departments: [
    {
      name: 'Üretim',
      technical_name: 'production',
      description: 'Üretim süreçleri, BOM yönetimi, üretim planlaması',
      manager_role: 'Üretim Müdürü',
      responsibilities: [
        'Ürün BOM listelerini hazırlamak',
        'Üretim süreçlerini dokümante etmek',
        'Üretim rotalarını tanımlamak',
        'Kapasite planlaması yapmak'
      ],
      tasks: [
        {
          title: 'Ürün BOM listesi hazırlama',
          description: 'Tüm ürünler için malzeme listesi (Bill of Materials) hazırlanması',
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
                required_columns: ['Ürün Kodu', 'Malzeme', 'Miktar', 'Birim']
              }
            }
          ],
          requires_approval: true,
          depends_on: [],
          collaborator_departments: ['inventory']
        },
        {
          title: 'Üretim süreci dokümantasyonu',
          description: 'Her ürün için üretim adımlarının detaylı açıklaması',
          type: 'data_collection',
          priority: 'high',
          due_days: 10,
          estimated_hours: 12,
          required_documents: [
            {
              name: 'Üretim Süreci Dokümanı',
              description: 'Üretim adımları ve süreler',
              required: true,
              format: ['pdf', 'docx']
            }
          ],
          requires_approval: true,
          depends_on: ['Ürün BOM listesi hazırlama'],
          collaborator_departments: ['quality']
        }
        // ... daha fazla görev
      ],
      calendar_events: [
        {
          title: 'Üretim Ekibi Kick-off Toplantısı',
          description: 'Proje tanıtımı ve beklentiler',
          event_type: 'meeting',
          duration_minutes: 90,
          day_offset: 1,
          attendees: ['manager', 'consultant', 'team']
        },
        {
          title: 'BOM Review Toplantısı',
          description: 'Hazırlanan BOM listelerinin incelenmesi',
          event_type: 'review',
          duration_minutes: 120,
          day_offset: 8,
          attendees: ['manager', 'consultant']
        }
      ],
      related_modules: ['mrp', 'mrp_bom']
    },
    // ... diğer 7 departman
  ],
  
  project_timeline: {
    phases: [
      {
        name: 'Hafta 1: Discovery & Veri Toplama',
        description: 'İlk analizler ve veri toplama',
        duration_days: 5,
        focus_areas: ['Üretim', 'Stok', 'Satınalma'],
        milestones: [
          {
            title: 'İlk Veri Paketi Tamamlandı',
            description: 'BOM, ürün listesi, tedarikçi listesi toplandı',
            day_offset: 5,
            deliverables: ['BOM listesi', 'Ürün kataloğu', 'Tedarikçi listesi'],
            responsible_departments: ['production', 'inventory', 'purchasing']
          }
        ]
      },
      {
        name: 'Hafta 2: Konfigürasyon & Test',
        description: 'Odoo konfigürasyonu ve ilk testler',
        duration_days: 5,
        focus_areas: ['Tüm Departmanlar'],
        milestones: [
          {
            title: 'Pre-Analiz Raporu Sunumu',
            description: 'İlk 2 haftalık çalışmanın sunumu',
            day_offset: 10,
            deliverables: ['Analiz raporu', 'Sunum', 'Aksiyon planı'],
            responsible_departments: ['all']
          }
        ]
      }
    ]
  },
  
  document_templates: [
    {
      name: 'BOM Template',
      description: 'Standart BOM listesi şablonu',
      template_file_url: '/templates/bom_template.xlsx',
      category: 'bom'
    },
    {
      name: 'Üretim Süreci Şablonu',
      description: 'Üretim adımları dokümantasyon şablonu',
      template_file_url: '/templates/production_process_template.docx',
      category: 'process'
    }
  ]
}
```

#### **3.3 Template Deployment Engine Güncelleme**

**`lib/services/template-deployment-engine.ts` güncelleme:**

```typescript
private async deployKickoffTemplate(
  odooClient: OdooXMLRPCClient,
  templateData: KickoffTemplateData,
  deploymentId: string,
  config: DeploymentConfig
): Promise<any> {
  const result: any = {
    modules: [],
    departments: [],
    tasks: [],
    calendar_events: [],
    phases: [],
    milestones: []
  }

  // 1. Modülleri kur (mevcut)
  await this.logDeployment(deploymentId, 'info', 'Installing modules...')
  // ... mevcut kod ...

  // 2. YENİ: Proje fazlarını oluştur
  await this.logDeployment(deploymentId, 'info', 'Creating project phases...')
  
  let currentDate = new Date()
  for (const phaseTemplate of templateData.project_timeline.phases) {
    const startDate = new Date(currentDate)
    const endDate = new Date(currentDate)
    endDate.setDate(endDate.getDate() + phaseTemplate.duration_days)
    
    const { data: phase } = await supabase
      .from('project_phases')
      .insert({
        project_id: config.projectId,
        name: phaseTemplate.name,
        description: phaseTemplate.description,
        phase_number: result.phases.length + 1,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        status: result.phases.length === 0 ? 'active' : 'pending'
      })
      .select()
      .single()
    
    result.phases.push(phase)
    
    // Milestone'ları oluştur
    for (const milestoneTemplate of phaseTemplate.milestones) {
      const milestoneDate = new Date(currentDate)
      milestoneDate.setDate(milestoneDate.getDate() + milestoneTemplate.day_offset)
      
      const { data: milestone } = await supabase
        .from('project_milestones')
        .insert({
          project_id: config.projectId,
          phase_id: phase.id,
          title: milestoneTemplate.title,
          description: milestoneTemplate.description,
          due_date: milestoneDate.toISOString().split('T')[0],
          deliverables: milestoneTemplate.deliverables
        })
        .select()
        .single()
      
      result.milestones.push(milestone)
    }
    
    currentDate = endDate
  }

  // 3. YENİ: Departmanları oluştur
  await this.logDeployment(deploymentId, 'info', 'Creating departments...')
  
  const departmentMap = new Map<string, any>()
  
  for (const dept of templateData.departments) {
    // Odoo'da hr.department oluştur
    const odooDeptId = await odooClient.create('hr.department', {
      name: dept.name,
      // ... diğer alanlar
    })
    
    // Platform database'inde department kaydet
    const { data: department } = await supabase
      .from('departments')
      .insert({
        company_id: config.companyId,
        name: dept.name,
        technical_name: dept.technical_name,
        description: dept.description,
        odoo_department_id: odooDeptId,
      })
      .select()
      .single()
    
    departmentMap.set(dept.technical_name, department)
    result.departments.push(department)
    
    // 4. YENİ: Departman için görevler oluştur
    const taskMap = new Map<string, any>()
    
    for (const task of dept.tasks) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + task.due_days)
      
      const { data: createdTask } = await supabase
        .from('tasks')
        .insert({
          company_id: config.companyId,
          project_id: config.projectId,
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority,
          due_date: dueDate,
          assigned_department_id: department.id,
          status: 'pending',
          completion_requirements: {
            requires_file_upload: task.required_documents.length > 0,
            required_documents: task.required_documents,
            requires_approval: task.requires_approval
          },
          phase_id: result.phases[0]?.id // İlk faz
        })
        .select()
        .single()
      
      taskMap.set(task.title, createdTask)
      result.tasks.push(createdTask)
      
      // Görev bağımlılıklarını oluştur
      for (const dependsOnTitle of task.depends_on) {
        const dependsOnTask = taskMap.get(dependsOnTitle)
        if (dependsOnTask) {
          await supabase.from('task_dependencies').insert({
            task_id: createdTask.id,
            depends_on_task_id: dependsOnTask.id,
            dependency_type: 'finish_to_start'
          })
        }
      }
      
      // İşbirlikçi departmanları ekle
      for (const collabDeptName of task.collaborator_departments) {
        const collabDept = departmentMap.get(collabDeptName)
        if (collabDept) {
          await supabase.from('task_collaborators').insert({
            task_id: createdTask.id,
            department_id: collabDept.id,
            role: 'collaborator'
          })
        }
      }
    }
    
    // 5. YENİ: Departman için takvim olayları oluştur
    for (const event of dept.calendar_events) {
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + event.day_offset)
      
      const endTime = new Date(eventDate)
      endTime.setMinutes(endTime.getMinutes() + event.duration_minutes)
      
      const { data: calendarEvent } = await supabase
        .from('calendar_events')
        .insert({
          company_id: config.companyId,
          title: event.title,
          description: event.description,
          event_type: event.event_type,
          start_time: eventDate,
          end_time: endTime,
          department_id: department.id,
        })
        .select()
        .single()
      
      result.calendar_events.push(calendarEvent)
    }
  }

  // 6. YENİ: Bildirim gönder (departman sorumlularına)
  await this.logDeployment(deploymentId, 'info', 'Sending notifications...')
  
  const notificationService = getNotificationService()
  
  for (const dept of result.departments) {
    if (dept.manager_id) {
      await notificationService.sendNotification({
        user_id: dept.manager_id,
        type: 'task_assigned',
        title: `${dept.name} Departmanı Görevleri Atandı`,
        message: `Size ${result.tasks.filter(t => t.assigned_department_id === dept.id).length} görev atandı.`,
        related_company_id: config.companyId,
        sent_via: ['email', 'platform']
      })
    }
  }

  return result
}
```

---

### **GÜN 4-5: UI & Testing (16 saat)**

#### **4.1 API Routes**

**Yeni API Endpoints:**

1. **`app/api/departments/route.ts`** - GET, POST
2. **`app/api/departments/[id]/route.ts`** - GET, PUT, DELETE
3. **`app/api/departments/[id]/members/route.ts`** - GET, POST, DELETE
4. **`app/api/department-contacts/route.ts`** - GET, POST
5. **`app/api/department-contacts/[id]/resend/route.ts`** - POST
6. **`app/api/tasks/route.ts`** - GET, POST
7. **`app/api/tasks/[id]/route.ts`** - GET, PUT, DELETE
8. **`app/api/tasks/[id]/complete/route.ts`** - POST
9. **`app/api/tasks/[id]/approve/route.ts`** - POST
10. **`app/api/tasks/[id]/reject/route.ts`** - POST
11. **`app/api/tasks/[id]/attachments/route.ts`** - GET, POST
12. **`app/api/notifications/route.ts`** - GET
13. **`app/api/notifications/[id]/read/route.ts`** - POST
14. **`app/api/notifications/preferences/route.ts`** - GET, PUT
15. **`app/api/invite/[token]/route.ts`** - GET, POST

#### **4.2 UI Components**

**Yeni Sayfalar:**

1. **`app/(dashboard)/companies/[id]/departments/page.tsx`**
   - Departman listesi
   - Departman ekleme butonu
   - Her departman için: sorumlu, görev sayısı, durum

2. **`app/(dashboard)/companies/[id]/departments/[deptId]/page.tsx`**
   - Departman detayı
   - Sorumlu bilgileri
   - Ekip üyeleri
   - Görev listesi
   - Takvim olayları

3. **`app/(dashboard)/companies/[id]/tasks/page.tsx`**
   - Görev listesi (tüm departmanlar)
   - Filtreleme: departman, durum, öncelik, tarih
   - Sıralama
   - Arama

4. **`app/(dashboard)/tasks/page.tsx`** (Kullanıcı görünümü)
   - Benim görevlerim
   - Bugün, bu hafta, gelecek
   - Tamamlananlar
   - Görev detayı modal

5. **`app/(dashboard)/companies/[id]/team/page.tsx`**
   - Tüm departmanlar ve sorumlular
   - Davet durumları
   - Davetiye gönderme/tekrar gönderme

6. **`app/invite/[token]/page.tsx`**
   - Davetiye kabul sayfası
   - Kayıt formu
   - Email doğrulama

**Yeni Componentler:**

1. **`components/departments/department-list.tsx`**
2. **`components/departments/department-card.tsx`**
3. **`components/departments/invite-member-dialog.tsx`**
4. **`components/tasks/task-list.tsx`**
5. **`components/tasks/task-card.tsx`**
6. **`components/tasks/task-detail-modal.tsx`**
7. **`components/tasks/task-completion-form.tsx`**
8. **`components/tasks/file-upload.tsx`**
9. **`components/notifications/notification-bell.tsx`**
10. **`components/notifications/notification-list.tsx`**
11. **`components/notifications/notification-preferences.tsx`**
12. **`components/onboarding/welcome-tour.tsx`**

#### **4.3 Danışman Dashboard Güncellemesi**

**`app/(dashboard)/dashboard/page.tsx` güncelleme:**

```typescript
// Danışman için özel görünüm
if (userRole === 'super_admin') {
  return (
    <div>
      <h1>Danışman Dashboard</h1>
      
      {/* Firma Özeti */}
      <div className="grid grid-cols-3 gap-4">
        {companies.map(company => (
          <CompanyCard
            key={company.id}
            company={company}
            stats={{
              totalTasks: company.total_tasks,
              pendingTasks: company.pending_tasks,
              overdueTasks: company.overdue_tasks,
              nextDeadline: company.next_deadline
            }}
          />
        ))}
      </div>
      
      {/* Bugün Yapılacaklar */}
      <div>
        <h2>Bugün Yapılacaklar</h2>
        <TaskList tasks={todayTasks} />
      </div>
      
      {/* Gecikenler (Acil!) */}
      <div>
        <h2>Gecikenler</h2>
        <TaskList tasks={overdueTasks} priority="critical" />
      </div>
      
      {/* Onay Bekleyenler */}
      <div>
        <h2>Onay Bekleyen Görevler</h2>
        <TaskList tasks={pendingApprovalTasks} />
      </div>
    </div>
  )
}
```

#### **4.4 Testing**

**Unit Tests:**

1. `test/lib/services/department-service.test.ts`
2. `test/lib/services/task-service.test.ts`
3. `test/lib/services/notification-service.test.ts`
4. `test/api/departments/route.test.ts`
5. `test/api/tasks/route.test.ts`

**E2E Tests:**

1. `e2e/department-management.spec.ts`
   - Departman oluşturma
   - Sorumlu davet etme
   - Davetiye kabul etme

2. `e2e/task-management.spec.ts`
   - Görev tamamlama
   - Dosya yükleme
   - Onay süreci

3. `e2e/template-deployment-with-departments.spec.ts`
   - Template deploy et
   - Departmanların oluşturulduğunu kontrol et
   - Görevlerin atandığını kontrol et
   - Bildirimlerin gönderildiğini kontrol et

---

## 🎯 BAŞARI KRİTERLERİ

### **Teknik:**

- ✅ 11 yeni tablo oluşturuldu
- ✅ 5 core service hazır
- ✅ 15 API endpoint çalışıyor
- ✅ 10+ UI component hazır
- ✅ RLS policies aktif
- ✅ Unit tests %80+ coverage
- ✅ E2E tests geçiyor

### **Fonksiyonel:**

- ✅ Template deploy edilince departmanlar otomatik oluşuyor
- ✅ Görevler departmanlara atanıyor
- ✅ Bildirimler gönderiliyor
- ✅ Davetiye sistemi çalışıyor
- ✅ Görev tamamlama ve onay süreci çalışıyor
- ✅ Dosya yükleme çalışıyor
- ✅ Danışman tüm firmaları tek ekrandan takip edebiliyor

### **Kullanıcı Deneyimi:**

- ✅ Departman sorumlusu davetiyeyi kabul edip platforma girebiliyor
- ✅ Görevlerini görebiliyor ve tamamlayabiliyor
- ✅ Dosya yükleyebiliyor
- ✅ Bildirim alıyor
- ✅ Onboarding tour çalışıyor
- ✅ Danışman onay verebiliyor/reddedebiliyor

---

## 📊 ÇIKTILAR

### **Database:**

```
✅ 11 yeni tablo
✅ 2 mevcut tabloya eklenti
✅ 15+ indeks
✅ 10+ RLS policy
✅ Trigger'lar ve view'lar
```

### **Backend:**

```
✅ 5 core service
✅ 15 API endpoint
✅ Email notification entegrasyonu
✅ File upload (Supabase Storage)
✅ Task dependency resolver
```

### **Frontend:**

```
✅ 6 yeni sayfa
✅ 12 yeni component
✅ Notification bell
✅ Onboarding tour
✅ File upload UI
✅ Task approval UI
```

### **Testing:**

```
✅ 5 unit test dosyası
✅ 3 E2E test dosyası
✅ Test coverage %80+
```

---

## 🔗 BAĞIMLILIKLAR

### **Önce Tamamlanmalı:**

- ✅ Sprint 6 (Odoo Integration Core)

### **Sonraki Sprint'lere Etkisi:**

- ✅ Sprint 7 (Auto-Configuration): Departman yapısı kullanılacak
- ✅ Sprint 9 (Consultant Calendar): Görevler ve takvim entegre olacak

---

## ⚠️ RİSKLER VE AZALTMA

### **Risk 1: Karmaşıklık**

**Risk:** 11 tablo, 5 service, çok fazla özellik  
**Azaltma:** Önce core özellikler, sonra iyileştirmeler  
**Öncelik:** Kritik özellikler ilk 3 gün

### **Risk 2: Email Gönderimi**

**Risk:** Email gönderimi başarısız olabilir  
**Azaltma:** Resend.com veya SendGrid entegrasyonu  
**Fallback:** Platform bildirimi her zaman çalışır

### **Risk 3: Dosya Yükleme**

**Risk:** Büyük dosyalar yavaş yüklenebilir  
**Azaltma:** Supabase Storage kullan, max 50MB limit  
**Progress:** Upload progress bar göster

### **Risk 4: Görev Bağımlılıkları**

**Risk:** Circular dependency oluşabilir  
**Azaltma:** Database constraint ile engelle  
**Validation:** Frontend'de de kontrol et

---

## 📝 NOTLAR

### **Neden Sprint 6.5?**

1. ✅ Sprint 6'nın doğal uzantısı
2. ✅ Kick-off template'i tamamlıyor
3. ✅ Gerçek kullanım senaryosu için kritik
4. ✅ Sprint 7'ye bağımsız (paralel geliştirilebilir)

### **Neden Şimdi?**

1. ✅ Sprint 6 tamamlandı
2. ✅ Template deployment çalışıyor
3. ✅ Ama departman/görev yönetimi eksik
4. ✅ AEKA, Şahbaz, FWA için gerekli

### **Alternatif: Sprint 7'ye Eklemek**

**Dezavantajları:**
- ❌ Sprint 7 çok şişer
- ❌ 2-3 hafta beklemek gerekir
- ❌ Sprint 6 yarım kalır
- ❌ AI olmadan da çalışması gereken bir özellik

---

## ✅ SONRAKI ADIMLAR

1. ✅ Bu dokümanı onayla
2. ⏳ Database migration'ları yaz
3. ⏳ Core service'leri geliştir
4. ⏳ Template'leri güncelle
5. ⏳ API endpoint'leri oluştur
6. ⏳ UI component'leri geliştir
7. ⏳ Test'leri yaz
8. ⏳ Sprint 6.5'i tamamla
9. ⏳ Sprint 7'ye geç

---

**Hazırlayan:** AI Assistant  
**Tarih:** 13 Kasım 2024  
**Versiyon:** 1.0


