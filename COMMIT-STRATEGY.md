# 📝 Commit Stratejisi ve Best Practices

## 🎯 Amaç

**Düzenli, anlamlı ve takip edilebilir commit'ler** ile:

- Proje geçmişini kolayca anlamak
- Hataları geriye dönük bulmak
- Takım çalışmasını kolaylaştırmak
- Otomatik changelog oluşturmak

---

## 📋 Commit Stratejisi

### **1. Conventional Commits Standardı**

**Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Örnekler:**

```bash
feat(companies): add company creation form
fix(auth): resolve RLS policy error on registration
test(e2e): add database error handling tests
docs(readme): update installation instructions
refactor(api): simplify company delete endpoint
```

### **2. Commit Tipleri**

| Tip        | Açıklama                  | Örnek                                     |
| ---------- | ------------------------- | ----------------------------------------- |
| `feat`     | Yeni özellik              | `feat(companies): add company edit page`  |
| `fix`      | Bug düzeltmesi            | `fix(auth): fix loading state bug`        |
| `test`     | Test ekleme/düzeltme      | `test(e2e): add real user scenario tests` |
| `docs`     | Dokümantasyon             | `docs(readme): add commit strategy guide` |
| `refactor` | Kod iyileştirme           | `refactor(api): simplify error handling`  |
| `style`    | Formatting                | `style: format code with prettier`        |
| `chore`    | Build/tool değişiklikleri | `chore: update dependencies`              |
| `perf`     | Performance iyileştirme   | `perf(db): optimize company query`        |
| `ci`       | CI/CD değişiklikleri      | `ci: add build check to pre-commit`       |

### **3. Scope (Kapsam)**

**Kullanım:**

- Modül/feature adı: `feat(companies): ...`
- Component: `fix(dashboard): ...`
- API: `refactor(api): ...`
- Test: `test(e2e): ...`

**Opsiyonel:** Küçük değişikliklerde scope kullanmayabilirsiniz.

---

## ⏰ Commit Sıklığı Stratejisi

### **Önerilen Yaklaşım: Feature-Based Commits**

**❌ Yapma:**

```bash
# Tüm günün değişikliklerini tek commit'te
git commit -m "bug fixes and features"
```

**✅ Yap:**

```bash
# Her mantıklı değişiklik için ayrı commit
git commit -m "feat(companies): add company creation form"
git commit -m "fix(companies): resolve foreign key constraint error"
git commit -m "test(e2e): add database error handling tests"
```

### **Commit Yapma Zamanları**

1. **Bir özellik tamamlandığında**

   ```bash
   # Company creation form tamamlandı
   git commit -m "feat(companies): add company creation form"
   ```

2. **Bir bug düzeltildiğinde**

   ```bash
   # Loading state bug düzeltildi
   git commit -m "fix(companies): fix loading state on form submit"
   ```

3. **Testler eklendiğinde**

   ```bash
   # Yeni testler yazıldı
   git commit -m "test(e2e): add real user scenario tests"
   ```

4. **Küçük ama mantıklı değişiklikler**
   ```bash
   # Type-check eklendi
   git commit -m "chore: add type-check to pre-commit hook"
   ```

### **Commit Yapmama Zamanları**

- ❌ Çalışmayan kod commit etme
- ❌ Yarım kalmış özellikler commit etme
- ❌ Test edilmemiş değişiklikler commit etme
- ❌ Debug kodları commit etme

---

## 🔀 Branch Stratejisi

### **Ana Branch'ler**

```
main (production-ready kod)
  └── develop (development branch)
      └── feature/company-crud
      └── feature/dashboard
      └── fix/loading-state-bug
      └── test/add-e2e-tests
```

### **Branch İsimlendirme**

**Format:** `<type>/<kısa-açıklama>`

**Örnekler:**

```bash
feature/company-crud
feature/dashboard-stats
fix/loading-state-bug
fix/rls-policy-error
test/add-e2e-tests
refactor/api-routes
docs/commit-strategy
```

