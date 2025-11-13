# 🎯 ODOO ORCHESTRATOR - YENİ VİZYON SPRINT PLANI

**Tarih:** 13 Kasım 2024  
**Vizyon:** Template-Driven Odoo Deployment & Management Platform  
**Durum:** Yeniden Yapılandırma

---

## 📊 MEVCUT DURUM ANALİZİ

### **✅ Tamamlanmış ve Korunacak Özellikler:**

```
✅ SPRINT 0: Temel Altyapı (Hafta 1-2)
   • Design System
   • Database Schema
   • Authentication
   • Test Sistemi
   • AI Altyapısı
   • Odoo Bağlantısı (XML-RPC temel)

✅ SPRINT 1: Discovery & Templates (Hafta 3-4)
   • Discovery UI (Ses kaydı)
   • AI-powered Discovery
   • Basit Template System (yeniden tasarlanacak)

✅ SPRINT 4 (Kısmi): Permissions & Logs (Hafta 9-10)
   • Permissions Service
   • Activity Logs

✅ SPRINT 5 (Kısmi): API & Performance (Hafta 11-12)
   • Public API & Webhooks
   • Performance Optimization
   • Production Readiness
```

**Toplam Tamamlanmış:** ~40% gerekli özellikler (yeni vizyona göre)

---

### **❌ Kaldırılan Özellikler:**

```
❌ SPRINT 2: Calendar & Communication (Tümü)
   • Smart Calendar
   • Unified Inbox
   • Communication Hub

❌ SPRINT 3: Automation & Intelligence (Tümü)
   • Test Automation Genişletme
   • Continuous Testing
   • Auto-Fix System
   • Learning System

❌ SPRINT 4 (Kısmi): Customer Portal
   • Portal Dashboard
   • Training Materials
   • Support Tickets

❌ SPRINT 5 (Kısmi): Module System
   • Plugin Architecture

❌ SPRINT 6 (Planlanmış): Mobile App
❌ SPRINT 7 (Planlanmış): Advanced Analytics
```

**Toplam Kaldırılacak:** ~60% gereksiz özellikler

---

## 🗺️ YENİ SPRINT PLANI

### **PHASE 1: CORE INTEGRATION (16-18 hafta / 4-4.5 ay)**

Yeni vizyonun temeli. Odoo entegrasyonu ve template sistemi.

---

## 📅 SPRINT 6: ODOO INTEGRATION CORE

**Süre:** 3-4 hafta  
**Öncelik:** ⭐⭐⭐⭐⭐ (KRİTİK)  
**Durum:** 🆕 Başlanmadı  
**Bağımlılık:** Sprint 0, 1 tamamlandı

### **🎯 Amaç:**

Odoo Orchestrator'ı Odoo ile tam entegre etmek. Template'leri Odoo'ya deploy edebilmek. **Bu sprint olmadan yeni vizyon çalışmaz!**

### **🔑 Neden Yapıyoruz?**

1. **Merkezi Yönetim:** Tüm firma Odoo instance'larını tek yerden yönetmek
2. **Otomatik Deployment:** Template seç → Odoo'ya deploy et → Çalışıyor
3. **Gerçek Zamanlı Sync:** Odoo'dan veri okuma, güncelleme yapma
4. **Ölçeklenebilirlik:** 40+ firma için tek platform

### **⚠️ Dikkat Edilecekler:**

1. **API Limitleri:** Odoo API rate limiting'e dikkat
2. **Güvenlik:** API key'leri şifreli saklanmalı (AES-256)
3. **Hata Yönetimi:** Odoo bağlantı hataları graceful handle edilmeli
4. **Timeout:** Uzun işlemler için timeout mekanizması (5-10 saniye)
5. **Rollback:** Deployment başarısız olursa geri alınabilmeli
6. **Transaction Management:** Tüm deployment atomic olmalı
7. **Progress Tracking:** Kullanıcı deployment ilerlemesini görebilmeli
8. **Error Logging:** Tüm hatalar detaylı loglanmalı

---

### **📦 Deliverables (Teslim Edilecekler):**

#### **1. Odoo Connection Service (Hafta 1)**

**Ne Yapılacak:**

```typescript
// lib/odoo/connection-service.ts
class OdooConnectionService {
  // Bağlantı yönetimi
  async connect(url: string, db: string, username: string, password: string): Promise<Connection>
  async authenticate(): Promise<number> // uid
  async testConnection(): Promise<boolean>
  async disconnect(): Promise<void>

  // CRUD operations
  async create(model: string, data: any): Promise<number>
  async read(model: string, ids: number[], fields?: string[]): Promise<any[]>
  async search(model: string, domain: any[]): Promise<number[]>
  async search_read(model: string, domain: any[], fields?: string[]): Promise<any[]>
  async write(model: string, ids: number[], data: any): Promise<boolean>
  async unlink(model: string, ids: number[]): Promise<boolean>

  // Batch operations
  async batch_create(model: string, dataList: any[]): Promise<number[]>
  async batch_write(model: string, updates: Array<{ ids: number[]; data: any }>): Promise<boolean>

  // Modül yönetimi
  async getInstalledModules(): Promise<string[]>
  async installModule(moduleName: string): Promise<boolean>
  async updateModule(moduleName: string): Promise<boolean>
  async uninstallModule(moduleName: string): Promise<boolean>

  // Konfigürasyon
  async getConfig(key: string): Promise<any>
  async setConfig(key: string, value: any): Promise<boolean>
  async getCompanyInfo(): Promise<CompanyInfo>

  // Utility
  async executeKw(model: string, method: string, args: any[], kwargs?: any): Promise<any>
}
```

**Neden Önemli:**

- Tüm Odoo işlemlerinin temeli
- Hata yönetimi ve retry logic burada
- Connection pooling için hazır
- Timeout ve rate limiting kontrolü

**Teknik Detaylar:**

- XML-RPC protokolü kullanılacak (Odoo standart)
- Connection pool: Max 5 connection per instance
- Retry logic: 3 deneme, exponential backoff
- Timeout: 10 saniye (uzun işlemler için 30 saniye)
- Error handling: Try-catch + custom error types

**Test Edilecekler:**

- ✅ Başarılı bağlantı
- ✅ Hatalı credentials ile bağlantı
- ✅ Timeout senaryosu
- ✅ CRUD operations (her biri)
- ✅ Concurrent requests (10 paralel)
- ✅ Connection pool
- ✅ Retry logic

**Çıktı:**

```
✅ Odoo connection service hazır
✅ Tüm CRUD operations çalışıyor
✅ Error handling robust
✅ Test coverage %100
✅ Dokümantasyon tamamlandı
```

**Süre:** 40 saat (5 gün)

---

