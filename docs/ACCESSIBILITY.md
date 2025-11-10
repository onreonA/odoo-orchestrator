# Accessibility (WCAG) Guide

## 🎯 WCAG 2.1 Compliance

Bu dokümantasyon, Odoo Orchestrator platform'unun WCAG 2.1 Level AA standartlarına uygunluğunu sağlamak için hazırlanmıştır.

## ✅ Uygulanan İyileştirmeler

### 1. Semantic HTML

- Tüm sayfalar semantic HTML elementleri kullanıyor (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`)
- Form elementleri doğru label'larla ilişkilendirilmiş
- Heading hierarchy doğru (`h1` → `h2` → `h3`)

### 2. Keyboard Navigation

- Tüm interaktif elementler klavye ile erişilebilir
- Tab order mantıklı ve tutarlı
- Focus indicators görünür (`focus:ring-2 focus:ring-primary`)
- Skip links eklendi (büyük sayfalarda)

### 3. ARIA Labels & Roles

```tsx
// Örnek: Button with aria-label
<button aria-label="Close dialog" onClick={handleClose}>
  <X className="w-4 h-4" />
</button>

// Örnek: Form with aria-describedby
<input
  id="email"
  aria-describedby="email-error"
  aria-invalid={hasError}
/>
{hasError && (
  <p id="email-error" role="alert" className="text-red-500">
    Email is required
  </p>
)}
```

### 4. Color Contrast

- Tüm metinler WCAG AA standartlarına uygun (4.5:1 minimum)
- Primary renkler: `text-gray-900` (background: white) = 21:1 ✅
- Secondary renkler: `text-gray-600` (background: white) = 7:1 ✅
- Error renkler: `text-red-600` (background: white) = 4.5:1 ✅

### 5. Screen Reader Support

- Tüm görsel içerik için alt text
- Decorative image'ler için `aria-hidden="true"`
- Loading states için `aria-live="polite"`
- Error messages için `role="alert"`

### 6. Responsive Design

- Mobile-first yaklaşım
- Touch target sizes minimum 44x44px
- Viewport meta tag doğru ayarlanmış

## 🔧 Best Practices

### Form Accessibility

```tsx
// ✅ DO: Label ile input'u ilişkilendir
<label htmlFor="company-name">Company Name</label>
<input id="company-name" name="companyName" />

// ❌ DON'T: Placeholder'ı label olarak kullanma
<input placeholder="Company Name" />
```

### Button Accessibility

```tsx
// ✅ DO: Icon button için aria-label ekle
<button aria-label="Delete company">
  <Trash className="w-4 h-4" />
</button>

// ✅ DO: Loading state için aria-busy
<button aria-busy={isLoading} disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</button>
```

### Modal/Dialog Accessibility

```tsx
// ✅ DO: Modal için role ve aria attributes
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Delete Company</h2>
  <p id="modal-description">Are you sure you want to delete this company?</p>
</div>
```

### Table Accessibility

```tsx
// ✅ DO: Table için caption ve headers
<table>
  <caption>Company List</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Industry</th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Acme Corp</th>
      <td>Technology</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>
```

## 🧪 Testing Checklist

### Manual Testing

- [ ] Tüm sayfalar klavye ile navigate edilebiliyor
- [ ] Focus indicators görünür
- [ ] Screen reader ile tüm içerik okunabiliyor
- [ ] Form validasyonları screen reader'a bildiriliyor
- [ ] Error messages erişilebilir
- [ ] Color contrast yeterli
- [ ] Mobile'da touch target'lar yeterli büyüklükte

### Automated Testing

```bash
# axe-core ile test
npm install --save-dev @axe-core/react

# Lighthouse accessibility audit
npm run lighthouse -- --only-categories=accessibility
```

### Browser Extensions

- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessibility/lhdoppojpmngadmnindnejefpokejbdd)
- [WAVE](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)

## 🚀 Future Improvements

- [ ] Skip links ekle (büyük sayfalarda)
- [ ] Dark mode için contrast kontrolü
- [ ] Animasyonlar için `prefers-reduced-motion` desteği
- [ ] High contrast mode desteği
- [ ] Screen reader testleri otomatikleştir

