# 🎯 SPRINT 9: CONSULTANT CALENDAR, FEEDBACK LOOP & TEMPLATE CUSTOMIZATION

**Tarih:** 15 Kasım 2024  
**Süre:** 3-4 hafta (200 saat)  
**Durum:** 🆕 Planlandı  
**Öncelik:** ⭐⭐⭐⭐ YÜKSEK  
**Bağımlılık:** Sprint 6 ✅, Sprint 7 ✅, Sprint 8 ✅

---

## 🎯 AMAÇ

Danışman takvimi, feedback loop sistemi ve template customization özelliklerini birleştirerek tam bir template yönetim ve iyileştirme sistemi oluşturmak.

---

## 📦 DELIVERABLES

### **BÖLÜM 1: CONSULTANT CALENDAR SYSTEM (Hafta 1)**

#### **1.1 Consultant Calendar Management**

- ✅ Consultant takvim görünümü
- ✅ Müsaitlik yönetimi (working hours, availability slots)
- ✅ Gizlilik ayarları (hangi bilgiler paylaşılacak)
- ✅ Odoo calendar ile senkronizasyon
- ✅ Google Calendar / Outlook sync

#### **1.2 Meeting Request System**

- ✅ Firmaların randevu talep etmesi
- ✅ Randevu onay/red sistemi
- ✅ Otomatik müsaitlik kontrolü
- ✅ Email/SMS bildirimleri
- ✅ Toplantı hazırlık otomasyonu

**Süre:** 40 saat

---

### **BÖLÜM 2: FEEDBACK COLLECTION SYSTEM (Hafta 1-2)**

#### **2.1 Deployment Feedback**

- ✅ Deployment sonrası otomatik feedback formu
- ✅ Template kullanım feedback'i
- ✅ Sorun bildirme sistemi
- ✅ İyileştirme önerileri
- ✅ Rating sistemi (1-5 yıldız)

#### **2.2 Feedback Analytics**

- ✅ Feedback dashboard
- ✅ Sentiment analysis
- ✅ Common issues tracking
- ✅ Success rate metrics
- ✅ Feedback trends

**Süre:** 32 saat

---

### **BÖLÜM 3: TEMPLATE CUSTOMIZATION (Hafta 2)**

#### **3.1 Template Customization UI**

- ✅ Template özelleştirme sayfası
- ✅ Custom field ekleme/çıkarma/düzenleme
- ✅ Workflow düzenleme
- ✅ Dashboard customization
- ✅ Module selection customization
- ✅ Visual template editor

#### **3.2 Customization Engine**

- ✅ Template fork/clone sistemi
- ✅ Customization diff görüntüleme
- ✅ Customization validation
- ✅ Customization deployment
- ✅ Customization rollback

**Süre:** 48 saat

---

### **BÖLÜM 4: TEMPLATE VERSIONING (Hafta 2-3)**

#### **4.1 Version Management**

- ✅ Template versioning sistemi
- ✅ Version history
- ✅ Version comparison UI
- ✅ Changelog tracking
- ✅ Semantic versioning (v1.0.0)

#### **4.2 Version Operations**

- ✅ Rollback functionality
- ✅ Version merge
- ✅ Branch management
- ✅ Version deployment
- ✅ Version testing

**Süre:** 32 saat

---

### **BÖLÜM 5: TEMPLATE EVOLUTION ENGINE (Hafta 3)**

#### **5.1 Automated Evolution**

- ✅ Feedback'lerden otomatik iyileştirme önerileri
- ✅ Kullanım istatistikleri analizi
- ✅ A/B testing için template versiyonlama
- ✅ Performance metrics tracking
- ✅ Success rate optimization

#### **5.2 Evolution Dashboard**

- ✅ Template health score
- ✅ Usage analytics
- ✅ Success rate tracking
- ✅ Performance metrics
- ✅ Evolution recommendations

**Süre:** 24 saat

---

### **BÖLÜM 6: TEMPLATE ANALYTICS (Hafta 3-4)**

#### **6.1 Analytics Dashboard**

- ✅ Template usage statistics
- ✅ Deployment success rates
- ✅ User satisfaction metrics
- ✅ Performance tracking
- ✅ ROI analysis

#### **6.2 Reporting**

- ✅ Template performance reports
- ✅ Usage reports
- ✅ Feedback summary reports
- ✅ Custom report builder
- ✅ Export functionality (PDF, Excel)

**Süre:** 24 saat

---

## 📅 HAFTA 1: CONSULTANT CALENDAR & FEEDBACK

### **Gün 1-3: Consultant Calendar System**

**Yapılacaklar:**

