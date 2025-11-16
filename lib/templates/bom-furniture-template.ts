/**
 * Mobilya BOM Template
 *
 * Mobilya sektörü için hazır BOM (Bill of Materials) yapıları.
 * Modüler mobilya üretimi için optimize edilmiş.
 */

export interface BOMTemplate {
  template_id: string
  name: string
  description: string
  industry: string
  bom_structure: {
    product_code: string
    product_name: string
    components: Array<{
      component_code: string
      component_name: string
      quantity: number
      unit: string
      type: 'raw_material' | 'semi_finished' | 'finished'
      supplier?: string
      cost?: number
      alternatives?: Array<{
        component_code: string
        component_name: string
        quantity: number
      }>
    }>
    routing?: Array<{
      operation: string
      workcenter: string
      duration: number
      setup_time?: number
    }>
  }[]
  features: string[]
  tags: string[]
}

export const bomFurnitureTemplate: BOMTemplate = {
  template_id: 'bom-furniture-v1',
  name: 'Mobilya BOM Template',
  description:
    'Modüler mobilya üretimi için hazır BOM yapıları. Standart mobilya parçaları ve montaj süreçleri.',
  industry: 'furniture',
  bom_structure: [
    {
      product_code: 'MOD-KIT-001',
      product_name: 'Modüler Dolap Seti',
      components: [
        {
          component_code: 'RAW-WOOD-001',
          component_name: 'Laminant Panel (18mm)',
          quantity: 8,
          unit: 'adet',
          type: 'raw_material',
          supplier: 'Panel Tedarikçisi',
          cost: 150,
          alternatives: [
            {
              component_code: 'RAW-WOOD-002',
              component_name: 'MDF Panel (18mm)',
              quantity: 8,
            },
          ],
        },
        {
          component_code: 'RAW-HARDWARE-001',
          component_name: 'Gizli Menteşe',
          quantity: 12,
          unit: 'adet',
          type: 'raw_material',
          supplier: 'Donanım Tedarikçisi',
          cost: 8,
        },
        {
          component_code: 'RAW-HARDWARE-002',
          component_name: 'Kılavuz Ray',
          quantity: 4,
          unit: 'adet',
          type: 'raw_material',
          supplier: 'Donanım Tedarikçisi',
          cost: 25,
        },
        {
          component_code: 'SEMI-DOOR-001',
          component_name: 'Kapı Paneli',
          quantity: 4,
          unit: 'adet',
          type: 'semi_finished',
        },
      ],
      routing: [
        {
          operation: 'Kesim',
          workcenter: 'Kesim Merkezi',
          duration: 120,
          setup_time: 30,
        },
        {
          operation: 'Delme',
          workcenter: 'Delme İstasyonu',
          duration: 60,
          setup_time: 15,
        },
        {
          operation: 'Montaj',
          workcenter: 'Montaj Hattı',
          duration: 180,
          setup_time: 20,
        },
        {
          operation: 'Paketleme',
          workcenter: 'Paketleme',
          duration: 45,
        },
      ],
    },
    {
      product_code: 'MOD-TABLE-001',
      product_name: 'Yemek Masası',
      components: [
        {
          component_code: 'RAW-WOOD-003',
          component_name: 'Masa Üstü Panel',
          quantity: 1,
          unit: 'adet',
          type: 'raw_material',
          cost: 200,
        },
        {
          component_code: 'RAW-METAL-001',
          component_name: 'Metal Ayak',
          quantity: 4,
          unit: 'adet',
          type: 'raw_material',
          supplier: 'Metal İşleme',
          cost: 50,
        },
        {
          component_code: 'RAW-HARDWARE-003',
          component_name: 'Bağlantı Vidası',
          quantity: 16,
          unit: 'adet',
          type: 'raw_material',
          cost: 2,
        },
      ],
      routing: [
        {
          operation: 'Kesim ve Şekillendirme',
          workcenter: 'Kesim Merkezi',
          duration: 90,
          setup_time: 20,
        },
        {
          operation: 'Delme',
          workcenter: 'Delme İstasyonu',
          duration: 30,
          setup_time: 10,
        },
        {
          operation: 'Montaj',
          workcenter: 'Montaj Hattı',
          duration: 60,
          setup_time: 15,
        },
      ],
    },
  ],
  features: [
    'Modüler yapı desteği',
    'Alternatif malzeme seçenekleri',
    'Routing bilgileri',
    'Maliyet hesaplama',
    'Tedarikçi bilgileri',
  ],
  tags: ['mobilya', 'bom', 'modüler', 'laminant', 'mdf'],
}
