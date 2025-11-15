import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If profile doesn't exist, create it
  if (!profile && !profileError) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        role: 'super_admin',
      })
      .select()
      .single()

    if (newProfile) {
      return (
        <div className="min-h-screen bg-[var(--neutral-50)]">
          <Sidebar user={newProfile} />
          <div className="pl-64">
            <Header user={newProfile} />
            <main className="p-6">{children}</main>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      <Sidebar user={profile || null} />
      <div className="pl-64">
        <Header user={profile || null} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}