1. Database schema (consultant_calendar, meeting_requests)
2. Consultant calendar UI
3. Availability management
4. Privacy settings
5. Calendar sync (Odoo, Google, Outlook)

**Süre:** 24 saat

### **Gün 4-5: Meeting Request System**

**Yapılacaklar:**

1. Meeting request form
2. Approval workflow
3. Availability checking
4. Notification system
5. Meeting preparation automation

**Süre:** 16 saat

### **Gün 6-7: Feedback Collection**

**Yapılacaklar:**

1. Feedback form UI
2. Feedback API endpoints
3. Rating system
4. Feedback storage
5. Basic analytics

**Süre:** 16 saat

---

## 📅 HAFTA 2: TEMPLATE CUSTOMIZATION

### **Gün 8-10: Customization UI**

**Yapılacaklar:**

1. Template editor UI
2. Custom field management
3. Workflow editor
4. Dashboard customization
5. Visual editor components

**Süre:** 24 saat

### **Gün 11-12: Customization Engine**

**Yapılacaklar:**

1. Template fork/clone logic
2. Customization diff engine
3. Customization validation
4. Customization deployment
5. Rollback mechanism

**Süre:** 16 saat

### **Gün 13-14: Version Management**

**Yapılacaklar:**

1. Versioning system
2. Version history UI
3. Version comparison
4. Rollback functionality
5. Changelog system

**Süre:** 16 saat

---

## 📅 HAFTA 3: TEMPLATE EVOLUTION & ANALYTICS

### **Gün 15-17: Evolution Engine**

**Yapılacaklar:**

1. Feedback analysis engine
2. Usage statistics analysis
3. Automated improvement suggestions
4. A/B testing framework
5. Performance optimization

**Süre:** 24 saat

### **Gün 18-19: Analytics Dashboard**

**Yapılacaklar:**

1. Analytics UI
2. Metrics visualization
3. Report generation
4. Export functionality
5. Custom report builder

**Süre:** 16 saat

### **Gün 20-21: Integration & Testing**

**Yapılacaklar:**

1. System integration
2. End-to-end testing
3. Performance optimization
4. Documentation
5. User training materials

**Süre:** 16 saat

---

## 🗄️ DATABASE SCHEMA

### **Yeni Tablolar:**

1. **consultant_calendar**
   - consultant_id (FK to profiles)
   - working_hours (JSONB)
   - availability_slots (JSONB)
   - privacy_settings (JSONB)
   - sync_settings (JSONB)

2. **meeting_requests**
   - id (UUID)
   - consultant_id (FK)
   - company_id (FK)
   - requested_by (FK to profiles)
   - requested_date (TIMESTAMPTZ)
   - duration_minutes (INTEGER)
   - status (pending, approved, rejected, cancelled)
   - meeting_type (discovery, support, review)
   - notes (TEXT)
   - created_at, updated_at

3. **template_customizations**
   - id (UUID)
   - template_id (FK to template_library)
   - base_template_id (FK)
   - customizations (JSONB)
   - version (TEXT)
   - created_by (FK)
   - created_at, updated_at

4. **template_versions**
   - id (UUID)
   - template_id (FK)
   - version (TEXT)
   - changelog (TEXT)
   - structure (JSONB)
   - is_current (BOOLEAN)
   - created_at

5. **template_feedback**
   - id (UUID)
   - template_id (FK)
   - deployment_id (FK)
   - company_id (FK)
   - rating (INTEGER 1-5)
   - feedback_text (TEXT)
   - issues (JSONB)
   - suggestions (JSONB)
   - sentiment (TEXT)
   - created_at

6. **template_analytics**
   - id (UUID)
   - template_id (FK)
   - date (DATE)
   - usage_count (INTEGER)
   - success_count (INTEGER)
   - failure_count (INTEGER)
   - avg_rating (DECIMAL)
   - avg_deployment_time (INTEGER)
   - created_at

---

## 🎨 UI COMPONENTS

### **Consultant Calendar:**

- `components/consultant/calendar-view.tsx`
- `components/consultant/availability-manager.tsx`
- `components/consultant/privacy-settings.tsx`
- `components/consultant/meeting-request-form.tsx`
- `components/consultant/meeting-request-list.tsx`

### **Template Customization:**

- `components/templates/customization-editor.tsx`
- `components/templates/field-editor.tsx`
- `components/templates/workflow-editor.tsx`
- `components/templates/dashboard-editor.tsx`
- `components/templates/customization-diff.tsx`

### **Version Management:**

- `components/templates/version-history.tsx`
- `components/templates/version-comparison.tsx`
- `components/templates/rollback-dialog.tsx`
- `components/templates/changelog-view.tsx`

