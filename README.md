# 🚀 Odoo Orchestrator AI Platform

> AI-powered platform for managing Odoo projects across multiple companies

## 📚 Dokümantasyon

- **[COMMIT-STRATEGY.md](./COMMIT-STRATEGY.md)** - Commit stratejisi ve best practices
- **[COMMIT-WORKFLOW.md](./COMMIT-WORKFLOW.md)** - Günlük commit workflow örnekleri
- **[TEST-README.md](./TEST-README.md)** - Test sistemi kullanım rehberi
- **[TEST-REPORT.md](./TEST-REPORT.md)** - Test raporu ve durumu

## 🚀 Getting Started

### **Development Server**

```bash
npm run dev
# Server runs on http://localhost:3001
```

### **Build**

```bash
npm run build
npm start
```

## 🧪 Testing

```bash
# Unit & Integration tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Quick test (type-check + unit)
npm run test:quick
```

## 📝 Commit Strategy

**Conventional Commits** standardını kullanıyoruz:

```bash
feat(companies): add company creation form
fix(auth): resolve RLS policy error
test(e2e): add database error handling tests
```

Detaylar için: [COMMIT-STRATEGY.md](./COMMIT-STRATEGY.md)

## 🛠️ Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Supabase** - Backend (PostgreSQL, Auth, Storage)
- **Tailwind CSS** - Styling
- **Vitest** - Unit & Integration tests
- **Playwright** - E2E tests
- **OpenAI** - AI capabilities
- **Claude** - AI capabilities

## 📋 Pre-commit Hooks

Her commit öncesi otomatik çalışır:

- ✅ Lint & Format kontrolü
- ✅ Type-check (kritik dosyalarda)
- ✅ Build kontrolü (kritik dosyalarda)
- ✅ Unit testler (ilgili dosyalarda)

## 🔗 Links

- [Project Documentation](../project-documentation/)
- [Sprint Plan](../project-documentation/02-ANA-SPRINT-PLANI.md)
- [Test Strategy](./TEST-README.md)