#### **2. Odoo Instance Management (Hafta 1-2)**

**Ne Yapılacak:**

```typescript
// lib/services/odoo-instance-service.ts
class OdooInstanceService {
  // Instance oluşturma (Odoo.sh veya Docker)
  async createInstance(companyId: string, config: InstanceConfig): Promise<Instance>

  // Instance yönetimi
  async getInstanceInfo(companyId: string): Promise<Instance>
  async updateInstance(instanceId: string, config: Partial<InstanceConfig>): Promise<Instance>
  async deleteInstance(instanceId: string): Promise<boolean>
  async suspendInstance(instanceId: string): Promise<boolean>
  async resumeInstance(instanceId: string): Promise<boolean>

  // Health check
  async checkHealth(instanceId: string): Promise<HealthStatus>
  async getMetrics(instanceId: string): Promise<Metrics>
  async runDiagnostics(instanceId: string): Promise<DiagnosticReport>

  // Connection helper
  async getConnection(companyId: string): Promise<OdooConnectionService>

  // Backup & Restore
  async createBackup(instanceId: string): Promise<Backup>
  async restoreBackup(instanceId: string, backupId: string): Promise<boolean>
  async listBackups(instanceId: string): Promise<Backup[]>
}
```

**Database Schema:**

```sql
-- supabase/migrations/20251113000001_odoo_instances.sql
CREATE TABLE odoo_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  -- Instance bilgileri
  instance_url TEXT NOT NULL,
  instance_id TEXT,  -- Odoo.sh instance ID veya Docker container ID
  database_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '17.0',

  -- Credentials (encrypted with AES-256)
  admin_username TEXT NOT NULL,
  admin_password_encrypted TEXT NOT NULL,
  api_key_encrypted TEXT,
  encryption_key_id TEXT NOT NULL,  -- Key rotation için

  -- Status
  status TEXT DEFAULT 'active',  -- 'active', 'inactive', 'suspended', 'error', 'deploying'
  health_status JSONB,
  last_health_check TIMESTAMPTZ,
  health_check_interval INTEGER DEFAULT 300,  -- saniye

  -- Deployment info
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES profiles(id),
  deployment_method TEXT,  -- 'odoo_sh', 'docker', 'manual'

  -- Configuration
  modules_installed TEXT[],
  storage_used_mb INTEGER,
  storage_limit_mb INTEGER,
  user_count INTEGER,
  user_limit INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(company_id)
);

-- Indexes
CREATE INDEX idx_odoo_instances_company ON odoo_instances(company_id);
CREATE INDEX idx_odoo_instances_status ON odoo_instances(status);
CREATE INDEX idx_odoo_instances_health_check ON odoo_instances(last_health_check)
  WHERE status = 'active';

-- RLS Policies
ALTER TABLE odoo_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins see all instances"
  ON odoo_instances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

CREATE POLICY "Company admins see own instance"
  ON odoo_instances FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

CREATE POLICY "Super admins manage all instances"
  ON odoo_instances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Instance backups
CREATE TABLE odoo_instance_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES odoo_instances(id) ON DELETE CASCADE,

  -- Backup info
  backup_type TEXT NOT NULL,  -- 'manual', 'automatic', 'pre_deployment'
  size_mb INTEGER,
  storage_path TEXT NOT NULL,

  -- Status
  status TEXT DEFAULT 'creating',  -- 'creating', 'completed', 'failed'
  error_message TEXT,

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_backups_instance ON odoo_instance_backups(instance_id);
CREATE INDEX idx_backups_created_at ON odoo_instance_backups(created_at DESC);
```

**Neden Önemli:**

- Her firma için ayrı Odoo instance
- Merkezi yönetim ve monitoring
- Health check ile proaktif sorun tespiti
- Backup/restore ile veri güvenliği

**Dikkat Edilecekler:**

- **Credentials Encryption:** AES-256 ile şifreleme, key rotation desteği
- **Health Check Interval:** 5 dakika (configurable)
- **Error Notification:** Health check başarısız olursa admin'e bildirim
- **Storage Monitoring:** Depolama limitine yaklaşınca uyarı
- **Backup Strategy:** Günlük otomatik backup, 30 gün saklama

**Test Edilecekler:**

- ✅ Instance oluşturma
- ✅ Health check
- ✅ Credentials encryption/decryption
- ✅ Backup oluşturma
- ✅ Backup restore
- ✅ Instance suspend/resume

**Çıktı:**

```
✅ Instance management service hazır
✅ Database schema oluşturuldu
✅ RLS policies aktif
✅ Health check çalışıyor
✅ Backup/restore çalışıyor
✅ Test coverage %100
```

**Süre:** 48 saat (6 gün)

---

#### **3. Template Deployment Engine (Hafta 2-3)**

**Ne Yapılacak:**

```typescript
// lib/services/template-deployment-service.ts
class TemplateDeploymentService {
  // Kick-off template deployment
  async deployKickoffTemplate(
    instanceId: string,
    template: KickoffTemplate,
    customizations: Customizations
  ): Promise<DeploymentResult>

  // BOM template deployment
  async deployBOMTemplate(instanceId: string, template: BOMTemplate): Promise<DeploymentResult>

  // Workflow template deployment
  async deployWorkflowTemplate(
    instanceId: string,
    template: WorkflowTemplate
  ): Promise<DeploymentResult>

  // Dashboard template deployment
  async deployDashboardTemplate(
    instanceId: string,
    template: DashboardTemplate
  ): Promise<DeploymentResult>

  // Module configuration deployment
  async deployModuleConfig(
    instanceId: string,
    config: ModuleConfigTemplate
  ): Promise<DeploymentResult>

  // Rollback
  async rollbackDeployment(deploymentId: string): Promise<boolean>

  // Validation
  async validateTemplate(template: any): Promise<ValidationResult>
}
```

**Deployment Process (Detaylı):**

