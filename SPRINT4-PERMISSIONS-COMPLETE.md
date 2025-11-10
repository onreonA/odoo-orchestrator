# Sprint 4 - Permissions Service ✅

**Tarih:** 2025-11-12  
**Durum:** ✅ Tamamlandı

---

## 🎯 Yapılanlar

### 1. Permissions Service ✅

#### Oluşturulan Dosya:
- ✅ `lib/services/permissions-service.ts`

#### Özellikler:
- **Role-based Permissions**: Her rol için izin seti
- **Resource-based Checks**: Company, Project, Discovery, Ticket, User, Template
- **Action-based Checks**: View, Create, Update, Delete, Manage
- **Company Access Control**: Kullanıcı sadece kendi firmasına erişebilir
- **Project Access Control**: Kullanıcı sadece kendi firmasının projelerine erişebilir

#### Roller ve İzinler:

**Super Admin:**
- ✅ Tüm firmalara erişim
- ✅ Tüm kaynakları yönetme
- ✅ Platform yönetimi
- ✅ Admin panel erişimi

**Company Admin:**
- ✅ Kendi firmasının tüm verileri
- ✅ Kullanıcı yönetimi (kendi firması)
- ✅ Proje yönetimi (kendi firması)
- ✅ Destek talepleri yönetimi
- ✅ Admin panel erişimi

**Company User:**
- ✅ Kendi firmasının projelerini görüntüleme
- ✅ Kendi ticket'larını yönetme
- ✅ Discovery'leri görüntüleme
- ✅ Customer portal erişimi

**Company Viewer:**
- ✅ Sadece görüntüleme izinleri
- ✅ Customer portal erişimi

#### Metodlar:
- `getUserRole()` - Kullanıcı rolünü getir
- `getUserCompanyId()` - Kullanıcının company_id'sini getir
- `getUserPermissions()` - Kullanıcının izinlerini getir
- `getPermissionsForRole()` - Role göre izinleri getir
- `checkPermission()` - İzin kontrolü yap
- `canAccessCompany()` - Company erişimi kontrol et
- `canAccessProject()` - Project erişimi kontrol et

---

### 2. Permission Helpers ✅

#### Oluşturulan Dosya:
- ✅ `lib/utils/permissions.ts`

#### Özellikler:
- **API Route Helpers**: `requirePermission`, `requireRole`, `requireCompanyAccess`, `requireProjectAccess`
- **Component Helpers**: `getUserPermissions`, `getUserRole`

#### Kullanım Örnekleri:

**API Route'da:**
```typescript
// İzin kontrolü
const { allowed, userId, reason } = await requirePermission({
  resource: 'company',
  action: 'update',
  resourceId: companyId
})

if (!allowed) {
  return NextResponse.json({ error: reason }, { status: 403 })
}

// Rol kontrolü
const { allowed, role } = await requireRole(['super_admin', 'company_admin'])

// Company erişimi kontrolü
const { allowed } = await requireCompanyAccess(companyId)
```

**Component'te:**
```typescript
const permissions = await getUserPermissions()
const role = await getUserRole()

if (permissions?.canManageProjects) {
  // Proje yönetimi UI göster
}
```

---

### 3. Middleware Güncellemesi ✅

#### Güncellenen Dosya:
- ✅ `middleware.ts`

#### Eklenenler:
- **Role-based Route Protection**: Admin-only ve super admin-only route'lar
- **Admin Routes**: `/dashboard/admin`, `/dashboard/settings`
- **Super Admin Routes**: `/dashboard/admin`

#### Özellikler:
- Admin-only route'lar için rol kontrolü
- Super admin-only route'lar için rol kontrolü
- Yetkisiz erişimde dashboard'a yönlendirme

---

## 📊 Kullanım Senaryoları

### Senaryo 1: Company Admin Kullanıcı Ekleme
```typescript
// API Route
const { allowed } = await requirePermission({
  resource: 'user',
  action: 'create'
})

if (!allowed) {
  return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
}

// Company admin sadece kendi firmasının kullanıcılarını ekleyebilir
const userCompanyId = await PermissionsService.getUserCompanyId(userId)
// Yeni kullanıcıyı aynı company_id ile oluştur
```

### Senaryo 2: Company User Proje Görüntüleme
```typescript
// API Route
const { allowed } = await requireProjectAccess(projectId)

if (!allowed) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}

// Proje bilgilerini getir
```

### Senaryo 3: Component'te İzin Kontrolü
```typescript
// Component
const permissions = await getUserPermissions()

{permissions?.canManageProjects && (
  <button>Yeni Proje Ekle</button>
)}
```

---

## 🔒 Güvenlik

### Database Level (RLS)
- ✅ RLS policies mevcut (migration'larda)
- ✅ Company-based filtering
- ✅ Role-based access

### Application Level
- ✅ Permissions service ile kontrol
- ✅ Middleware ile route protection
- ✅ API route'larda permission checks

### Best Practices
- ✅ Her API route'da permission check
- ✅ Component'lerde conditional rendering
- ✅ Middleware ile route-level protection

---

## 🚀 Sonraki Adımlar

### Adım 2: Company Admin Portal
- [ ] Company admin dashboard
- [ ] User management UI
- [ ] Project tracking UI
- [ ] Support tickets management

### Adım 3: Company User Portal
- [ ] Company user dashboard
- [ ] Limited access UI
- [ ] Training materials UI

---

**Son Güncelleme:** 2025-11-12  
**Durum:** ✅ Permissions Service tamamlandı, Company Admin Portal'a geçilebilir