### **Workflow**

1. **Feature için:**

   ```bash
   git checkout -b feature/company-edit-page
   # ... değişiklikler ...
   git commit -m "feat(companies): add edit page"
   git push origin feature/company-edit-page
   # Pull request oluştur
   ```

2. **Bug fix için:**

   ```bash
   git checkout -b fix/loading-state-bug
   # ... düzeltme ...
   git commit -m "fix(companies): fix loading state"
   git push origin fix/loading-state-bug
   ```

3. **Merge sonrası:**
   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/company-edit-page
   git push origin develop
   ```

---

## 📝 Commit Message Best Practices

### **Subject (Başlık)**

- ✅ **Kısa ve açıklayıcı** (50 karakter max)
- ✅ **Emir kipi kullan** (add, fix, update, remove)
- ✅ **İlk harf küçük** (Türkçe karakterler hariç)
- ✅ **Nokta kullanma**

**Örnekler:**

```bash
✅ feat(companies): add company creation form
✅ fix(auth): resolve RLS policy error
✅ test(e2e): add database error handling

❌ Added company form
❌ Fix bug
❌ test
```

### **Body (Gövde)**

**Ne zaman kullanılır:**

- Değişiklik karmaşıksa
- Neden yapıldığını açıklamak gerekiyorsa
- Breaking change varsa

**Format:**

```bash
feat(companies): add company creation form

- Add form validation
- Handle foreign key constraints
- Add loading state management
- Update RLS policies

Closes #123
```

### **Footer**

**Kullanım:**

```bash
Closes #123
Fixes #456
Refs #789
```

---

## 🚀 Pratik Workflow Örnekleri

### **Senaryo 1: Yeni Özellik Geliştirme**

```bash
# 1. Branch oluştur
git checkout -b feature/company-edit-page

# 2. Değişiklikleri yap
# ... kod yaz ...

# 3. Test et
npm run test:quick
npm run build

# 4. Commit (mantıklı parçalarda)
git add app/(dashboard)/companies/[id]/edit/page.tsx
git commit -m "feat(companies): add company edit page"

git add test/api/companies/update.test.ts
git commit -m "test(api): add update endpoint tests"

# 5. Push ve PR oluştur
git push origin feature/company-edit-page
```

### **Senaryo 2: Bug Düzeltme**

```bash
# 1. Bug'ı bul ve düzelt
git checkout -b fix/loading-state-bug

# 2. Düzeltmeyi yap
# ... kod düzelt ...

# 3. Test et
npm run test:quick

# 4. Commit
git commit -m "fix(companies): fix loading state on form submit"

# 5. Push ve PR
git push origin fix/loading-state-bug
```

### **Senaryo 3: Küçük İyileştirmeler**

```bash
# Birden fazla küçük değişiklik varsa
git add .
git commit -m "chore: update dependencies and fix lint errors"
```

---

## 🎯 Commit Sıklığı Önerileri

### **Günlük Çalışma**

**Önerilen:**

- ✅ Her mantıklı değişiklik için commit
- ✅ Gün sonunda tüm commit'leri push et
- ✅ Çalışmayan kod commit etme

**Örnek Gün:**

```bash
09:00 - feat(companies): add company list page
11:00 - feat(companies): add company creation form
14:00 - fix(companies): resolve foreign key error
16:00 - test(e2e): add company CRUD tests
17:00 - git push origin feature/company-crud
```

### **Haftalık Çalışma**

**Önerilen:**

- ✅ Feature branch'lerde çalış
- ✅ Her feature için ayrı branch
- ✅ Feature tamamlanınca PR oluştur
- ✅ Develop'a merge et

---

## 🔧 Yardımcı Araçlar

### **1. Commitizen (Commit Standardizasyonu)**

**Kurulum:**

```bash
npm install --save-dev commitizen cz-conventional-changelog
```

**package.json'a ekle:**

```json
{
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  }
}
```

**Kullanım:**

```bash
# Normal commit yerine
git cz
# Interaktif commit oluşturur
```

### **2. Commitlint (Commit Mesajı Kontrolü)**

**Kurulum:**

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

**commitlint.config.js:**

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'test', 'docs', 'refactor', 'style', 'chore', 'perf', 'ci'],
    ],
  },
}
```

