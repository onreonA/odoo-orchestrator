/**
 * Satınalma Onay Workflow Template
 *
 * Satınalma siparişleri için onay süreçleri workflow template'i.
 * Bütçe kontrolü, tedarikçi değerlendirme ve çoklu onay dahil.
 */

import type { WorkflowTemplate } from './workflow-return-template'

export const workflowPurchaseTemplate: WorkflowTemplate = {
  template_id: 'workflow-purchase-v1',
  name: 'Satınalma Onay Workflow Template',
  description:
    'Satınalma siparişleri için kapsamlı onay süreçleri. Bütçe kontrolü, tedarikçi değerlendirme ve çoklu onay dahil.',
  industry: 'manufacturing',
  workflow_structure: {
    model: 'purchase.order',
    name: 'Satınalma Onay Süreci',
    states: [
      {
        name: 'draft',
        label: 'Taslak',
        description: 'Satınalma siparişi taslak halinde',
      },
      {
        name: 'budget_check',
        label: 'Bütçe Kontrolü',
        description: 'Bütçe kontrolü yapılıyor',
      },
      {
        name: 'supplier_evaluation',
        label: 'Tedarikçi Değerlendirme',
        description: 'Tedarikçi performansı değerlendiriliyor',
      },
      {
        name: 'pending_approval',
        label: 'Onay Bekliyor',
        description: 'Satınalma siparişi onay için bekliyor',
      },
      {
        name: 'manager_approved',
        label: 'Müdür Onayı',
        description: 'Departman müdürü onayladı',
      },
      {
        name: 'finance_approved',
        label: 'Mali İşler Onayı',
        description: 'Mali işler onayladı',
      },
      {
        name: 'ceo_approved',
        label: 'Genel Müdür Onayı',
        description: 'Genel müdür onayladı (yüksek tutarlar için)',
      },
      {
        name: 'sent',
        label: 'Gönderildi',
        description: 'Sipariş tedarikçiye gönderildi',
      },
      {
        name: 'to_approve',
        label: 'Onaylanacak',
        description: 'Tedarikçi onayı bekleniyor',
      },
      {
        name: 'purchase',
        label: 'Satınalma',
        description: 'Sipariş onaylandı ve satınalma yapıldı',
      },
      {
        name: 'done',
        label: 'Tamamlandı',
        description: 'Satınalma siparişi tamamlandı',
      },
      {
        name: 'cancel',
        label: 'İptal Edildi',
        description: 'Satınalma siparişi iptal edildi',
      },
    ],
    transitions: [
      {
        from: 'draft',
        to: 'budget_check',
        label: 'Bütçe Kontrolüne Gönder',
        required_fields: ['partner_id', 'order_line', 'amount_total'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'finance_manager',
              message: 'Yeni satınalma siparişi bütçe kontrolü bekliyor',
            },
          },
        ],
      },
      {
        from: 'budget_check',
        to: 'supplier_evaluation',
        label: 'Tedarikçi Değerlendirmesine Gönder',
        condition: 'budget_available == true',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'purchasing_manager',
              message: 'Bütçe kontrolü tamamlandı, tedarikçi değerlendirmesi bekliyor',
            },
          },
        ],
      },
      {
        from: 'budget_check',
        to: 'cancel',
        label: 'Bütçe Yok - İptal',
        condition: 'budget_available == false',
        required_fields: ['cancellation_reason'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'requestor',
              message: 'Satınalma siparişi bütçe yetersizliği nedeniyle iptal edildi',
            },
          },
        ],
      },
      {
        from: 'supplier_evaluation',
        to: 'pending_approval',
        label: 'Onaya Gönder',
        condition: 'supplier_approved == true',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'department_manager',
              message: 'Tedarikçi değerlendirmesi tamamlandı, onay bekliyor',
            },
          },
        ],
      },
      {
        from: 'supplier_evaluation',
        to: 'cancel',
        label: 'Tedarikçi Red - İptal',
        condition: 'supplier_approved == false',
        required_fields: ['cancellation_reason'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'requestor',
              message: 'Satınalma siparişi tedarikçi değerlendirmesi nedeniyle iptal edildi',
            },
          },
        ],
      },
      {
        from: 'pending_approval',
        to: 'manager_approved',
        label: 'Müdür Onayı',
        condition: 'user_has_role("department_manager") AND amount_total < 10000',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'finance_manager',
              message: 'Müdür onayı alındı, mali işler onayı bekliyor',
            },
          },
        ],
      },
      {
        from: 'pending_approval',
        to: 'finance_approved',
        label: 'Mali İşler Onayı',
        condition: 'user_has_role("finance_manager") AND amount_total < 50000',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'purchasing_manager',
              message: 'Mali işler onayı alındı, sipariş gönderilebilir',
            },
          },
        ],
      },
      {
        from: 'manager_approved',
        to: 'finance_approved',
        label: 'Mali İşler Onayı',
        condition: 'user_has_role("finance_manager")',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'purchasing_manager',
              message: 'Mali işler onayı alındı, sipariş gönderilebilir',
            },
          },
        ],
      },
      {
        from: 'pending_approval',
        to: 'ceo_approved',
        label: 'Genel Müdür Onayı',
        condition: 'user_has_role("ceo") AND amount_total >= 50000',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'finance_manager',
              message: 'Genel müdür onayı alındı, mali işler onayı bekliyor',
            },
          },
        ],
      },
      {
        from: 'ceo_approved',
        to: 'finance_approved',
        label: 'Mali İşler Onayı',
        condition: 'user_has_role("finance_manager")',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'purchasing_manager',
              message: 'Tüm onaylar tamamlandı, sipariş gönderilebilir',
            },
          },
        ],
      },
      {
        from: 'finance_approved',
        to: 'sent',
        label: 'Tedarikçiye Gönder',
        condition: 'user_has_role("purchasing_manager")',
        automated_actions: [
          {
            action_type: 'email',
            config: {
              template: 'purchase_order_sent',
              recipient: 'supplier',
              subject: 'Satınalma Siparişi',
            },
          },
        ],
      },
      {
        from: 'sent',
        to: 'to_approve',
        label: 'Tedarikçi Onayı Bekle',
        condition: 'supplier_confirmed == true',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'purchasing_manager',
              message: 'Tedarikçi siparişi onayladı',
            },
          },
        ],
      },
      {
        from: 'to_approve',
        to: 'purchase',
        label: 'Satınalma Onayı',
        condition: 'user_has_role("purchasing_manager")',
        automated_actions: [
          {
            action_type: 'create_record',
            config: {
              model: 'stock.picking',
              values: {
                picking_type_id: 'incoming_picking_type',
                partner_id: 'supplier_id',
              },
            },
          },
        ],
      },
      {
        from: 'purchase',
        to: 'done',
        label: 'Tamamla',
        condition: 'all_products_received == true',
        automated_actions: [
          {
            action_type: 'update_field',
            config: {
              model: 'purchase.order',
              field: 'state',
              value: 'done',
            },
          },
        ],
      },
    ],
    security_rules: [
      {
        group: 'Purchase User',
        access: 'read',
        domain: [['state', 'in', ['draft', 'budget_check', 'supplier_evaluation']]],
      },
      {
        group: 'Department Manager',
        access: 'write',
        domain: [
          ['state', '=', 'pending_approval'],
          ['amount_total', '<', 10000],
        ],
      },
      {
        group: 'Finance Manager',
        access: 'write',
        domain: [['state', 'in', ['budget_check', 'finance_approved']]],
      },
      {
        group: 'CEO',
        access: 'write',
        domain: [
          ['state', '=', 'pending_approval'],
          ['amount_total', '>=', 50000],
        ],
      },
      {
        group: 'Purchase Manager',
        access: 'write',
        domain: [],
      },
    ],
  },
  features: [
    'Otomatik bütçe kontrolü',
    'Tedarikçi değerlendirme',
    'Çoklu onay süreci (müdür, mali işler, CEO)',
    'Tutar bazlı onay kuralları',
    'Otomatik email bildirimleri',
    'Rol bazlı erişim kontrolü',
  ],
  tags: ['satınalma', 'workflow', 'onay', 'bütçe', 'tedarikçi'],
}

