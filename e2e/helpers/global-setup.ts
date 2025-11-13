/**
 * Global Setup for E2E Tests
 *
 * This runs once before all tests to set up test environment
 */

import { chromium, FullConfig } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { TEST_USER } from '../../test/utils/test-user'

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up E2E test environment...')

  // Check if Supabase credentials are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️  Supabase credentials not found. Skipping test user setup.')
    console.warn('   Tests will use existing test user or fail if user does not exist.')
    return
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Try to create test user
    console.log('👤 Creating test user...')
    const { data, error } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          full_name: TEST_USER.fullName,
        },
        emailRedirectTo: 'http://localhost:3001/dashboard',
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Test user already exists')
      } else {
        console.warn(`⚠️  Could not create test user: ${error.message}`)
        console.warn('   Tests will use existing test user or fail if user does not exist.')
      }
    } else {
      console.log('✅ Test user created successfully')
    }
  } catch (error: any) {
    console.warn(`⚠️  Error during test setup: ${error.message}`)
    console.warn('   Tests will continue but may fail if test user does not exist.')
  }

  console.log('✅ E2E test environment setup complete')
}

export default globalSetup
