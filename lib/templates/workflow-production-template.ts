/**
 * Üretim Onay Workflow Template
 *
 * Üretim firmaları için üretim emri onay süreçleri workflow template'i.
 * Kapasite kontrolü, malzeme kontrolü ve kalite onayı dahil.
 */

import type { WorkflowTemplate } from './workflow-return-template'

export const workflowProductionTemplate: WorkflowTemplate = {
  template_id: 'workflow-production-v1',
  name: 'Üretim Onay Workflow Template',
  description:
    'Üretim firmaları için kapsamlı üretim emri onay süreçleri. Kapasite kontrolü, malzeme kontrolü ve kalite onayı dahil.',
  industry: 'manufacturing',
  workflow_structure: {
    model: 'mrp.production',
    name: 'Üretim Onay Süreci',
    states: [
      {
        name: 'draft',
        label: 'Taslak',
        description: 'Üretim emri taslak halinde',
      },
      {
        name: 'material_check',
        label: 'Malzeme Kontrolü',
        description: 'Gerekli malzemelerin stokta olup olmadığı kontrol ediliyor',
      },
      {
        name: 'capacity_check',
        label: 'Kapasite Kontrolü',
        description: 'Üretim kapasitesi kontrol ediliyor',
      },
      {
        name: 'pending_approval',
        label: 'Onay Bekliyor',
        description: 'Üretim emri onay için bekliyor',
      },
      {
        name: 'approved',
        label: 'Onaylandı',
        description: 'Üretim emri onaylandı, planlama bekliyor',
      },
      {
        name: 'planned',
        label: 'Planlandı',
        description: 'Üretim planlaması yapıldı',
      },
      {
        name: 'progress',
        label: 'Üretimde',
        description: 'Üretim başladı',
      },
      {
        name: 'quality_check',
        label: 'Kalite Kontrol',
        description: 'Üretilen ürünler kalite kontrolünden geçiyor',
      },
      {
        name: 'to_close',
        label: 'Kapatılacak',
        description: 'Üretim tamamlandı, kapatılmayı bekliyor',
      },
      {
        name: 'done',
        label: 'Tamamlandı',
        description: 'Üretim emri tamamlandı',
      },
      {
        name: 'cancelled',
        label: 'İptal Edildi',
        description: 'Üretim emri iptal edildi',
      },
    ],
    transitions: [
      {
        from: 'draft',
        to: 'material_check',
        label: 'Malzeme Kontrolüne Gönder',
        required_fields: ['product_id', 'product_qty', 'bom_id'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'warehouse_manager',
              message: 'Yeni üretim emri malzeme kontrolü bekliyor',
            },
          },
        ],
      },
      {
        from: 'material_check',
        to: 'capacity_check',
        label: 'Kapasite Kontrolüne Gönder',
        condition: 'material_available == true',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'production_manager',
              message: 'Malzeme kontrolü tamamlandı, kapasite kontrolü bekliyor',
            },
          },
        ],
      },
      {
        from: 'material_check',
        to: 'cancelled',
        label: 'Malzeme Yok - İptal',
        condition: 'material_available == false',
        required_fields: ['cancellation_reason'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'production_manager',
              message: 'Üretim emri malzeme eksikliği nedeniyle iptal edildi',
            },
          },
        ],
      },
      {
        from: 'capacity_check',
        to: 'pending_approval',
        label: 'Onaya Gönder',
        condition: 'capacity_available == true',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'production_manager',
              message: 'Kapasite kontrolü tamamlandı, onay bekliyor',
            },
          },
        ],
      },
      {
        from: 'capacity_check',
        to: 'cancelled',
        label: 'Kapasite Yok - İptal',
        condition: 'capacity_available == false',
        required_fields: ['cancellation_reason'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'production_manager',
              message: 'Üretim emri kapasite yetersizliği nedeniyle iptal edildi',
            },
          },
        ],
      },
      {
        from: 'pending_approval',
        to: 'approved',
        label: 'Onayla',
        condition: 'user_has_role("production_manager")',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'production_planner',
              message: 'Üretim emri onaylandı, planlama bekliyor',
            },
          },
        ],
      },
      {
        from: 'pending_approval',
        to: 'cancelled',
        label: 'Reddet',
        condition: 'user_has_role("production_manager")',
        required_fields: ['rejection_reason'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'requestor',
              message: 'Üretim emri reddedildi',
            },
          },
        ],
      },
      {
        from: 'approved',
        to: 'planned',
        label: 'Planla',
        condition: 'user_has_role("production_planner")',
        required_fields: ['scheduled_date', 'workcenter_ids'],
        automated_actions: [
          {
            action_type: 'create_record',
            config: {
              model: 'mrp.workorder',
              values: {
                production_id: 'current_production',
                workcenter_id: 'selected_workcenter',
                scheduled_date: 'scheduled_date',
              },
            },
          },
        ],
      },
      {
        from: 'planned',
        to: 'progress',
        label: 'Üretime Başla',
        condition: 'scheduled_date <= today',
        automated_actions: [
          {
            action_type: 'update_field',
            config: {
              model: 'mrp.production',
              field: 'date_start',
              value: 'today',
            },
          },
        ],
      },
      {
        from: 'progress',
        to: 'quality_check',
        label: 'Kalite Kontrolüne Gönder',
        condition: 'production_qty >= planned_qty',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'quality_manager',
              message: 'Üretim tamamlandı, kalite kontrolü bekliyor',
            },
          },
        ],
      },
      {
        from: 'quality_check',
        to: 'to_close',
        label: 'Kalite Onayı',
        condition: 'quality_status == "approved"',
        required_fields: ['quality_report'],
        automated_actions: [
          {
            action_type: 'update_field',
            config: {
              model: 'mrp.production',
              field: 'date_finished',
              value: 'today',
            },
          },
        ],
      },
      {
        from: 'quality_check',
        to: 'progress',
        label: 'Kalite Red - Yeniden Üretim',
        condition: 'quality_status == "rejected"',
        required_fields: ['quality_rejection_reason'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'production_manager',
              message: 'Kalite kontrolü başarısız, yeniden üretim gerekli',
            },
          },
        ],
      },
      {
        from: 'to_close',
        to: 'done',
        label: 'Kapat',
        condition: 'user_has_role("production_manager")',
        automated_actions: [
          {
            action_type: 'update_field',
            config: {
              model: 'stock.quant',
              field: 'quantity',
              value: 'production_qty',
            },
          },
        ],
      },
    ],
    security_rules: [
      {
        group: 'Production User',
        access: 'read',
        domain: [['state', 'in', ['draft', 'material_check', 'capacity_check']]],
      },
      {
        group: 'Production Manager',
        access: 'write',
        domain: [],
      },
      {
        group: 'Warehouse',
        access: 'read',
        domain: [['state', '=', 'material_check']],
      },
      {
        group: 'Production Planner',
        access: 'write',
        domain: [['state', 'in', ['approved', 'planned']]],
      },
      {
        group: 'Quality Control',
        access: 'write',
        domain: [['state', '=', 'quality_check']],
      },
    ],
  },
  features: [
    'Otomatik malzeme kontrolü',
    'Kapasite kontrolü',
    'Çoklu onay süreci',
    'Kalite kontrol entegrasyonu',
    'Otomatik planlama',
    'Rol bazlı erişim kontrolü',
  ],
  tags: ['üretim', 'workflow', 'onay', 'kapasite', 'kalite'],
}

