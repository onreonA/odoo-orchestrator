/**
 * Üretim Dashboard Template
 *
 * Üretim firmaları için hazır dashboard yapılandırması.
 * Üretim metrikleri, kapasite kullanımı, kalite istatistikleri dahil.
 */

export interface DashboardTemplate {
  template_id: string
  name: string
  description: string
  industry: string
  dashboard_structure: {
    name: string
    view_type: 'kanban' | 'graph' | 'pivot' | 'form' | 'tree'
    components: Array<{
      type: 'metric' | 'graph' | 'kanban' | 'table' | 'chart'
      title: string
      model?: string
      domain?: any[]
      fields?: string[]
      group_by?: string[]
      config?: Record<string, any>
    }>
    layout?: {
      columns: number
      rows: number
      grid?: Array<{
        component_id: string
        x: number
        y: number
        width: number
        height: number
      }>
    }
  }
  features: string[]
  tags: string[]
}

export const dashboardProductionTemplate: DashboardTemplate = {
  template_id: 'dashboard-production-v1',
  name: 'Üretim Dashboard Template',
  description:
    'Üretim firmaları için kapsamlı dashboard. Üretim metrikleri, kapasite kullanımı, kalite istatistikleri ve iş merkezi performansı.',
  industry: 'manufacturing',
  dashboard_structure: {
    name: 'Üretim Dashboard',
    view_type: 'graph',
    components: [
      {
        type: 'metric',
        title: 'Aktif Üretim Emirleri',
        model: 'mrp.production',
        domain: [['state', '=', 'progress']],
        config: {
          field: 'id',
          aggregation: 'count',
          icon: 'mrp',
        },
      },
      {
        type: 'metric',
        title: 'Bugün Tamamlanan',
        model: 'mrp.production',
        domain: [
          ['state', '=', 'done'],
          ['date_finished', '>=', 'today_start'],
        ],
        config: {
          field: 'id',
          aggregation: 'count',
          icon: 'check',
        },
      },
      {
        type: 'metric',
        title: 'Toplam Üretim Miktarı (Bu Ay)',
        model: 'mrp.production',
        domain: [
          ['state', '=', 'done'],
          ['date_finished', '>=', 'month_start'],
        ],
        config: {
          field: 'product_qty',
          aggregation: 'sum',
          icon: 'box',
        },
      },
      {
        type: 'metric',
        title: 'Kapasite Kullanımı (%)',
        model: 'mrp.workcenter',
        domain: [],
        config: {
          field: 'capacity_utilization',
          aggregation: 'avg',
          icon: 'gauge',
          format: 'percentage',
        },
      },
      {
        type: 'graph',
        title: 'Üretim Durumu Dağılımı',
        model: 'mrp.production',
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
        title: 'Aylık Üretim Trendi',
        model: 'mrp.production',
        domain: [['state', '=', 'done']],
        fields: ['date_finished', 'product_qty'],
        group_by: ['date_finished:month'],
        config: {
          type: 'line',
          measure: 'product_qty',
        },
      },
      {
        type: 'graph',
        title: 'İş Merkezi Performansı',
        model: 'mrp.workorder',
        domain: [],
        fields: ['workcenter_id', 'duration'],
        group_by: ['workcenter_id'],
        config: {
          type: 'bar',
          measure: 'duration',
        },
      },
      {
        type: 'kanban',
        title: 'Üretim Emirleri',
        model: 'mrp.production',
        domain: [['state', 'in', ['draft', 'confirmed', 'progress']]],
        fields: ['name', 'product_id', 'product_qty', 'state', 'date_planned_start'],
        config: {
          group_by: 'state',
        },
      },
      {
        type: 'table',
        title: 'Son Üretim Emirleri',
        model: 'mrp.production',
        domain: [['state', '=', 'done']],
        fields: ['name', 'product_id', 'product_qty', 'date_start', 'date_finished', 'state'],
        config: {
          limit: 10,
          order_by: 'date_finished desc',
        },
      },
      {
        type: 'metric',
        title: 'Ortalama Üretim Süresi (Gün)',
        model: 'mrp.production',
        domain: [
          ['state', '=', 'done'],
          ['date_start', '!=', false],
          ['date_finished', '!=', false],
        ],
        config: {
          field: 'production_duration',
          aggregation: 'avg',
          icon: 'clock',
          format: 'float',
        },
      },
      {
        type: 'graph',
        title: 'Kalite Kontrol Sonuçları',
        model: 'quality.check',
        domain: [],
        fields: ['quality_state'],
        group_by: ['quality_state'],
        config: {
          type: 'pie',
          measure: 'id',
        },
      },
    ],
    layout: {
      columns: 4,
      rows: 3,
      grid: [
        { component_id: 'metric_active', x: 0, y: 0, width: 1, height: 1 },
        { component_id: 'metric_completed', x: 1, y: 0, width: 1, height: 1 },
        { component_id: 'metric_quantity', x: 2, y: 0, width: 1, height: 1 },
        { component_id: 'metric_capacity', x: 3, y: 0, width: 1, height: 1 },
        { component_id: 'graph_state', x: 0, y: 1, width: 2, height: 1 },
        { component_id: 'graph_trend', x: 2, y: 1, width: 2, height: 1 },
        { component_id: 'graph_performance', x: 0, y: 2, width: 2, height: 1 },
        { component_id: 'kanban_orders', x: 2, y: 2, width: 2, height: 1 },
      ],
    },
  },
  features: [
    'Gerçek zamanlı üretim metrikleri',
    'Kapasite kullanım takibi',
    'İş merkezi performans analizi',
    'Kalite kontrol istatistikleri',
    'Üretim trend analizi',
    'Kanban görünümü',
  ],
  tags: ['üretim', 'dashboard', 'mrp', 'kapasite', 'kalite'],
}
