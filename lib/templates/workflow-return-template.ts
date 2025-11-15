/**
 * E-Ticaret İade Workflow Template
 *
 * E-ticaret firmaları için iade süreçleri workflow template'i.
 * Trendyol, N11, Shopify gibi platformlar için optimize edilmiş.
 */

export interface WorkflowTemplate {
  template_id: string
  name: string
  description: string
  industry: string
  workflow_structure: {
    model: string
    name: string
    states: Array<{
      name: string
      label: string
      description?: string
    }>
    transitions: Array<{
      from: string
      to: string
      label?: string
      condition?: string
      required_fields?: string[]
      automated_actions?: Array<{
        action_type: 'email' | 'notification' | 'create_record' | 'update_field'
        config: Record<string, any>
      }>
    }>
    security_rules?: Array<{
      group: string
      access: 'read' | 'write' | 'create' | 'delete'
      domain?: any[]
    }>
  }
  features: string[]
  tags: string[]
}

export const workflowReturnTemplate: WorkflowTemplate = {
  template_id: 'workflow-return-v1',
  name: 'E-Ticaret İade Workflow Template',
  description:
    'E-ticaret firmaları için kapsamlı iade süreçleri. Trendyol, N11, Shopify entegrasyonları dahil.',
  industry: 'ecommerce',
  workflow_structure: {
    model: 'sale.order',
    name: 'İade Süreci',
    states: [
      {
        name: 'draft',
        label: 'İade Talebi',
        description: 'Müşteri iade talebi oluşturdu',
      },
      {
        name: 'pending_approval',
        label: 'Onay Bekliyor',
        description: 'İade talebi onay için bekliyor',
      },
      {
        name: 'approved',
        label: 'Onaylandı',
        description: 'İade onaylandı, kargo bilgisi bekleniyor',
      },
      {
        name: 'in_transit',
        label: 'Kargoda',
        description: 'Ürün geri gönderim kargosunda',
      },
      {
        name: 'received',
        label: 'Teslim Alındı',
        description: 'Ürün depoya teslim alındı, kontrol bekliyor',
      },
      {
        name: 'quality_check',
        label: 'Kalite Kontrol',
        description: 'Ürün kalite kontrolünden geçiyor',
      },
      {
        name: 'refund_approved',
        label: 'İade Onaylandı',
        description: 'İade onaylandı, ödeme işlemi bekliyor',
      },
      {
        name: 'refunded',
        label: 'İade Edildi',
        description: 'Ödeme müşteriye iade edildi',
      },
      {
        name: 'rejected',
        label: 'Reddedildi',
        description: 'İade talebi reddedildi',
      },
      {
        name: 'cancelled',
        label: 'İptal Edildi',
        description: 'İade süreci iptal edildi',
      },
    ],
    transitions: [
      {
        from: 'draft',
        to: 'pending_approval',
        label: 'Onaya Gönder',
        required_fields: ['return_reason', 'return_type'],
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'customer_service_manager',
              message: 'Yeni iade talebi onay bekliyor',
            },
          },
        ],
      },
      {
        from: 'pending_approval',
        to: 'approved',
        label: 'Onayla',
        condition: 'user_has_role("customer_service_manager")',
        automated_actions: [
          {
            action_type: 'email',
            config: {
              template: 'return_approved',
              recipient: 'customer',
              subject: 'İade Talebiniz Onaylandı',
            },
          },
          {
            action_type: 'create_record',
            config: {
              model: 'stock.picking',
              values: {
                picking_type_id: 'return_picking_type',
                location_id: 'customer_location',
                location_dest_id: 'warehouse_location',
              },
            },
          },
        ],
      },
      {
        from: 'pending_approval',
        to: 'rejected',
        label: 'Reddet',
        condition: 'user_has_role("customer_service_manager")',
        required_fields: ['rejection_reason'],
        automated_actions: [
          {
            action_type: 'email',
            config: {
              template: 'return_rejected',
              recipient: 'customer',
              subject: 'İade Talebiniz Reddedildi',
            },
          },
        ],
      },
      {
        from: 'approved',
        to: 'in_transit',
        label: 'Kargoya Verildi',
        required_fields: ['tracking_number', 'carrier'],
        automated_actions: [
          {
            action_type: 'email',
            config: {
              template: 'return_shipped',
              recipient: 'customer',
              subject: 'İade Ürününüz Kargoya Verildi',
            },
          },
        ],
      },
      {
        from: 'in_transit',
        to: 'received',
        label: 'Teslim Alındı',
        condition: 'tracking_status == "delivered"',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'warehouse_manager',
              message: 'İade ürün depoya teslim alındı',
            },
          },
        ],
      },
      {
        from: 'received',
        to: 'quality_check',
        label: 'Kalite Kontrolüne Gönder',
        automated_actions: [
          {
            action_type: 'notification',
            config: {
              recipient: 'quality_manager',
              message: 'İade ürün kalite kontrolü bekliyor',
            },
          },
        ],
      },
      {
        from: 'quality_check',
        to: 'refund_approved',
        label: 'İade Onayla',
        condition: 'quality_status == "approved"',
        required_fields: ['quality_report'],
        automated_actions: [
          {
            action_type: 'create_record',
            config: {
              model: 'account.move',
              values: {
                move_type: 'out_refund',
                invoice_line_ids: [
                  {
                    product_id: 'return_product',
                    quantity: 'return_quantity',
                    price_unit: 'return_price',
                  },
                ],
              },
            },
          },
        ],
      },
      {
        from: 'quality_check',
        to: 'rejected',
        label: 'Kalite Kontrol Red',
        condition: 'quality_status == "rejected"',
        required_fields: ['quality_rejection_reason'],
        automated_actions: [
          {
            action_type: 'email',
            config: {
              template: 'return_quality_rejected',
              recipient: 'customer',
              subject: 'İade Ürün Kalite Kontrolünden Geçemedi',
            },
          },
        ],
      },
      {
        from: 'refund_approved',
        to: 'refunded',
        label: 'İade Ödemesi Yapıldı',
        condition: 'refund_payment_status == "paid"',
        automated_actions: [
          {
            action_type: 'email',
            config: {
              template: 'return_refunded',
              recipient: 'customer',
              subject: 'İade Ödemeniz Yapıldı',
            },
          },
          {
            action_type: 'update_field',
            config: {
              model: 'sale.order',
              field: 'state',
              value: 'cancel',
            },
          },
        ],
      },
    ],
    security_rules: [
      {
        group: 'Customer Service',
        access: 'read',
        domain: [['state', 'in', ['draft', 'pending_approval', 'approved', 'in_transit', 'received']]],
      },
      {
        group: 'Customer Service Manager',
        access: 'write',
        domain: [],
      },
      {
        group: 'Warehouse',
        access: 'read',
        domain: [['state', 'in', ['received', 'quality_check']]],
      },
      {
        group: 'Quality Control',
        access: 'write',
        domain: [['state', '=', 'quality_check']],
      },
      {
        group: 'Accounting',
        access: 'write',
        domain: [['state', 'in', ['refund_approved', 'refunded']]],
      },
    ],
  },
  features: [
    'Otomatik email bildirimleri',
    'Kargo takip entegrasyonu',
    'Kalite kontrol süreci',
    'Ödeme iade otomasyonu',
    'Trendyol/N11/Shopify entegrasyonu',
    'Rol bazlı erişim kontrolü',
  ],
  tags: ['e-ticaret', 'iade', 'workflow', 'trendyol', 'n11', 'shopify'],
}

