# 🔄 Günlük Commit Workflow

## 📅 Günlük Çalışma Akışı

### **Sabah Başlangıç**

```bash
# 1. Son değişiklikleri çek
git checkout develop
git pull origin develop

# 2. Yeni feature branch oluştur
git checkout -b feature/my-feature-name
```

### **Çalışma Sırasında**

**Her mantıklı değişiklik için commit:**

```bash
# Örnek: Form eklendi
git add app/(dashboard)/companies/new/page.tsx
git commit -m "feat(companies): add company creation form"

# Örnek: Bug düzeltildi
git add app/(dashboard)/companies/new/page.tsx
git commit -m "fix(companies): fix loading state bug"

# Örnek: Test eklendi
git add e2e/companies.spec.ts
git commit -m "test(e2e): add company creation tests"
```

**Pre-commit hook otomatik çalışır:**
- ✅ Lint kontrolü
- ✅ Format kontrolü
- ✅ Type-check (kritik dosyalarda)
- ✅ Build kontrolü (kritik dosyalarda)
- ✅ Unit testler (ilgili dosyalarda)

### **Öğle Arası / Ara Verme**

```bash
# Değişiklikleri kaydet (commit et)
git add .
git commit -m "wip: work in progress - [kısa açıklama]"

# Veya stash kullan
git stash save "work in progress"
```

### **Gün Sonu**

```bash
# 1. Tüm commit'leri push et
git push origin feature/my-feature-name

# 2. PR oluştur (GitHub/GitLab)
# 3. Review bekle
```

---

## 🎯 Commit Yapma Zamanları

### **✅ Commit Yapılmalı:**

1. **Bir özellik tamamlandığında**
   ```bash
   feat(companies): add company edit page
   ```

2. **Bir bug düzeltildiğinde**
   ```bash
   fix(auth): resolve loading state bug
   ```

3. **Testler eklendiğinde**
   ```bash
   test(e2e): add real user scenario tests
   ```

4. **Küçük ama mantıklı değişiklikler**
   ```bash
   chore: add type-check to pre-commit
   ```

5. **Dokümantasyon güncellendiğinde**
   ```bash
   docs: update commit strategy guide
   ```

### **❌ Commit Yapılmamalı:**

1. **Çalışmayan kod**
   - Pre-commit hook engeller zaten

2. **Yarım kalmış özellikler**
   - WIP commit kullanılabilir ama önerilmez

3. **Debug kodları**
   - Console.log, debugger, vb.

4. **Gereksiz dosyalar**
   - .env.local, node_modules, vb.

---

## 📊 Örnek Günlük Workflow

### **Senaryo: Company CRUD Özelliği Geliştirme**

```bash
# 09:00 - Başlangıç
git checkout develop
git pull origin develop
git checkout -b feature/company-crud

# 09:30 - Company list page
git add app/(dashboard)/companies/page.tsx
git commit -m "feat(companies): add company list page"

# 11:00 - Company creation form
git add app/(dashboard)/companies/new/page.tsx
git commit -m "feat(companies): add company creation form"

# 12:00 - Öğle arası
git push origin feature/company-crud

# 14:00 - Bug fix
git add app/(dashboard)/companies/new/page.tsx
git commit -m "fix(companies): resolve foreign key constraint error"

# 15:00 - Tests
git add e2e/companies.spec.ts
git commit -m "test(e2e): add company CRUD tests"

# 16:00 - Company detail page
git add app/(dashboard)/companies/[id]/page.tsx
git commit -m "feat(companies): add company detail page"

# 17:00 - Gün sonu
git push origin feature/company-crud
# PR oluştur
```

**Sonuç:** 6 mantıklı commit, her biri bir şeyi çözüyor.

---

## 🔀 Branch Stratejisi

### **Branch Tipleri**

```bash
feature/company-crud      # Yeni özellik
fix/loading-state-bug     # Bug düzeltme
test/add-e2e-tests       # Test ekleme
refactor/api-routes       # Kod iyileştirme
docs/commit-strategy      # Dokümantasyon
```

### **Branch Workflow**

```bash
# 1. Feature branch oluştur
git checkout -b feature/my-feature

# 2. Değişiklikleri yap ve commit et
git commit -m "feat: ..."

# 3. Push et
git push origin feature/my-feature

# 4. PR oluştur ve merge et
# GitHub/GitLab üzerinden

# 5. Branch'i sil (merge sonrası)
git branch -d feature/my-feature
```

---

## 💡 İpuçları

1. **Küçük ve sık commit yapın**
   - Her commit bir şeyi çözmeli
   - Geriye dönük takip kolaylaşır

2. **Commit mesajını açıklayıcı yazın**
   - 6 ay sonra ne yaptığınızı anlayabilmelisiniz
   - Conventional Commits formatını kullanın

3. **Pre-commit hook'a güvenin**
   - Otomatik kontrol yapar
   - Hatalı kod commit edilemez

4. **Feature branch'lerde çalışın**
   - Main branch'i koruyun
   - Her özellik için ayrı branch

5. **Gün sonunda push yapın**
   - Değişiklikleri kaydedin
   - Backup olarak çalışır

---

## 🚨 Acil Durumlar

### **Yanlış Commit Mesajı**

```bash
# Son commit mesajını düzelt
git commit --amend -m "feat(companies): add company form"
```

### **Unutulan Dosya Ekleme**

```bash
# Son commit'e dosya ekle
git add forgotten-file.ts
git commit --amend --no-edit
```

### **Commit Geri Alma**

```bash
# Son commit'i geri al (değişiklikler kalır)
git reset --soft HEAD~1

# Son commit'i geri al (değişiklikler silinir)
git reset --hard HEAD~1
```

---

## 📋 Günlük Checklist

**Sabah:**
- [ ] Develop branch'ini çek
- [ ] Yeni feature branch oluştur

**Çalışma Sırasında:**
- [ ] Her mantıklı değişiklik için commit
- [ ] Pre-commit hook'un çalıştığını kontrol et

**Gün Sonu:**
- [ ] Tüm commit'leri push et
- [ ] PR oluştur (eğer feature tamamlandıysa)

---

**Son Güncelleme:** 2025-01-09




