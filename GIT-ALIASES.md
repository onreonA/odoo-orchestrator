# 🔧 Git Aliases - Hızlı Komutlar

## 📋 Önerilen Git Aliases

Git alias'ları `.gitconfig` dosyasına eklenebilir veya proje içinde `.git/config` dosyasına eklenebilir.

### **Kurulum**

**Global (Tüm projeler için):**
```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

**Veya `.gitconfig` dosyasına manuel ekle:**
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
  amend = commit --amend
  wip = commit -m "wip: work in progress"
```

### **Kullanım**

```bash
# Normal
git checkout feature/my-feature

# Alias ile
git co feature/my-feature

# Normal
git status

# Alias ile
git st

# Normal
git commit -m "feat: new feature"

# Alias ile
git ci -m "feat: new feature"
```

---

## 🎯 Proje İçin Özel Aliases

### **Commit Aliases**

```bash
# Feature commit
git config alias.feat '!f() { git commit -m "feat($1): $2"; }; f'

# Fix commit
git config alias.fix '!f() { git commit -m "fix($1): $2"; }; f'

# Test commit
git config alias.test '!f() { git commit -m "test($1): $2"; }; f'
```

**Kullanım:**
```bash
git feat companies "add company form"
# → feat(companies): add company form

git fix auth "resolve loading bug"
# → fix(auth): resolve loading bug
```

---

## 📝 Not

Alias'lar opsiyoneldir. Normal git komutlarını kullanmak da tamamen yeterlidir.

**Son Güncelleme:** 2025-01-09




