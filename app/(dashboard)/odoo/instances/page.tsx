import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InstanceList } from '@/components/odoo/instance-list'
import { getOdooInstanceService } from '@/lib/services/odoo-instance-service'

export default async function InstancesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch instances
  const instanceService = getOdooInstanceService()
  let instances = []

  try {
    if (profile.role === 'super_admin') {
      instances = await instanceService.getAllInstances()
    } else if (profile.company_id) {
      const instance = await instanceService.getInstanceInfo(profile.company_id)
      instances = instance ? [instance] : []
    }
  } catch (error) {
    console.error('Failed to fetch instances:', error)
  }

  return (
    <div className="space-y-6">
      <InstanceList initialInstances={instances} />
    </div>
  )
}
