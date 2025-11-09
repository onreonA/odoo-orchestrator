# ⚡ Commit Quick Reference

## 🎯 Hızlı Başvuru

### **Commit Formatı**
```bash
<type>(<scope>): <subject>
```

### **Commit Tipleri**
- `feat` - Yeni özellik
- `fix` - Bug düzeltme
- `test` - Test ekleme
- `docs` - Dokümantasyon
- `refactor` - Kod iyileştirme
- `chore` - Tool/build değişiklikleri

### **Scope Örnekleri**
- `companies` - Company modülü
- `auth` - Authentication
- `dashboard` - Dashboard
- `api` - API routes
- `test` - Test dosyaları

---

## 📝 Örnekler

### **Feature**
```bash
git commit -m "feat(companies): add company creation form"
git commit -m "feat(dashboard): add statistics cards"
```

### **Bug Fix**
```bash
git commit -m "fix(companies): resolve foreign key error"
git commit -m "fix(auth): fix loading state bug"
```

### **Test**
```bash
git commit -m "test(e2e): add real user scenario tests"
git commit -m "test(api): add database error handling tests"
```

### **Docs**
```bash
git commit -m "docs: add commit strategy guide"
git commit -m "docs(readme): update installation instructions"
```

### **Chore**
```bash
git commit -m "chore: add type-check to pre-commit"
git commit -m "chore: update dependencies"
```

---

## 🔄 Workflow

```bash
# 1. Branch oluştur
git checkout -b feature/my-feature

# 2. Değişiklikleri yap
# ... kod yaz ...

# 3. Commit
git add .
git commit -m "feat(scope): description"

# 4. Push
git push origin feature/my-feature
```

---

## ✅ Checklist

- [ ] Kod çalışıyor mu?
- [ ] Testler geçiyor mu?
- [ ] Commit mesajı açıklayıcı mı?
- [ ] Pre-commit hook çalıştı mı?

---

**Detaylar için:** [COMMIT-STRATEGY.md](./COMMIT-STRATEGY.md)