```typescript
async deployKickoffTemplate(instanceId, template, customizations) {
  const connection = await this.getConnection(instanceId)
  const deploymentId = generateId()
  let backupId: string | null = null

  try {
    // 0. Deployment kaydı oluştur
    await this.createDeploymentRecord(deploymentId, {
      instanceId,
      templateId: template.id,
      status: 'pending',
      progress: 0
    })

    // 1. Backup mevcut durum
    this.updateProgress(deploymentId, 5, 'Creating backup...')
    backupId = await this.createBackup(instanceId)

    // 2. Template validasyonu
    this.updateProgress(deploymentId, 10, 'Validating template...')
    const validation = await this.validateTemplate(template)
    if (!validation.valid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`)
    }

    // 3. Gerekli modülleri kur
    this.updateProgress(deploymentId, 15, 'Installing required modules...')
    for (const moduleName of template.requiredOdooModules) {
      const installed = await connection.getInstalledModules()
      if (!installed.includes(moduleName)) {
        await connection.installModule(moduleName)
      }
    }

    // 4. Project oluştur
    this.updateProgress(deploymentId, 25, 'Creating project...')
    const projectId = await connection.create('project.project', {
      name: customizations.projectName || template.project.name,
      use_tasks: true,
      use_subtasks: true,
      allow_milestones: true,
      privacy_visibility: 'portal',
      partner_id: customizations.partnerId
    })

    // 5. Project Stages (Phases) oluştur
    this.updateProgress(deploymentId, 35, 'Creating project phases...')
    const stageIds: number[] = []
    for (const phase of template.project.phases) {
      const stageId = await connection.create('project.task.type', {
        name: phase.name,
        description: phase.description,
        project_ids: [[6, 0, [projectId]]],
        sequence: phase.sequence,
        fold: phase.fold || false
      })
      stageIds.push(stageId)
    }

    // 6. Tasks oluştur
    this.updateProgress(deploymentId, 50, 'Creating tasks...')
    for (const task of template.project.tasks) {
      const stageId = stageIds.find(id =>
        // Stage name'e göre eşleştir
        connection.read('project.task.type', [id], ['name'])
          .then(s => s[0].name === task.stage)
      )

      await connection.create('project.task', {
        name: task.name,
        description: task.description,
        project_id: projectId,
        stage_id: stageId,
        planned_hours: task.plannedHours,
        date_deadline: task.deadline ? new Date(task.deadline).toISOString() : null,
        user_ids: task.assignees ? [[6, 0, task.assignees]] : [],
        priority: task.priority || '0',
        tag_ids: task.tags ? [[6, 0, task.tags]] : []
      })
    }

    // 7. Milestones oluştur
    this.updateProgress(deploymentId, 60, 'Creating milestones...')
    for (const milestone of template.project.milestones || []) {
      await connection.create('project.milestone', {
        name: milestone.name,
        project_id: projectId,
        deadline: new Date(milestone.deadline).toISOString(),
        is_reached: false
      })
    }

    // 8. Documents klasörleri oluştur
    this.updateProgress(deploymentId, 70, 'Creating document folders...')
    const folderMap = new Map<string, number>()  // template folder id → odoo folder id

    for (const folder of template.documents.folders) {
      const parentId = folder.parentId ? folderMap.get(folder.parentId) : null

      const folderId = await connection.create('documents.folder', {
        name: folder.name,
        description: folder.description,
        parent_folder_id: parentId || false,
        company_id: await this.getCompanyId(connection)
      })

      folderMap.set(folder.id, folderId)
    }

    // 9. Document tags oluştur
    for (const tag of template.documents.tags || []) {
      await connection.create('documents.tag', {
        name: tag.name,
        color: tag.color || 0
      })
    }

    // 10. Calendar events oluştur
    this.updateProgress(deploymentId, 80, 'Creating calendar events...')
    for (const event of template.calendar.events) {
      await connection.create('calendar.event', {
        name: event.name,
        description: event.description,
        start: new Date(event.start).toISOString(),
        stop: new Date(event.stop).toISOString(),
        location: event.location,
        allday: event.allday || false,
        partner_ids: event.attendees ? [[6, 0, event.attendees]] : [],
        alarm_ids: event.reminders ? [[6, 0, event.reminders]] : []
      })
    }

    // 11. Email templates oluştur (eğer varsa)
    this.updateProgress(deploymentId, 90, 'Creating email templates...')
    for (const emailTemplate of template.emailTemplates || []) {
      const modelId = await this.getModelId(connection, emailTemplate.model)

      await connection.create('mail.template', {
        name: emailTemplate.name,
        model_id: modelId,
        subject: emailTemplate.subject,
        body_html: emailTemplate.bodyHtml,
        auto_delete: false,
        email_from: emailTemplate.emailFrom || '{{ user.email }}'
      })
    }

    // 12. Deployment kaydını güncelle
    this.updateProgress(deploymentId, 100, 'Deployment completed!')
    await this.updateDeploymentRecord(deploymentId, {
      status: 'success',
      progress: 100,
      result: {
        projectId,
        stageIds,
        folderIds: Array.from(folderMap.values())
      },
      completedAt: new Date()
    })

    // 13. Notification gönder
    await this.notifyDeploymentComplete(deploymentId, instanceId)

    return {
      success: true,
      deploymentId,
      projectId,
      message: 'Template başarıyla deploy edildi'
    }

  } catch (error) {
    // Hata durumunda rollback
    console.error('Deployment failed:', error)

    await this.updateDeploymentRecord(deploymentId, {
      status: 'failed',
      errorMessage: error.message,
      completedAt: new Date()
    })

    // Rollback yap (backup'tan geri yükle)
    if (backupId) {
      await this.rollbackDeployment(deploymentId, backupId)
    }

    // Notification gönder
    await this.notifyDeploymentFailed(deploymentId, instanceId, error)

    return {
      success: false,
      deploymentId,
      error: error.message,
      message: 'Deployment başarısız, rollback yapıldı'
    }
  }
}
```

**Database Schema:**

```sql
-- Template deployments
CREATE TABLE template_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES odoo_instances(id) ON DELETE CASCADE,
  template_id UUID NOT NULL,
  template_type TEXT NOT NULL,  -- 'kickoff', 'bom', 'workflow', 'dashboard', 'module_config'

  -- Status
  status TEXT DEFAULT 'pending',  -- 'pending', 'in_progress', 'success', 'failed', 'rolled_back'
  progress INTEGER DEFAULT 0,  -- 0-100
  current_step TEXT,

  -- Result
  result JSONB,
  error_message TEXT,
  error_stack TEXT,

  -- Rollback info
  backup_id UUID REFERENCES odoo_instance_backups(id),
  can_rollback BOOLEAN DEFAULT true,
  rolled_back_at TIMESTAMPTZ,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Metadata
  deployed_by UUID REFERENCES profiles(id),
  customizations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deployments_instance ON template_deployments(instance_id);
CREATE INDEX idx_deployments_status ON template_deployments(status);
CREATE INDEX idx_deployments_created_at ON template_deployments(created_at DESC);

-- Deployment logs
CREATE TABLE deployment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id UUID NOT NULL REFERENCES template_deployments(id) ON DELETE CASCADE,

  level TEXT NOT NULL,  -- 'debug', 'info', 'warning', 'error'
  message TEXT NOT NULL,
  details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deployment_logs_deployment ON deployment_logs(deployment_id);