**Pre-commit hook'a ekle:**

```bash
# .husky/commit-msg
npx --no -- commitlint --edit $1
```

### **3. Git Aliases (Hızlı Komutlar)**

**`.gitconfig` veya `.git/config`:**

```ini
[alias]
  co = checkout
  br = branch
  ci = commit
  st = status
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = !gitk
  lg = log --oneline --graph --decorate --all
```

---

## 📊 Commit Örnekleri (Bu Proje İçin)

### **İyi Commit'ler:**

```bash
# Feature
feat(companies): add company creation form with validation
feat(dashboard): add statistics cards
feat(auth): implement login and registration

# Bug Fix
fix(companies): resolve foreign key constraint error
fix(auth): fix loading state on redirect
fix(companies): fix params Promise handling in Next.js 16

# Test
test(e2e): add real user scenario tests
test(api): add database error handling tests
test(unit): add loading state management tests

# Refactor
refactor(api): simplify error handling
refactor(components): extract common form logic

# Chore
chore: add type-check to pre-commit hook
chore: update dependencies
chore: configure lint-staged

# Docs
docs: add commit strategy guide
docs: update test documentation
```

### **Kötü Commit'ler:**

```bash
❌ "bug fix"
❌ "update"
❌ "changes"
❌ "fix"
❌ "wip"
❌ "asdf"
❌ "test commit"
```

---

## 🎯 Önerilen Strateji (Bu Proje İçin)

### **1. Feature-Based Development**

```bash
# Her özellik için branch
feature/company-crud
feature/dashboard
feature/ai-discovery-agent
```

### **2. Mantıklı Commit'ler**

```bash
# Her mantıklı değişiklik için commit
feat(companies): add company list page
feat(companies): add company creation form
fix(companies): resolve foreign key error
test(e2e): add company CRUD tests
```

### **3. Günlük Push**

```bash
# Gün sonunda tüm commit'leri push et
git push origin feature/company-crud
```

### **4. PR ile Merge**

```bash
# Feature tamamlanınca PR oluştur
# Review sonrası merge et
```

---

## 📋 Checklist

**Commit Öncesi:**

- [ ] Kod çalışıyor mu?
- [ ] Testler geçiyor mu? (`npm run test:quick`)
- [ ] Build başarılı mı? (`npm run build`)
- [ ] Lint hataları var mı?
- [ ] Commit mesajı açıklayıcı mı?
- [ ] Gereksiz dosyalar commit edilmedi mi?

**Commit Sonrası:**

- [ ] Commit mesajı doğru mu?
- [ ] Gerekli dosyalar commit edildi mi?
- [ ] Push yapılacak mı?

---

## 🚀 Hızlı Başlangıç

### **1. Git Config Ayarları**

```bash
git config --global user.name "Ömer Ünsal"
git config --global user.email "omer@example.com"
```

### **2. İlk Commit**

```bash
git add .
git commit -m "feat: initial project setup"
```

### **3. Feature Geliştirme**

```bash
git checkout -b feature/my-feature
# ... değişiklikler ...
git commit -m "feat(scope): description"
git push origin feature/my-feature
```

---

## 💡 İpuçları

1. **Küçük ve sık commit yapın** - Geriye dönük takip kolaylaşır
2. **Her commit bir şeyi çözmeli** - Tek sorumluluk prensibi
3. **Commit mesajını açıklayıcı yazın** - 6 ay sonra anlaşılabilir olmalı
4. **Çalışmayan kod commit etmeyin** - Pre-commit hook bunu engeller
5. **Feature branch'lerde çalışın** - Main branch'i koruyun

---

**Son Güncelleme:** 2025-01-09
