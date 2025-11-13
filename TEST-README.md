# 🧪 Test Sistemi Kullanım Rehberi

## 📋 Hızlı Başlangıç

### **Unit & Integration Tests (Vitest)**

```bash
# Tüm testleri çalıştır
npm run test

# Watch mode (otomatik test)
npm run test:watch

# UI ile test (görsel arayüz)
npm run test:ui

# Coverage raporu
npm run test:coverage
```

### **E2E Tests (Playwright)**

```bash
# Tüm E2E testleri çalıştır
npm run test:e2e

# UI ile E2E test (görsel arayüz)
npm run test:e2e:ui

# Belirli bir test dosyası
npx playwright test e2e/companies.spec.ts
```

### **Tüm Testler**

```bash
# Hem unit hem E2E testleri
npm run test:all
```

---

## 📁 Test Klasör Yapısı

```
odoo-orchestrator/
├── test/                    # Unit & Integration tests
│   ├── setup.ts            # Test setup ve mock'lar
│   ├── components/         # Component testleri
│   │   └── ui/
│   │       └── button.test.tsx
│   └── lib/                # Utility testleri
│       └── utils.test.ts
│
├── e2e/                    # E2E tests (Playwright)
│   ├── auth.spec.ts        # Authentication senaryoları
│   └── companies.spec.ts    # Companies CRUD senaryoları
│
├── vitest.config.ts        # Vitest konfigürasyonu
└── playwright.config.ts   # Playwright konfigürasyonu
```

---

## ✍️ Test Yazma

### **Unit Test Örneği**

```typescript
// test/components/ui/button.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })
})
```

### **E2E Test Örneği**

```typescript
// e2e/companies.spec.ts
import { test, expect } from '@playwright/test'

test('user can create a company', async ({ page }) => {
  await page.goto('/companies/new')
  await page.fill('[name="name"]', 'Test Company')
  await page.click('button:has-text("Firmayı Ekle")')
  await expect(page.locator('h1')).toContainText('Test Company')
})
```

---

## 🎯 Test Senaryoları

### **Mevcut Testler**

✅ **Unit Tests:**

- Button component (7 test)
- Utils functions (4 test)

✅ **E2E Tests:**

- Authentication flow (register, login, logout)
- Companies CRUD (create, read, update, delete)

### **Yazılacak Testler**

📝 **Öncelikli:**

- [ ] Input component testleri
- [ ] Form validation testleri
- [ ] API route testleri
- [ ] Dashboard sayfası testleri
- [ ] Navigation testleri

---

## 🔄 CI/CD Entegrasyonu

### **GitHub Actions (Gelecek)**

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test
      - run: npm run test:e2e
```

---

## 📊 Coverage Hedefleri

```
Unit Tests:      %90+ coverage
Integration:     %80+ coverage
E2E Tests:       Tüm kritik akışlar
```

Mevcut durumu görmek için:

```bash
npm run test:coverage
```

---

## 🐛 Debugging

### **Vitest Debug**

```bash
# Verbose output
npm run test -- --reporter=verbose

# Single test file
npm run test -- test/components/ui/button.test.tsx
```

### **Playwright Debug**

```bash
# UI mode (en kolay)
npm run test:e2e:ui

# Headed mode (browser görünür)
npx playwright test --headed

# Debug mode (step by step)
npx playwright test --debug
```

---

## 💡 Best Practices

1. **Test İzolasyonu**: Her test bağımsız çalışmalı
2. **Descriptive Names**: Test adı ne test ettiğini açıklar
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mock External**: API, database mock'lanır
5. **Realistic Data**: Gerçekçi test verileri kullan

---

## 🚀 Sonraki Adımlar

1. ✅ Test framework'leri kuruldu
2. ✅ İlk testler yazıldı
3. ✅ Pre-commit hooks kuruldu
4. ✅ Test utilities/helpers eklendi
5. ✅ CI/CD workflow eklendi
6. ✅ Coverage iyileştirmeleri yapıldı
7. 📝 Daha fazla component testi yazılacak
8. 📝 API testleri eklenecek
9. 📝 AI Test Agent eklenecek

---

## 🎉 Yeni Eklenenler

**Pre-commit Hooks:**

- Her commit öncesi otomatik test
- Lint ve format kontrolü

**Test Utilities:**

- `test/utils/test-helpers.ts` - Ortak test fonksiyonları
- `test/utils/mock-factories.ts` - Mock data factory'leri

**CI/CD:**

- `.github/workflows/test.yml` - Otomatik test workflow'u

**Coverage:**

- Minimum %70 threshold
- HTML ve LCOV raporları

Detaylar için: `TEST-IMPROVEMENTS.md`

---

**Sorularınız için**: Test stratejisi dokümantasyonuna bakın: `project-documentation/07-TEST-STRATEJISI.md`