CREATE INDEX idx_deployment_logs_level ON deployment_logs(level) WHERE level IN ('warning', 'error');
```

**Neden Önemli:**

- Template'leri Odoo'ya otomatik aktarma
- Hata durumunda otomatik rollback
- Progress tracking ile kullanıcı bilgilendirme
- Detaylı logging ile debugging kolaylığı

**Dikkat Edilecekler:**

- **Transaction Management:** Mümkünse tüm işlemler tek transaction'da
- **Rollback Mekanizması:** Backup'tan geri yükleme garantili olmalı
- **Progress Tracking:** Her adımda progress güncellenmeli
- **Error Logging:** Tüm hatalar detaylı loglanmalı
- **Timeout:** Uzun süren deployment'lar için timeout (30 dakika)
- **Validation:** Template deploy edilmeden önce validate edilmeli

**Test Edilecekler:**

- ✅ Kick-off template deployment
- ✅ BOM template deployment
- ✅ Workflow template deployment
- ✅ Dashboard template deployment
- ✅ Rollback mekanizması
- ✅ Progress tracking
- ✅ Error handling
- ✅ Concurrent deployments

**Çıktı:**

```
✅ Template deployment engine hazır
✅ Rollback mekanizması çalışıyor
✅ Progress tracking aktif
✅ Database schema oluşturuldu
✅ Test coverage %100
✅ Dokümantasyon tamamlandı
```

**Süre:** 64 saat (8 gün)

---

#### **4. Deployment Monitoring & UI (Hafta 3-4)**

**Ne Yapılacak:**

```typescript
// lib/services/deployment-monitoring-service.ts
class DeploymentMonitoringService {
  // Deployment durumu
  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus>
  async getActiveDeployments(instanceId: string): Promise<Deployment[]>
  async getDeploymentHistory(instanceId: string, limit?: number): Promise<Deployment[]>

  // Progress tracking
  async trackProgress(deploymentId: string): Promise<ProgressInfo>
  async subscribeToProgress(
    deploymentId: string,
    callback: (progress: ProgressInfo) => void
  ): Promise<Unsubscribe>

  // Logs
  async getDeploymentLogs(deploymentId: string, level?: string): Promise<Log[]>
  async streamLogs(deploymentId: string, callback: (log: Log) => void): Promise<Unsubscribe>

  // Notifications
  async notifyDeploymentComplete(deploymentId: string): Promise<void>
  async notifyDeploymentFailed(deploymentId: string, error: Error): Promise<void>
  async notifyDeploymentProgress(deploymentId: string, progress: number): Promise<void>

  // Statistics
  async getDeploymentStats(instanceId: string): Promise<DeploymentStats>
}
```

**UI Components:**

```tsx
// app/(dashboard)/odoo-instances/[id]/deployments/page.tsx
- Deployment history list
- Active deployments (real-time)
- Deployment detail modal
- Progress bar with steps
- Log viewer (real-time streaming)
- Rollback button
- Deploy new template button

// components/deployments/deployment-progress.tsx
- Real-time progress bar
- Current step indicator
- Estimated time remaining
- Cancel deployment button

// components/deployments/deployment-logs.tsx
- Real-time log streaming
- Log level filtering
- Search logs
- Export logs
```

**API Routes:**

```typescript
// app/api/deployments/[id]/route.ts
GET    /api/deployments/:id           - Get deployment status
DELETE /api/deployments/:id           - Cancel deployment

// app/api/deployments/[id]/logs/route.ts
GET    /api/deployments/:id/logs      - Get deployment logs

// app/api/deployments/[id]/rollback/route.ts
POST   /api/deployments/:id/rollback  - Rollback deployment

