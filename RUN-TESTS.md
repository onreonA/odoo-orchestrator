# 🧪 Test Çalıştırma Rehberi

## ✅ Eklenen Testler

### **1. Odoo Client Tests** (`test/lib/odoo/client.test.ts`)
- Connection test
- Search operation
- Read operation  
- Create operation
- Write operation
- Delete operation
- Test connection method

### **2. Template Service Tests** (`test/lib/services/template-service.test.ts`)
- Create template
- List templates
- Get template by ID
- Filter by industry
- Error handling

### **3. Excel Import Service Tests** (`test/lib/services/excel-import-service.test.ts`)
- Parse Excel file
- Convert sheet to JSON
- Map to Odoo format
- Skip null/empty values
- Sheet not found error

### **4. API Route Tests**
- `test/api/odoo/test-connection.test.ts` - Odoo connection API
- `test/api/templates/route.test.ts` - Template API endpoints

## 🚀 Testleri Çalıştırma

```bash
# Tüm unit testler
npm run test

# Coverage ile
npm run test:coverage

# Watch mode (development)
npm run test:watch

# E2E testler
npm run test:e2e

# Tüm testler (unit + e2e + type-check + build)
npm run test:all
```

## 📊 Test Coverage

Coverage hedefleri:
- Lines: 70%
- Functions: 70%
- Branches: 65%
- Statements: 70%

## ⚠️ Notlar

- Testler mock'lar kullanıyor (gerçek Odoo/Supabase bağlantısı yok)
- E2E testler için dev server çalışıyor olmalı (`npm run dev`)
- Type-check ve build testleri de çalıştırılabilir




