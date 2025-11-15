/**
 * Seed Template Library
 *
 * This script seeds the template_library table with initial templates
 * Run with: npx tsx scripts/seed-template-library.ts
 */

import { createClient } from '@supabase/supabase-js'
import { aekaMobilyaKickoffTemplate } from '@/lib/templates/aeka-mobilya-kickoff'
import { sahbazManufacturingKickoffTemplate } from '@/lib/templates/sahbaz-manufacturing-kickoff'
import { fwaServiceKickoffTemplate } from '@/lib/templates/fwa-service-kickoff'
import { bomFurnitureTemplate } from '@/lib/templates/bom-furniture-template'
import { bomMetalTemplate } from '@/lib/templates/bom-metal-template'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') })
dotenv.config({ path: resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:')
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('  SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedTemplateLibrary() {
  console.log('🌱 Seeding template library...')

  // Mobilya Kick-off Template
  const mobilyaTemplate = {
    template_id: 'kickoff-mobilya-v1',
    name: 'Mobilya Üretim & E-Ticaret Kick-off',
    type: 'kickoff',
    version: '1.0.0',
    industry: 'furniture',
    sub_category: 'modular_furniture_ecommerce',
    tags: ['mobilya', 'e-ticaret', 'üretim', 'modüler', 'trendyol'],
    structure: aekaMobilyaKickoffTemplate,
    description:
      'Modüler mobilya üretimi ve e-ticaret yapan firmalar için kapsamlı kick-off template\'i. AEKA Mobilya\'dan çıkarılan best practices.',
    features: [
      'E-ticaret odaklı (Trendyol, N11, Shopify)',
      'Modüler BOM yapısı',
      'İade yönetimi',
      '9 modül analizi',
      '5 fazlı proje planı',
      'Atölye ziyareti checklist',
    ],
    required_odoo_modules: [
      'mrp',
      'stock',
      'purchase',
      'quality_control',
      'sale_management',
      'account',
      'hr',
      'website_sale',
      'helpdesk',
    ],
    required_odoo_version: '19.0',
    estimated_duration: 70, // gün
    estimated_cost_min: 150000,
    estimated_cost_max: 250000,
    currency: 'TRY',
    created_from_company_name: 'AEKA Mobilya',
    status: 'published',
    is_official: true,
    is_featured: true,
    usage_count: 0,
  }

  try {
    // Check if template already exists
    const { data: existing } = await supabase
      .from('template_library')
      .select('id')
      .eq('template_id', 'kickoff-mobilya-v1')
      .single()

    if (existing) {
      console.log('✅ Template already exists, updating...')
      const { data, error } = await supabase
        .from('template_library')
        .update(mobilyaTemplate)
        .eq('template_id', 'kickoff-mobilya-v1')
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating template:', error)
        process.exit(1)
      }

      console.log('✅ Template updated:', data?.name)
    } else {
      console.log('📝 Creating new template...')
      const { data, error } = await supabase.from('template_library').insert(mobilyaTemplate).select().single()

      if (error) {
        console.error('❌ Error creating template:', error)
        process.exit(1)
      }

      console.log('✅ Template created:', data?.name)
    }

    // Genel Üretim Kick-off Template
    const manufacturingTemplate = {
      template_id: 'kickoff-manufacturing-v1',
      name: 'Genel Üretim Kick-off',
      type: 'kickoff',
      version: '1.0.0',
      industry: 'manufacturing',
      sub_category: 'general_manufacturing',
      tags: ['üretim', 'genel', 'mrp', 'stok', 'kalite'],
      structure: sahbazManufacturingKickoffTemplate,
      description:
        'Genel üretim yapan firmalar için kapsamlı kick-off template\'i. Şahbaz\'dan çıkarılan best practices.',
      features: [
        'Kapsamlı MRP yapısı',
        'Kalite kontrol entegrasyonu',
        'Bakım yönetimi',
        '9 modül analizi',
        '7 departman yapısı',
        'Proje yönetimi desteği',
      ],
      required_odoo_modules: [
        'mrp',
        'stock',
        'purchase',
        'quality_control',
        'maintenance',
        'sale',
        'account_accountant',
        'hr',
        'project',
      ],
      required_odoo_version: '19.0',
      estimated_duration: 60, // gün
      estimated_cost_min: 120000,
      estimated_cost_max: 200000,
      currency: 'TRY',
      created_from_company_name: 'Şahbaz',
      status: 'published',
      is_official: true,
      is_featured: true,
      usage_count: 0,
    }

    // Check if manufacturing template already exists
    const { data: existingManufacturing } = await supabase
      .from('template_library')
      .select('id')
      .eq('template_id', 'kickoff-manufacturing-v1')
      .single()

    if (existingManufacturing) {
      console.log('✅ Manufacturing template already exists, updating...')
      const { data, error } = await supabase
        .from('template_library')
        .update(manufacturingTemplate)
        .eq('template_id', 'kickoff-manufacturing-v1')
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating manufacturing template:', error)
        process.exit(1)
      }

      console.log('✅ Manufacturing template updated:', data?.name)
    } else {
      console.log('📝 Creating manufacturing template...')
      const { data, error } = await supabase
        .from('template_library')
        .insert(manufacturingTemplate)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating manufacturing template:', error)
        process.exit(1)
      }

      console.log('✅ Manufacturing template created:', data?.name)
    }

    // Hizmet Sektörü Kick-off Template
    const serviceTemplate = {
      template_id: 'kickoff-service-v1',
      name: 'Hizmet Sektörü Kick-off',
      type: 'kickoff',
      version: '1.0.0',
      industry: 'service',
      sub_category: 'professional_services',
      tags: ['hizmet', 'proje', 'crm', 'zaman takibi', 'müşteri desteği'],
      structure: fwaServiceKickoffTemplate,
      description:
        'Hizmet sektörü firmaları için kapsamlı kick-off template\'i. FWA\'dan çıkarılan best practices.',
      features: [
        'Proje yönetimi odaklı',
        'Zaman takip sistemi',
        'CRM entegrasyonu',
        '8 modül analizi',
        '5 departman yapısı',
        'Müşteri destek sistemi',
      ],
      required_odoo_modules: [
        'project',
        'hr_timesheet',
        'crm',
        'sale',
        'account_accountant',
        'helpdesk',
        'hr',
        'website',
      ],
      required_odoo_version: '19.0',
      estimated_duration: 50, // gün
      estimated_cost_min: 100000,
      estimated_cost_max: 180000,
      currency: 'TRY',
      created_from_company_name: 'FWA',
      status: 'published',
      is_official: true,
      is_featured: true,
      usage_count: 0,
    }

    // Check if service template already exists
    const { data: existingService } = await supabase
      .from('template_library')
      .select('id')
      .eq('template_id', 'kickoff-service-v1')
      .single()

    if (existingService) {
      console.log('✅ Service template already exists, updating...')
      const { data, error } = await supabase
        .from('template_library')
        .update(serviceTemplate)
        .eq('template_id', 'kickoff-service-v1')
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating service template:', error)
        process.exit(1)
      }

      console.log('✅ Service template updated:', data?.name)
    } else {
      console.log('📝 Creating service template...')
      const { data, error } = await supabase
        .from('template_library')
        .insert(serviceTemplate)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating service template:', error)
        process.exit(1)
      }

      console.log('✅ Service template created:', data?.name)
    }

    // Mobilya BOM Template
    const bomFurniture = {
      template_id: 'bom-furniture-v1',
      name: 'Mobilya BOM Template',
      type: 'bom',
      version: '1.0.0',
      industry: 'furniture',
      sub_category: 'modular_furniture',
      tags: ['mobilya', 'bom', 'modüler', 'laminant', 'mdf'],
      structure: bomFurnitureTemplate,
      description:
        'Modüler mobilya üretimi için hazır BOM yapıları. Standart mobilya parçaları ve montaj süreçleri.',
      features: [
        'Modüler yapı desteği',
        'Alternatif malzeme seçenekleri',
        'Routing bilgileri',
        'Maliyet hesaplama',
        'Tedarikçi bilgileri',
      ],
      required_odoo_modules: ['mrp', 'stock', 'purchase'],
      required_odoo_version: '19.0',
      estimated_duration: 5, // gün
      estimated_cost_min: 10000,
      estimated_cost_max: 20000,
      currency: 'TRY',
      status: 'published',
      is_official: true,
      is_featured: false,
      usage_count: 0,
    }

    // Check if BOM furniture template already exists
    const { data: existingBOMFurniture } = await supabase
      .from('template_library')
      .select('id')
      .eq('template_id', 'bom-furniture-v1')
      .single()

    if (existingBOMFurniture) {
      console.log('✅ BOM Furniture template already exists, updating...')
      const { data, error } = await supabase
        .from('template_library')
        .update(bomFurniture)
        .eq('template_id', 'bom-furniture-v1')
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating BOM Furniture template:', error)
        process.exit(1)
      }

      console.log('✅ BOM Furniture template updated:', data?.name)
    } else {
      console.log('📝 Creating BOM Furniture template...')
      const { data, error } = await supabase
        .from('template_library')
        .insert(bomFurniture)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating BOM Furniture template:', error)
        process.exit(1)
      }

      console.log('✅ BOM Furniture template created:', data?.name)
    }

    // Metal BOM Template
    const bomMetal = {
      template_id: 'bom-metal-v1',
      name: 'Metal BOM Template',
      type: 'bom',
      version: '1.0.0',
      industry: 'metal',
      sub_category: 'metal_processing',
      tags: ['metal', 'bom', 'kaynak', 'kesim', 'büküm', 'boya'],
      structure: bomMetalTemplate,
      description:
        'Metal işleme ve imalat için hazır BOM yapıları. Kaynak, kesim, büküm ve montaj süreçleri.',
      features: [
        'Metal işleme süreçleri',
        'Kaynak operasyonları',
        'Boya ve yüzey işleme',
        'Ağırlık hesaplama',
        'Alternatif malzeme seçenekleri',
      ],
      required_odoo_modules: ['mrp', 'stock', 'purchase'],
      required_odoo_version: '19.0',
      estimated_duration: 5, // gün
      estimated_cost_min: 12000,
      estimated_cost_max: 25000,
      currency: 'TRY',
      status: 'published',
      is_official: true,
      is_featured: false,
      usage_count: 0,
    }

    // Check if BOM metal template already exists
    const { data: existingBOMMetal } = await supabase
      .from('template_library')
      .select('id')
      .eq('template_id', 'bom-metal-v1')
      .single()

    if (existingBOMMetal) {
      console.log('✅ BOM Metal template already exists, updating...')
      const { data, error } = await supabase
        .from('template_library')
        .update(bomMetal)
        .eq('template_id', 'bom-metal-v1')
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating BOM Metal template:', error)
        process.exit(1)
      }

      console.log('✅ BOM Metal template updated:', data?.name)
    } else {
      console.log('📝 Creating BOM Metal template...')
      const { data, error } = await supabase
        .from('template_library')
        .insert(bomMetal)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating BOM Metal template:', error)
        process.exit(1)
      }

      console.log('✅ BOM Metal template created:', data?.name)
    }

    console.log('✅ Template library seeded successfully!')
  } catch (error: any) {
    console.error('❌ Error seeding template library:', error.message)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  seedTemplateLibrary()
    .then(() => {
      console.log('✅ Seed completed')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Seed failed:', error)
      process.exit(1)
    })
}

export { seedTemplateLibrary }

