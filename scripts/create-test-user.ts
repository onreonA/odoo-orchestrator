/**
 * Test Kullanıcısı Oluşturma Scripti
 * 
 * Bu script test kullanıcısını Supabase'de oluşturur
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { TEST_USER } from '../test/utils/test-user'
import { resolve } from 'path'

// Load .env.local file
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function createTestUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials not found!')
    console.error('   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
  }

  console.log('🔧 Creating test user...')
  console.log(`   Email: ${TEST_USER.email}`)
  console.log(`   Password: ${TEST_USER.password}`)

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Try to sign up
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
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log('✅ Test user already exists!')
        console.log('   Trying to sign in...')
        
        // Try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_USER.email,
          password: TEST_USER.password,
        })

        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message)
          console.error('   Please check if the user exists and password is correct')
          process.exit(1)
        }

        console.log('✅ Test user sign in successful!')
        console.log(`   User ID: ${signInData.user?.id}`)
        return
      } else {
        console.error('❌ Failed to create test user:', error.message)
        process.exit(1)
      }
    }

    if (data.user) {
      console.log('✅ Test user created successfully!')
      console.log(`   User ID: ${data.user.id}`)
      console.log('   Note: Email confirmation is disabled, so user can login immediately')
    } else {
      console.error('❌ User creation returned no user data')
      process.exit(1)
    }
  } catch (err: any) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

createTestUser()