// app/api/instances/[id]/deployments/route.ts
GET    /api/instances/:id/deployments - Get instance deployments
POST   /api/instances/:id/deployments - Create new deployment
```

**Real-time Updates:**

```typescript
// Supabase Realtime kullanarak
const subscription = supabase
  .channel(`deployment:${deploymentId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'template_deployments',
      filter: `id=eq.${deploymentId}`,
    },
    payload => {
      // Progress güncellendi
      updateProgressBar(payload.new.progress)
      updateCurrentStep(payload.new.current_step)
    }
  )
  .subscribe()
```

**Neden Önemli:**

- Kullanıcı deployment ilerlemesini görebilir
- Real-time feedback
- Hata durumunda detaylı log
- Deployment history ile audit trail

**Dikkat Edilecekler:**

- **Real-time Updates:** Supabase Realtime ile instant updates
- **Log Streaming:** Büyük log dosyaları için pagination
- **Performance:** Log viewer optimize edilmeli
- **Error Display:** Hatalar user-friendly gösterilmeli

**Test Edilecekler:**

- ✅ Deployment progress tracking
- ✅ Real-time updates
- ✅ Log streaming
- ✅ Rollback UI
- ✅ Deployment history
- ✅ Mobile responsive

**Çıktı:**

```
✅ Deployment monitoring service hazır
✅ UI components tamamlandı
✅ API routes oluşturuldu
✅ Real-time updates çalışıyor
✅ Test coverage %100
✅ Dokümantasyon tamamlandı
```

**Süre:** 40 saat (5 gün)

---

### **✅ Sprint 6 Başarı Kriterleri:**

```
✅ Odoo'ya bağlanabiliyoruz
✅ Instance oluşturabiliyoruz
✅ Template'leri deploy edebiliyoruz
✅ Rollback çalışıyor
✅ Health check aktif
✅ Deployment monitoring çalışıyor
✅ Real-time progress tracking
✅ UI tamamlandı

TEST SENARYOSU:
✅ AEKA Mobilya için Odoo instance oluştur
✅ Mobilya Kick-off template'ini deploy et
✅ Odoo'da project, tasks, folders görünüyor
✅ Deployment başarısız olursa rollback yapılıyor
✅ Progress bar real-time güncelleniyorr
✅ Logs görüntülenebiliyor
```

**Toplam Süre:** 192 saat (24 gün / 3-4 hafta)

---

## 📅 SPRINT 7: AUTO-CONFIGURATION SYSTEM

**Süre:** 3-4 hafta  
**Öncelik:** ⭐⭐⭐⭐⭐ (KRİTİK)  
**Durum:** 🆕 Başlanmadı  
**Bağımlılık:** Sprint 6 tamamlanmalı

### **🎯 Amaç:**

Firma analizinden otomatik Odoo ayarları oluşturmak. **Manuel ayar yok!** Kick-off cevapları → AI analizi → Odoo konfigürasyonu → Deploy.

### **🔑 Neden Yapıyoruz?**

1. **Zaman Tasarrufu:** Manuel ayar: 2 hafta → Otomatik: 10 dakika
2. **Hata Önleme:** Manuel hata riski %30 → Otomatik: %5
3. **Tutarlılık:** Her firma için standart kalite
4. **Ölçeklenebilirlik:** 40+ firma için manuel ayar imkansız
5. **Best Practices:** AI en iyi uygulamaları bilir

### **⚠️ Dikkat Edilecekler:**

1. **AI Doğruluğu:** Yanlış konfigürasyon büyük sorun → Validation katmanı şart
2. **İnsan Onayı:** Kritik ayarlar için onay mekanizması
3. **Versiyonlama:** Konfigürasyon değişiklikleri takip edilmeli
4. **Rollback:** Yanlış ayar geri alınabilmeli
5. **Context Awareness:** Sektöre özel ayarlar
6. **Confidence Score:** AI %80'in altındaysa human review
7. **Testing:** Her konfigürasyon deploy edilmeden test edilmeli

---

### **📦 Deliverables:**

#### **1. Configuration Template System (Hafta 1)**

**Ne Yapılacak:**

```typescript
// lib/types/configuration-templates.ts
interface ModuleConfigTemplate {
  module: string // 'crm', 'project', 'stock', 'mrp', 'sale'
  version: string

  settings: {
    // Genel ayarlar
    general?: Record<string, any>

    // Stages/Aşamalar
    stages?: Array<{
      name: string
      sequence: number
      fold?: boolean
      requirements?: string[]
      description?: string
    }>

    // Tags/Etiketler
    tags?: Array<{
      name: string
      color: number
    }>

    // Custom fields
    customFields?: Array<{
      name: string
      fieldDescription: string
      ttype: string // 'char', 'text', 'integer', 'float', 'date', 'datetime', 'boolean', 'selection', 'many2one'
      required?: boolean
      selection?: Array<[string, string]>
      help?: string
      default?: any
      compute?: string
      store?: boolean
      related?: string
    }>

    // Email templates
    emailTemplates?: Array<{
      name: string
      subject: string
      bodyHtml: string
      model: string
      autoDelete?: boolean
      emailFrom?: string
    }>

    // Automated actions
    automations?: Array<{
      name: string
      trigger: string // 'on_create', 'on_write', 'on_unlink', 'on_time', 'on_change'
      modelName: string
      filterDomain?: string
      action: {
        type: string // 'server_action', 'email', 'next_activity', 'webhook'
        details: any
      }
    }>

    // Views (optional)
    views?: Array<{
      name: string
      type: string // 'tree', 'form', 'kanban', 'calendar', 'pivot', 'graph'
      arch: string // XML
      priority?: number
    }>

    // Reports (optional)
    reports?: Array<{
      name: string
      model: string
      reportType: string // 'qweb-pdf', 'qweb-html'
      template: string
    }>

    // Security rules
    securityRules?: Array<{
      name: string
      modelName: string
      groups?: string[]
      domain?: string
      permRead?: boolean
      permWrite?: boolean
      permCreate?: boolean
      permUnlink?: boolean
    }>
  }

  // Metadata
  metadata: {
    createdFrom?: string // 'ai_generated', 'manual', 'template'
    confidence?: number // 0-1
    reviewRequired?: boolean
    createdAt: Date
    createdBy?: string
  }
}
```

**Örnek: CRM Config Template**

```typescript
const crmConfigTemplate: ModuleConfigTemplate = {
  module: 'crm',
  version: '1.0.0',

  settings: {
    general: {
      use_leads: true,
      auto_assignment: true,
      lead_mining: false,
    },

    stages: [
      {
        name: 'Yeni Talep',
        sequence: 1,
        fold: false,
        requirements: [],
        description: 'İlk temas aşaması',
      },
      {
        name: 'İlk Görüşme',
        sequence: 2,
        fold: false,
        requirements: ['İlk toplantı yapıldı', 'İhtiyaçlar belirlendi'],
      },
      {
        name: 'Teklif Gönderildi',
        sequence: 3,
        fold: false,
        requirements: ['Teklif hazırlandı', 'Teklif onaylandı'],
      },
      {
        name: 'Müzakere',
        sequence: 4,
        fold: false,
        requirements: ['Fiyat görüşmesi yapıldı'],
      },
      {
        name: 'Kazanıldı',
        sequence: 5,
        fold: true,
        description: 'Anlaşma imzalandı',
      },
      {
        name: 'Kaybedildi',
        sequence: 6,
        fold: true,
        description: 'Fırsat kaybedildi',
      },
    ],

    tags: [
      { name: 'Yüksek Değer', color: 1 },
      { name: 'Acil', color: 2 },
      { name: 'Soğuk', color: 3 },
      { name: 'Sıcak', color: 4 },
      { name: 'Referans', color: 5 },
    ],

    customFields: [
      {
        name: 'x_industry',
        fieldDescription: 'Sektör',
        ttype: 'selection',
        required: true,
        selection: [
          ['furniture', 'Mobilya'],
          ['defense', 'Savunma'],
          ['metal', 'Metal'],
          ['service', 'Hizmet'],
        ],
        help: 'Müşterinin faaliyet gösterdiği sektör',
      },
      {
        name: 'x_company_size',
        fieldDescription: 'Firma Büyüklüğü',
        ttype: 'selection',
        selection: [
          ['small', 'Küçük (1-50)'],
          ['medium', 'Orta (51-250)'],
          ['large', 'Büyük (250+)'],
        ],
      },
      {
        name: 'x_annual_revenue',
        fieldDescription: 'Yıllık Ciro (TL)',
        ttype: 'float',
        help: 'Tahmini yıllık ciro',
      },
      {
        name: 'x_decision_maker',
        fieldDescription: 'Karar Verici',
        ttype: 'char',
        help: 'Karar veren kişinin adı ve pozisyonu',
      },
    ],

    emailTemplates: [
      {
        name: 'Hoş Geldiniz Email',
        subject: 'Talebiniz için teşekkürler - ${object.company_id.name}',
        bodyHtml: `
          <p>Sayın ${object.partner_id.name},</p>
          <p>Talebiniz için teşekkür ederiz. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
          <p>Talep No: ${object.name}</p>
          <p>Saygılarımızla,<br/>${object.user_id.name}</p>
        `,
        model: 'crm.lead',
        autoDelete: false,
      },
      {
        name: 'Teklif Gönderim Email',
        subject: 'Teklifimiz - ${object.name}',
        bodyHtml: `
          <p>Sayın ${object.partner_id.name},</p>
          <p>Talebiniz doğrultusunda hazırladığımız teklifi ekte bulabilirsiniz.</p>
          <p>Sorularınız için bizimle iletişime geçebilirsiniz.</p>
          <p>Saygılarımızla,<br/>${object.user_id.name}</p>
        `,
        model: 'crm.lead',
      },
    ],

    automations: [
      {
        name: 'Yeni Lead Bildirimi',
        trigger: 'on_create',
        modelName: 'crm.lead',
        action: {
          type: 'email',
          details: {
            template: 'Hoş Geldiniz Email',
            to: '${object.partner_id.email}',
          },
        },
      },
      {
        name: 'Uzun Süredir İşlem Görmemiş Lead',
        trigger: 'on_time',
        modelName: 'crm.lead',
        filterDomain:
          "[('stage_id.sequence', '<', 5), ('write_date', '<', (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'))]",
        action: {
          type: 'next_activity',
          details: {
            activityType: 'call',
            summary: 'Lead takibi yap',
            note: 'Bu lead 7 gündür güncellenmemiş, takip edilmeli',
          },
        },
      },
    ],
  },

  metadata: {
    createdFrom: 'manual',
    createdAt: new Date(),
    createdBy: 'system',
  },
}
```

**Neden Önemli:**

- Standart konfigürasyon yapısı
- Type-safe configuration
- Validation için schema
- Reusable templates

**Çıktı:**

```
✅ Configuration template types hazır
✅ Örnek template'ler oluşturuldu
✅ Validation schema hazır
✅ Dokümantasyon tamamlandı
```

**Süre:** 24 saat (3 gün)

---

#### **2. AI Configuration Generator (Hafta 2-3)**

**Ne Yapılacak:**

```typescript
// lib/services/ai-configuration-generator.ts
class AIConfigurationGenerator {
  /**
   * Kick-off cevaplarından tüm modül konfigürasyonlarını oluştur
   */
  async generateAllConfigurations(
    companyInfo: CompanyInfo,
    kickoffAnswers: KickoffAnswers
  ): Promise<ModuleConfigurations> {
    const configs: ModuleConfigurations = {}

    // Her modül için konfigürasyon oluştur
    for (const module of kickoffAnswers.modules) {
      switch (module.name) {
        case 'CRM & Satış':
          configs.crm = await this.generateCRMConfig(companyInfo, module.answers)
          break

        case 'Proje Yönetimi':
          configs.project = await this.generateProjectConfig(companyInfo, module.answers)
          break

        case 'Stok Yönetimi':
          configs.stock = await this.generateStockConfig(companyInfo, module.answers)
          break

        case 'Üretim (MRP)':
          configs.mrp = await this.generateMRPConfig(companyInfo, module.answers)
          break

        case 'Satınalma':
          configs.purchase = await this.generatePurchaseConfig(companyInfo, module.answers)
          break

        case 'Kalite Kontrol':
          configs.quality = await this.generateQualityConfig(companyInfo, module.answers)
          break

        case 'Muhasebe':
          configs.accounting = await this.generateAccountingConfig(companyInfo, module.answers)
          break

        case 'İnsan Kaynakları':
          configs.hr = await this.generateHRConfig(companyInfo, module.answers)
          break
      }
    }

    return configs
  }

  /**
   * CRM konfigürasyonu oluştur
   */
  async generateCRMConfig(
    companyInfo: CompanyInfo,
    answers: ModuleAnswers
  ): Promise<ModuleConfigTemplate> {
    const prompt = `
Sen bir Odoo ERP konfigürasyon uzmanısın. Aşağıdaki bilgilere göre Odoo CRM modülü için konfigürasyon oluştur.

FİRMA BİLGİLERİ:
- İsim: ${companyInfo.name}
- Sektör: ${companyInfo.industry}
- Alt Kategori: ${companyInfo.subCategory}
- İş Modeli: ${companyInfo.businessModel}
- Çalışan Sayısı: ${companyInfo.employeeCount}
- Yıllık Ciro: ${companyInfo.annualRevenue}

CRM MODÜLÜ CEVAPLARI:
${JSON.stringify(answers, null, 2)}

OLUŞTURULACAK KONFİGÜRASYON:

1. LEAD STAGES (Aşamalar):
   - Satış sürecine uygun aşamalar
   - Mantıklı sıralama (sequence)
   - Kapatılmış aşamalar (fold: true)
   - Her aşama için requirements
   - Açıklayıcı description'lar

2. TAGS (Etiketler):
   - Müşteri kategorileri
   - Öncelik etiketleri
   - Sektöre özel etiketler
   - Renk kodları (0-11)

3. CUSTOM FIELDS (Özel Alanlar):
   - İş modeline özel alanlar
   - Gerekli bilgiler (required: true/false)
   - Doğru veri tipleri (char, text, integer, float, date, datetime, boolean, selection, many2one)
   - Selection alanları için options
   - Help text'ler
   - Alan isimleri x_ ile başlamalı

4. EMAIL TEMPLATES:
   - Hoş geldiniz email
   - Teklif gönderim email
   - Takip email'leri
   - Odoo template syntax kullan: \${object.field_name}

5. AUTOMATED ACTIONS:
   - Yeni lead bildirimi
   - Aşama değişikliği bildirimleri
   - Otomatik görev oluşturma
   - Uzun süredir işlem görmemiş lead'ler için hatırlatma
   - Trigger types: on_create, on_write, on_time

KURALLAR:
- Türkçe terimler kullan
- Sektöre özel olsun
- Pratik ve kullanılabilir olsun
- Odoo standartlarına uygun olsun
- Gereksiz karmaşıklık ekleme
- Best practices'leri uygula

JSON formatında döndür (ModuleConfigTemplate formatında).
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'Sen bir Odoo ERP konfigürasyon uzmanısın. JSON formatında konfigürasyon oluşturursun. Yanıtın SADECE valid JSON olmalı, başka hiçbir şey içermemeli.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Daha tutarlı sonuçlar için düşük
    })

    const config = JSON.parse(response.choices[0].message.content)

    // Metadata ekle
    config.metadata = {
      createdFrom: 'ai_generated',
      confidence: await this.calculateConfidence(config, answers),
      reviewRequired: config.metadata?.confidence < 0.8,
      createdAt: new Date(),
      createdBy: 'ai',
    }

    // Validation
    const validation = this.validateConfig(config, 'crm')
    if (!validation.valid) {
      throw new Error(`Generated config is invalid: ${validation.errors.join(', ')}`)
    }

    return config
  }

  /**
   * Konfigürasyon confidence score hesapla
   */
  async calculateConfidence(config: ModuleConfigTemplate, answers: ModuleAnswers): Promise<number> {
    // Basit heuristic:
    // - Tüm zorunlu alanlar dolu mu? +0.3
    // - Custom field sayısı makul mu? (3-10) +0.2
    // - Stage sayısı makul mu? (4-8) +0.2
    // - Email template var mı? +0.15
    // - Automation var mı? +0.15

    let score = 0

    // Zorunlu alanlar
    if (config.module && config.settings) score += 0.3

    // Custom fields
    const fieldCount = config.settings.customFields?.length || 0
    if (fieldCount >= 3 && fieldCount <= 10) score += 0.2
    else if (fieldCount > 0) score += 0.1

    // Stages
    const stageCount = config.settings.stages?.length || 0
    if (stageCount >= 4 && stageCount <= 8) score += 0.2
    else if (stageCount > 0) score += 0.1

    // Email templates
    if (config.settings.emailTemplates && config.settings.emailTemplates.length > 0) {
      score += 0.15
    }

    // Automations
    if (config.settings.automations && config.settings.automations.length > 0) {
      score += 0.15
    }

    return Math.min(score, 1.0)
  }

  /**
   * Konfigürasyon validasyonu
   */
  validateConfig(config: ModuleConfigTemplate, module: string): ValidationResult {
    const errors: string[] = []

    // Zorunlu alanlar kontrolü
    if (!config.module || config.module !== module) {
      errors.push(`Invalid module: expected ${module}, got ${config.module}`)
    }

    if (!config.settings) {
      errors.push('Settings is required')
    }

    // Stages kontrolü
    if (config.settings.stages) {
      for (const stage of config.settings.stages) {
        if (!stage.name || typeof stage.sequence !== 'number') {
          errors.push(`Invalid stage: ${JSON.stringify(stage)}`)
        }
      }

      // Sequence unique olmalı
      const sequences = config.settings.stages.map(s => s.sequence)
      if (new Set(sequences).size !== sequences.length) {
        errors.push('Stage sequences must be unique')
      }
    }

    // Custom fields kontrolü
    if (config.settings.customFields) {
      for (const field of config.settings.customFields) {
        if (!field.name || !field.ttype) {
          errors.push(`Invalid custom field: ${JSON.stringify(field)}`)
        }

        // Field name format kontrolü (x_ ile başlamalı)
        if (!field.name.startsWith('x_')) {
          field.name = `x_${field.name}`
        }

        // Selection alanları için options kontrolü
        if (field.ttype === 'selection' && !field.selection) {
          errors.push(`Selection field ${field.name} must have selection options`)
        }
      }
    }

    // Email templates kontrolü
    if (config.settings.emailTemplates) {
      for (const template of config.settings.emailTemplates) {
        if (!template.name || !template.subject || !template.bodyHtml) {
          errors.push(`Invalid email template: ${JSON.stringify(template)}`)
        }
      }
    }

    // Automations kontrolü
    if (config.settings.automations) {
      for (const automation of config.settings.automations) {
        if (!automation.name || !automation.trigger || !automation.modelName) {
          errors.push(`Invalid automation: ${JSON.stringify(automation)}`)
        }

        const validTriggers = ['on_create', 'on_write', 'on_unlink', 'on_time', 'on_change']
        if (!validTriggers.includes(automation.trigger)) {
          errors.push(`Invalid trigger: ${automation.trigger}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Diğer modüller için generate fonksiyonları...
   */
  async generateProjectConfig(
    companyInfo: CompanyInfo,
    answers: ModuleAnswers
  ): Promise<ModuleConfigTemplate> {
    // Benzer yapı...
  }

  async generateStockConfig(
    companyInfo: CompanyInfo,
    answers: ModuleAnswers
  ): Promise<ModuleConfigTemplate> {
    // Benzer yapı...
  }

  async generateMRPConfig(
    companyInfo: CompanyInfo,
    answers: ModuleAnswers
  ): Promise<ModuleConfigTemplate> {
    // Benzer yapı...
  }

  // ... diğer modüller
}
```

**Neden Önemli:**

- AI ile context-aware konfigürasyon
- Sektöre özel ayarlar
- Hızlı ve tutarlı
- Confidence score ile kalite kontrolü

**Dikkat Edilecekler:**

- **AI Hallucination:** Yanlış bilgi üretebilir → Validation şart
- **Confidence Score:** < 0.8 ise human review gerekli
- **Validation:** Her konfigürasyon validate edilmeli
- **Error Handling:** AI hatası durumunda fallback
- **Prompt Engineering:** Prompt'lar optimize edilmeli
- **Cost:** OpenAI API maliyeti hesaplanmalı

**Test Edilecekler:**

- ✅ CRM config generation
- ✅ Project config generation
- ✅ Stock config generation
- ✅ MRP config generation
- ✅ Validation
- ✅ Confidence score calculation
- ✅ Error handling

**Çıktı:**

```
✅ AI configuration generator hazır
✅ 8 modül için generator
✅ Validation çalışıyor
✅ Confidence score hesaplanıyor
✅ Test coverage %100
✅ Dokümantasyon tamamlandı
```

**Süre:** 80 saat (10 gün)

---

#### **3. Configuration Deployment (Hafta 3-4)**

**Ne Yapılacak:**

```typescript
// lib/services/configuration-deployment-service.ts
class ConfigurationDeploymentService {
  /**
   * CRM konfigürasyonunu Odoo'ya deploy et
   */
  async deployCRMConfig(
    instanceId: string,
    config: ModuleConfigTemplate
  ): Promise<DeploymentResult> {
    const connection = await this.getConnection(instanceId)
    const results = []

    try {
      // 1. Stages oluştur
      if (config.settings.stages) {
        for (const stage of config.settings.stages) {
          const stageId = await connection.create('crm.stage', {
            name: stage.name,
            sequence: stage.sequence,
            fold: stage.fold || false,
            requirements: stage.requirements || [],
            description: stage.description || '',
          })
          results.push({ type: 'stage', id: stageId, name: stage.name })
        }
      }

      // 2. Tags oluştur
      if (config.settings.tags) {
        for (const tag of config.settings.tags) {
          const tagId = await connection.create('crm.tag', {
            name: tag.name,
            color: tag.color,
          })
          results.push({ type: 'tag', id: tagId, name: tag.name })
        }
      }

      // 3. Custom fields oluştur
      if (config.settings.customFields) {
        const modelId = await this.getModelId(connection, 'crm.lead')

        for (const field of config.settings.customFields) {
          const fieldId = await connection.create('ir.model.fields', {
            name: field.name,
            field_description: field.fieldDescription,
            model_id: modelId,
            ttype: field.ttype,
            required: field.required || false,
            selection: field.selection ? JSON.stringify(field.selection) : false,
            help: field.help || false,
            default: field.default || false,
            compute: field.compute || false,
            store: field.store !== false, // default true
            related: field.related || false,
          })
          results.push({ type: 'field', id: fieldId, name: field.name })
        }
      }

      // 4. Email templates oluştur
      if (config.settings.emailTemplates) {
        const modelId = await this.getModelId(connection, 'crm.lead')

        for (const template of config.settings.emailTemplates) {
          const templateId = await connection.create('mail.template', {
            name: template.name,
            model_id: modelId,
            subject: template.subject,
            body_html: template.bodyHtml,
            auto_delete: template.autoDelete !== false,
            email_from: template.emailFrom || '{{ user.email }}',
          })
          results.push({ type: 'email_template', id: templateId, name: template.name })
        }
      }

      // 5. Automated actions oluştur
      if (config.settings.automations) {
        const modelId = await this.getModelId(connection, 'crm.lead')

        for (const automation of config.settings.automations) {
          const automationId = await connection.create('base.automation', {
            name: automation.name,
            model_id: modelId,
            trigger: automation.trigger,
            filter_domain: automation.filterDomain || '[]',
            state: automation.action.type === 'email' ? 'email' : 'code',
            // Action details based on type...
          })
          results.push({ type: 'automation', id: automationId, name: automation.name })
        }
      }

      return {
        success: true,
        results,
        message: `${results.length} konfigürasyon başarıyla deploy edildi`,
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results,
      }
    }
  }

  /**
   * Model ID'sini al (cache'li)
   */
  private modelCache = new Map<string, number>()

  async getModelId(connection: OdooConnection, modelName: string): Promise<number> {
    if (this.modelCache.has(modelName)) {
      return this.modelCache.get(modelName)!
    }

    const models = await connection.search_read('ir.model', [['model', '=', modelName]], ['id'])

    if (models.length === 0) {
      throw new Error(`Model not found: ${modelName}`)
    }

    const modelId = models[0].id
    this.modelCache.set(modelName, modelId)
    return modelId
  }

  /**
   * Diğer modüller için deploy fonksiyonları...
   */
  async deployProjectConfig(
    instanceId: string,
    config: ModuleConfigTemplate
  ): Promise<DeploymentResult> {
    // Benzer yapı...
  }

  async deployStockConfig(
    instanceId: string,
    config: ModuleConfigTemplate
  ): Promise<DeploymentResult> {
    // Benzer yapı...
  }

  async deployMRPConfig(
    instanceId: string,
    config: ModuleConfigTemplate
  ): Promise<DeploymentResult> {
    // Benzer yapı...
  }

  // ... diğer modüller
}
```

**UI Components:**

```tsx
// app/(dashboard)/configurations/page.tsx
- Configuration list
- Generate configuration button
- Review configuration modal
- Deploy configuration button
- Configuration history

// components/configurations/config-review.tsx
- Generated configuration preview
- Confidence score display
- Edit configuration
- Approve/Reject buttons

// components/configurations/config-editor.tsx
- Visual configuration editor
- Add/remove stages, fields, etc.
- Validation feedback
- Save changes
```

**API Routes:**

```typescript
// app/api/configurations/generate/route.ts
POST /api/configurations/generate
Body: { companyId, kickoffId }
Response: { configs: ModuleConfigurations }

// app/api/configurations/[id]/deploy/route.ts
POST /api/configurations/:id/deploy
Body: { instanceId }
Response: { deploymentId, results }

// app/api/configurations/[id]/route.ts
GET    /api/configurations/:id
PUT    /api/configurations/:id
DELETE /api/configurations/:id
```

**Database Schema:**

```sql
-- Generated configurations
CREATE TABLE generated_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  kickoff_id UUID REFERENCES discoveries(id),

  -- Configuration
  module TEXT NOT NULL,
  config JSONB NOT NULL,

  -- AI metadata
  confidence DECIMAL(3,2),
  review_required BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Status
  status TEXT DEFAULT 'draft',  -- 'draft', 'approved', 'rejected', 'deployed'
  deployed_at TIMESTAMPTZ,
  deployment_id UUID REFERENCES template_deployments(id),

  -- Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_configs_company ON generated_configurations(company_id);
CREATE INDEX idx_configs_module ON generated_configurations(module);
CREATE INDEX idx_configs_status ON generated_configurations(status);
CREATE INDEX idx_configs_review_required ON generated_configurations(review_required) WHERE review_required = true;
```

**Neden Önemli:**

- Konfigürasyonları Odoo'ya deploy etme
- Human review süreci
- Configuration history
- Rollback desteği

**Dikkat Edilecekler:**

- **Review Process:** Confidence < 0.8 ise human review şart
- **Validation:** Deploy edilmeden önce validate
- **Testing:** Deploy edilmeden önce test ortamında dene
- **Rollback:** Hatalı deployment geri alınabilmeli
- **Audit Trail:** Tüm değişiklikler loglanmalı

**Test Edilecekler:**

- ✅ Configuration deployment
- ✅ Review process
- ✅ Configuration editing
- ✅ Validation
- ✅ Rollback
- ✅ UI components

**Çıktı:**

```
✅ Configuration deployment service hazır
✅ UI components tamamlandı
✅ API routes oluşturuldu
✅ Database schema hazır
✅ Review process çalışıyor
✅ Test coverage %100
✅ Dokümantasyon tamamlandı
```

**Süre:** 64 saat (8 gün)

---

### **✅ Sprint 7 Başarı Kriterleri:**

```
✅ Kick-off cevaplarından otomatik konfigürasyon oluşturuluyor
✅ AI %80+ doğrulukla çalışıyor
✅ Konfigürasyonlar Odoo'ya deploy ediliyor
✅ Validation çalışıyor
✅ Review process aktif
✅ Rollback mekanizması çalışıyor
✅ UI tamamlandı

TEST SENARYOSU:
✅ AEKA Mobilya kick-off cevapları → Tüm modül config'leri oluştur
✅ CRM config'i review et
✅ Confidence score > 0.8
✅ Config'i Odoo'ya deploy et
✅ Odoo'da stages, tags, fields görünüyor
✅ Email templates çalışıyor
✅ Automated actions tetikleniyor
✅ Hatalı config geri alınabiliyor
```

**Toplam Süre:** 168 saat (21 gün / 3 hafta)

---

## 📊 SPRINT 6-7 ÖZET

**Toplam Süre:** 360 saat (45 gün / 6-7 hafta)

**Tamamlanan:**

- ✅ Odoo Integration Core
- ✅ Instance Management
- ✅ Template Deployment Engine
- ✅ Deployment Monitoring
- ✅ Configuration Template System
- ✅ AI Configuration Generator
- ✅ Configuration Deployment

**Sonraki Sprint'ler:**

- Sprint 8: Template Library (Core)
- Sprint 9: Consultant Calendar & Feedback Loop
- Sprint 10: Website Builder & Translation
- Sprint 11: Template Marketplace & Evolution

---

**Hazırlayan:** AI Assistant  
**Tarih:** 13 Kasım 2024  
**Versiyon:** 2.0 (Yeni Vizyon)
