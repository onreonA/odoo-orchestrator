/**
 * Seed Template Library
 *
 * This script seeds the template_library table with initial templates
 * Run with: npx tsx scripts/seed-template-library.ts
 */

import { createClient } from '@supabase/supabase-js'
import { aekaMobilyaKickoffTemplate } from '@/lib/templates/aeka-mobilya-kickoff'
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

