/**
 * Stok Dashboard Template
 *
 * Stok yönetimi için hazır dashboard yapılandırması.
 * Stok seviyeleri, hareketler, envanter değeri dahil.
 */

import type { DashboardTemplate } from './dashboard-production-template'

export const dashboardInventoryTemplate: DashboardTemplate = {
  template_id: 'dashboard-inventory-v1',
  name: 'Stok Dashboard Template',
  description:
    'Stok yönetimi için kapsamlı dashboard. Stok seviyeleri, hareketler, envanter değeri ve stok yaşlandırma analizi.',
  industry: 'warehouse',
  dashboard_structure: {
    name: 'Stok Dashboard',
    view_type: 'graph',
    components: [
      {
        type: 'metric',
        title: 'Toplam Ürün Çeşidi',
        model: 'product.product',
        domain: [['type', '=', 'product']],
        config: {
          field: 'id',
          aggregation: 'count',
          icon: 'box',
        },
      },
      {
        type: 'metric',
        title: 'Toplam Stok Değeri',
        model: 'stock.quant',
        domain: [],
        config: {
          field: 'inventory_value',
          aggregation: 'sum',
          icon: 'currency',
          format: 'currency',
        },
      },
      {
        type: 'metric',
        title: 'Düşük Stok Ürünler',
        model: 'product.product',
        domain: [
          ['type', '=', 'product'],
          ['qty_available', '<', 'reordering_min_qty'],
        ],
        config: {
          field: 'id',
          aggregation: 'count',
          icon: 'alert',
        },
      },
      {
        type: 'metric',
        title: 'Bu Ay Stok Girişi',
        model: 'stock.move',
        domain: [
          ['picking_type_id.code', '=', 'incoming'],
          ['date', '>=', 'month_start'],
        ],
        config: {
          field: 'product_qty',
          aggregation: 'sum',
          icon: 'arrow-down',
        },
      },
      {
        type: 'graph',
        title: 'Stok Seviyesi Dağılımı',
        model: 'product.product',
        domain: [['type', '=', 'product']],
        fields: ['stock_status'],
        group_by: ['stock_status'],
        config: {
          type: 'pie',
          measure: 'id',
        },
      },
      {
        type: 'graph',
        title: 'Aylık Stok Hareketleri',
        model: 'stock.move',
        domain: [],
        fields: ['date', 'product_qty'],
        group_by: ['date:month', 'picking_type_id'],
        config: {
          type: 'line',
          measure: 'product_qty',
        },
      },
      {
        type: 'graph',
        title: 'En Yüksek Değerli Ürünler',
        model: 'stock.quant',
        domain: [],
        fields: ['product_id', 'inventory_value'],
        group_by: ['product_id'],
        config: {
          type: 'bar',
          measure: 'inventory_value',
          limit: 10,
        },
      },
      {
        type: 'graph',
        title: 'Stok Yaşlandırma Analizi',
        model: 'stock.quant',
        domain: [],
        fields: ['product_id', 'inventory_age'],
        group_by: ['inventory_age_range'],
        config: {
          type: 'bar',
          measure: 'inventory_value',
        },
      },
      {
        type: 'kanban',
        title: 'Stok Hareketleri',
        model: 'stock.picking',
        domain: [['state', 'in', ['assigned', 'waiting']]],
        fields: ['name', 'partner_id', 'scheduled_date', 'state', 'move_ids'],
        config: {
          group_by: 'state',
        },
      },
      {
        type: 'table',
        title: 'Düşük Stok Ürünler',
        model: 'product.product',
        domain: [
          ['type', '=', 'product'],
          ['qty_available', '<', 'reordering_min_qty'],
        ],
        fields: ['name', 'qty_available', 'reordering_min_qty', 'location_id'],
        config: {
          limit: 20,
          order_by: 'qty_available asc',
        },
      },
      {
        type: 'metric',
        title: 'Stok Devir Hızı',
        model: 'stock.move',
        domain: [
          ['picking_type_id.code', '=', 'outgoing'],
          ['date', '>=', 'month_start'],
        ],
        config: {
          field: 'turnover_rate',
          aggregation: 'avg',
          icon: 'refresh',
          format: 'float',
        },
      },
      {
        type: 'graph',
        title: 'Lokasyon Bazlı Stok',
        model: 'stock.quant',
        domain: [],
        fields: ['location_id', 'quantity'],
        group_by: ['location_id'],
        config: {
          type: 'bar',
          measure: 'quantity',
        },
      },
    ],
    layout: {
      columns: 4,
      rows: 3,
      grid: [
        { component_id: 'metric_products', x: 0, y: 0, width: 1, height: 1 },
        { component_id: 'metric_value', x: 1, y: 0, width: 1, height: 1 },
        { component_id: 'metric_low_stock', x: 2, y: 0, width: 1, height: 1 },
        { component_id: 'metric_incoming', x: 3, y: 0, width: 1, height: 1 },
        { component_id: 'graph_level', x: 0, y: 1, width: 2, height: 1 },
        { component_id: 'graph_movements', x: 2, y: 1, width: 2, height: 1 },
        { component_id: 'graph_value', x: 0, y: 2, width: 2, height: 1 },
        { component_id: 'kanban_pickings', x: 2, y: 2, width: 2, height: 1 },
      ],
    },
  },
  features: [
    'Gerçek zamanlı stok metrikleri',
    'Stok seviyesi takibi',
    'Envanter değeri analizi',
    'Stok yaşlandırma analizi',
    'Düşük stok uyarıları',
    'Lokasyon bazlı stok görünümü',
  ],
  tags: ['stok', 'dashboard', 'envanter', 'depo', 'lokasyon'],
}
