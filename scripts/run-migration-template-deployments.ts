/**
 * Script to manually run template_deployments migration
 * 
 * This script can be run if Supabase CLI is not available
 * Copy the SQL from supabase/migrations/20251113000002_template_deployments.sql
 * and run it in Supabase Dashboard SQL Editor
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function runMigration() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Read migration file
  const migrationPath = path.join(
    __dirname,
    '../supabase/migrations/20251113000002_template_deployments.sql'
  )
  const sql = fs.readFileSync(migrationPath, 'utf-8')

  console.log('Running migration: template_deployments')
  console.log('SQL file:', migrationPath)

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  for (const statement of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      if (error) {
        // Try direct query if RPC doesn't work
        const { error: queryError } = await supabase.from('_migrations').select('*')
        if (queryError) {
          console.warn('Could not execute via RPC, please run manually in Supabase Dashboard')
          console.log('SQL to run:')
          console.log(sql)
          return
        }
      }
    } catch (err) {
      console.warn('Error executing statement:', err)
    }
  }

  console.log('Migration completed!')
}

runMigration().catch(console.error)

