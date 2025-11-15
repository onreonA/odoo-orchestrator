/**
 * Metal BOM Template
 *
 * Metal işleme sektörü için hazır BOM (Bill of Materials) yapıları.
 * Kaynak, kesim, büküm ve montaj süreçleri için optimize edilmiş.
 */

import type { BOMTemplate } from './bom-furniture-template'

export const bomMetalTemplate: BOMTemplate = {
  template_id: 'bom-metal-v1',
  name: 'Metal BOM Template',
  description:
    'Metal işleme ve imalat için hazır BOM yapıları. Kaynak, kesim, büküm ve montaj süreçleri.',
  industry: 'metal',
  bom_structure: [
    {
      product_code: 'METAL-FRAME-001',
      product_name: 'Metal Çerçeve Seti',
      components: [
        {
          component_code: 'RAW-STEEL-001',
          component_name: 'Çelik Profil (40x40mm)',
          quantity: 8,
          unit: 'metre',
          type: 'raw_material',
          supplier: 'Çelik Tedarikçisi',
          cost: 45,
          alternatives: [
            {
              component_code: 'RAW-STEEL-002',
              component_name: 'Alüminyum Profil (40x40mm)',
              quantity: 8,
            },
          ],
        },
        {
          component_code: 'RAW-WELD-001',
          component_name: 'Kaynak Teli',
          quantity: 2,
          unit: 'kg',
          type: 'raw_material',
          supplier: 'Kaynak Malzemeleri',
          cost: 80,
        },
        {
          component_code: 'RAW-PAINT-001',
          component_name: 'Toz Boya',
          quantity: 1,
          unit: 'kg',
          type: 'raw_material',
          supplier: 'Boya Tedarikçisi',
          cost: 120,
        },
        {
          component_code: 'RAW-HARDWARE-METAL-001',
          component_name: 'Cıvata M8',
          quantity: 16,
          unit: 'adet',
          type: 'raw_material',
          supplier: 'Donanım Tedarikçisi',
          cost: 3,
        },
      ],
      routing: [
        {
          operation: 'Kesim',
          workcenter: 'Plazma Kesim',
          duration: 60,
          setup_time: 20,
        },
        {
          operation: 'Büküm',
          workcenter: 'Büküm Presi',
          duration: 45,
          setup_time: 15,
        },
        {
          operation: 'Kaynak',
          workcenter: 'Kaynak İstasyonu',
          duration: 120,
          setup_time: 30,
        },
        {
          operation: 'Taşlama',
          workcenter: 'Taşlama İstasyonu',
          duration: 30,
        },
        {
          operation: 'Boya',
          workcenter: 'Boya Kabini',
          duration: 90,
          setup_time: 20,
        },
        {
          operation: 'Montaj',
          workcenter: 'Montaj Hattı',
          duration: 60,
          setup_time: 15,
        },
      ],
    },
    {
      product_code: 'METAL-PANEL-001',
      product_name: 'Metal Panel',
      components: [
        {
          component_code: 'RAW-SHEET-001',
          component_name: 'Sac Levha (2mm)',
          quantity: 1,
          unit: 'm²',
          type: 'raw_material',
          cost: 80,
        },
        {
          component_code: 'RAW-CUTTING-001',
          component_name: 'Lazer Kesim',
          quantity: 1,
          unit: 'işlem',
          type: 'raw_material',
          cost: 50,
        },
        {
          component_code: 'RAW-BEND-001',
          component_name: 'Büküm İşlemi',
          quantity: 4,
          unit: 'büküm',
          type: 'raw_material',
          cost: 15,
        },
      ],
      routing: [
        {
          operation: 'Lazer Kesim',
          workcenter: 'Lazer Kesim Merkezi',
          duration: 30,
          setup_time: 10,
        },
        {
          operation: 'Büküm',
          workcenter: 'Büküm Presi',
          duration: 20,
          setup_time: 10,
        },
        {
          operation: 'Delme',
          workcenter: 'Delme İstasyonu',
          duration: 15,
          setup_time: 5,
        },
        {
          operation: 'Yüzey İşleme',
          workcenter: 'Yüzey İşleme',
          duration: 45,
          setup_time: 10,
        },
      ],
    },
  ],
  features: [
    'Metal işleme süreçleri',
    'Kaynak operasyonları',
    'Boya ve yüzey işleme',
    'Ağırlık hesaplama',
    'Alternatif malzeme seçenekleri',
  ],
  tags: ['metal', 'bom', 'kaynak', 'kesim', 'büküm', 'boya'],
}





