/**
 * Test User Utilities
 *
 * Helper functions for creating and managing test users in E2E tests
 */

export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  fullName: 'Test User',
}

export const TEST_ADMIN_USER = {
  email: 'admin@example.com',
  password: 'adminpassword123',
  fullName: 'Admin User',
}

/**
 * Create a test user in Supabase (for E2E tests)
 * This should be called in test setup
 */
export async function createTestUser(supabase: any, user = TEST_USER) {
  try {
    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.fullName,
        },
      },
    })

    if (error && !error.message.includes('already registered')) {
      throw error
    }

    return data
  } catch (error: any) {
    // User might already exist, try to sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    })

    if (signInError) {
      throw signInError
    }

    return data
  }
}

/**
 * Clean up test user (for E2E tests cleanup)
 */
export async function deleteTestUser(supabase: any, email: string) {
  // Note: In production, you'd need admin access to delete users
  // For tests, we'll just sign out
  await supabase.auth.signOut()
}
