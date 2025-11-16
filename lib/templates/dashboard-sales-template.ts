/**
 * Satış Dashboard Template
 *
 * Satış firmaları için hazır dashboard yapılandırması.
 * Satış metrikleri, müşteri analizi, fırsat takibi dahil.
 */

import type { DashboardTemplate } from './dashboard-production-template'

export const dashboardSalesTemplate: DashboardTemplate = {
  template_id: 'dashboard-sales-v1',
  name: 'Satış Dashboard Template',
  description:
    'Satış firmaları için kapsamlı dashboard. Satış metrikleri, müşteri analizi, fırsat takibi ve gelir trendleri.',
  industry: 'sales',
  dashboard_structure: {
    name: 'Satış Dashboard',
    view_type: 'graph',
    components: [
      {
        type: 'metric',
        title: 'Bu Ay Toplam Satış',
        model: 'sale.order',
        domain: [
          ['state', 'in', ['sale', 'done']],
          ['date_order', '>=', 'month_start'],
        ],
        config: {
          field: 'amount_total',
          aggregation: 'sum',
          icon: 'currency',
          format: 'currency',
        },
      },
      {
        type: 'metric',
        title: 'Aktif Fırsatlar',
        model: 'crm.lead',
        domain: [['stage_id', 'not in', ['won', 'lost']]],
        config: {
          field: 'id',
          aggregation: 'count',
          icon: 'target',
        },
      },
      {
        type: 'metric',
        title: 'Bu Ay Kazanılan Fırsatlar',
        model: 'crm.lead',
        domain: [
          ['stage_id', '=', 'won'],
          ['date_closed', '>=', 'month_start'],
        ],
        config: {
          field: 'id',
          aggregation: 'count',
          icon: 'check',
        },
      },
      {
        type: 'metric',
        title: 'Ortalama Sipariş Tutarı',
        model: 'sale.order',
        domain: [['state', 'in', ['sale', 'done']]],
        config: {
          field: 'amount_total',
          aggregation: 'avg',
          icon: 'dollar',
          format: 'currency',
        },
      },
      {
        type: 'graph',
        title: 'Aylık Satış Trendi',
        model: 'sale.order',
        domain: [['state', 'in', ['sale', 'done']]],
        fields: ['date_order', 'amount_total'],
        group_by: ['date_order:month'],
        config: {
          type: 'line',
          measure: 'amount_total',
        },
      },
      {
        type: 'graph',
        title: 'Satış Durumu Dağılımı',
        model: 'sale.order',
        domain: [],
        fields: ['state'],
        group_by: ['state'],
        config: {
          type: 'pie',
          measure: 'id',
        },
      },
      {
        type: 'graph',
        title: 'Müşteri Bazlı Satış',
        model: 'sale.order',
        domain: [['state', 'in', ['sale', 'done']]],
        fields: ['partner_id', 'amount_total'],
        group_by: ['partner_id'],
        config: {
          type: 'bar',
          measure: 'amount_total',
          limit: 10,
        },
      },
      {
        type: 'graph',
        title: 'Fırsat Pipeline',
        model: 'crm.lead',
        domain: [],
        fields: ['stage_id', 'expected_revenue'],
        group_by: ['stage_id'],
        config: {
          type: 'funnel',
          measure: 'expected_revenue',
        },
      },
      {
        type: 'kanban',
        title: 'Aktif Fırsatlar',
        model: 'crm.lead',
        domain: [['stage_id', 'not in', ['won', 'lost']]],
        fields: ['name', 'partner_id', 'expected_revenue', 'stage_id', 'date_deadline'],
        config: {
          group_by: 'stage_id',
        },
      },
      {
        type: 'table',
        title: 'Son Siparişler',
        model: 'sale.order',
        domain: [['state', 'in', ['sale', 'done']]],
        fields: ['name', 'partner_id', 'amount_total', 'date_order', 'state'],
        config: {
          limit: 10,
          order_by: 'date_order desc',
        },
      },
      {
        type: 'metric',
        title: 'Dönüşüm Oranı (%)',
        model: 'crm.lead',
        domain: [],
        config: {
          field: 'conversion_rate',
          aggregation: 'avg',
          icon: 'percent',
          format: 'percentage',
        },
      },
      {
        type: 'graph',
        title: 'Ürün Bazlı Satış',
        model: 'sale.order.line',
        domain: [['order_id.state', 'in', ['sale', 'done']]],
        fields: ['product_id', 'price_subtotal'],
        group_by: ['product_id'],
        config: {
          type: 'bar',
          measure: 'price_subtotal',
          limit: 10,
        },
      },
    ],
    layout: {
      columns: 4,
      rows: 3,
      grid: [
        { component_id: 'metric_total', x: 0, y: 0, width: 1, height: 1 },
        { component_id: 'metric_opportunities', x: 1, y: 0, width: 1, height: 1 },
        { component_id: 'metric_won', x: 2, y: 0, width: 1, height: 1 },
        { component_id: 'metric_avg', x: 3, y: 0, width: 1, height: 1 },
        { component_id: 'graph_trend', x: 0, y: 1, width: 2, height: 1 },
        { component_id: 'graph_state', x: 2, y: 1, width: 2, height: 1 },
        { component_id: 'graph_customer', x: 0, y: 2, width: 2, height: 1 },
        { component_id: 'kanban_opportunities', x: 2, y: 2, width: 2, height: 1 },
      ],
    },
  },
  features: [
    'Gerçek zamanlı satış metrikleri',
    'Fırsat pipeline takibi',
    'Müşteri analizi',
    'Ürün bazlı satış analizi',
    'Dönüşüm oranı takibi',
    'Gelir trend analizi',
  ],
  tags: ['satış', 'dashboard', 'crm', 'fırsat', 'müşteri'],
}