### **Analytics:**

- `components/templates/analytics-dashboard.tsx`
- `components/templates/metrics-chart.tsx`
- `components/templates/feedback-summary.tsx`
- `components/templates/report-builder.tsx`

---

## 🔌 API ENDPOINTS

### **Consultant Calendar:**

- `GET /api/consultant/calendar` - Get consultant calendar
- `POST /api/consultant/calendar/availability` - Update availability
- `GET /api/consultant/meetings` - Get meetings
- `POST /api/consultant/meetings/request` - Request meeting
- `POST /api/consultant/meetings/[id]/approve` - Approve meeting
- `POST /api/consultant/meetings/[id]/reject` - Reject meeting

### **Template Customization:**

- `POST /api/templates/[id]/customize` - Create customization
- `GET /api/templates/[id]/customizations` - Get customizations
- `PUT /api/templates/customizations/[id]` - Update customization
- `POST /api/templates/customizations/[id]/deploy` - Deploy customization
- `POST /api/templates/customizations/[id]/rollback` - Rollback customization

### **Template Versioning:**

- `POST /api/templates/[id]/versions` - Create new version
- `GET /api/templates/[id]/versions` - Get version history
- `GET /api/templates/versions/[id]` - Get version details
- `POST /api/templates/versions/[id]/deploy` - Deploy version
- `POST /api/templates/versions/[id]/rollback` - Rollback to version

### **Feedback:**

- `POST /api/templates/[id]/feedback` - Submit feedback
- `GET /api/templates/[id]/feedback` - Get feedback list
- `GET /api/templates/[id]/feedback/stats` - Get feedback statistics
- `GET /api/templates/[id]/feedback/analytics` - Get feedback analytics

### **Analytics:**

- `GET /api/templates/[id]/analytics` - Get template analytics
- `GET /api/templates/analytics/dashboard` - Get analytics dashboard
- `GET /api/templates/analytics/reports` - Generate reports
- `POST /api/templates/analytics/reports/custom` - Create custom report

---

## 🔧 SERVICES

### **ConsultantCalendarService**

- `getCalendar(consultantId)`
- `updateAvailability(consultantId, availability)`
- `getMeetings(consultantId, filters)`
- `requestMeeting(request)`
- `approveMeeting(meetingId)`
- `rejectMeeting(meetingId)`
- `syncWithOdoo(consultantId)`
- `syncWithGoogle(consultantId)`

### **TemplateCustomizationService**

- `createCustomization(templateId, customizations)`
- `getCustomizations(templateId)`
- `updateCustomization(customizationId, updates)`
- `deployCustomization(customizationId)`
- `rollbackCustomization(customizationId)`
- `getCustomizationDiff(customizationId)`
- `validateCustomization(customization)`

### **TemplateVersioningService**

- `createVersion(templateId, changes)`
- `getVersions(templateId)`
- `getVersion(versionId)`
- `compareVersions(version1Id, version2Id)`
- `deployVersion(versionId)`
- `rollbackToVersion(versionId)`
- `getChangelog(templateId)`

### **FeedbackService**

- `submitFeedback(feedback)`
- `getFeedback(templateId, filters)`
- `getFeedbackStats(templateId)`
- `analyzeFeedback(templateId)`
- `getSentimentAnalysis(templateId)`

### **TemplateAnalyticsService**

- `getAnalytics(templateId, dateRange)`
- `getUsageStats(templateId)`
- `getSuccessRate(templateId)`
- `getPerformanceMetrics(templateId)`
- `generateReport(templateId, reportType)`
- `getEvolutionRecommendations(templateId)`

---

## ✅ BAŞARI KRİTERLERİ

- ✅ Consultant calendar sistemi çalışıyor
- ✅ Meeting request sistemi aktif
- ✅ Feedback collection çalışıyor
- ✅ Template customization UI hazır
- ✅ Template versioning sistemi aktif
- ✅ Template evolution engine çalışıyor
- ✅ Analytics dashboard hazır
- ✅ Tüm API endpoints çalışıyor
- ✅ Test coverage %80+

---

## 🚀 İLK ADIMLAR

1. Database schema oluştur (consultant_calendar, meeting_requests, template_customizations, template_versions, template_feedback, template_analytics)
2. Consultant calendar UI sayfası oluştur
3. Meeting request form oluştur
4. Template customization editor başlat
5. Version management UI oluştur

---

**Toplam Süre:** 200 saat (25 gün / 3-4 hafta)

**Hazırlayan:** AI Assistant  
**Tarih:** 15 Kasım 2024  
**Versiyon:** 1.0








