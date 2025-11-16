import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { CreateVersionForm } from '@/components/templates/create-version-form'

export default async function CreateVersionPage({
  params,
}: {
  params: Promise<{ template_id: string }>
}) {
  const supabase = await createClient()
  const { template_id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Check if user can create versions
  if (profile?.role !== 'super_admin' && profile?.role !== 'consultant') {
    redirect(`/templates/library/${template_id}/versions`)
  }

  // Get template
  const { data: template, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('template_id', template_id)
    .single()

  if (error || !template) {
    notFound()
  }

  // Get current version
  const { data: currentVersion } = await supabase
    .from('template_versions')
    .select('version')
    .eq('template_id', template_id)
    .eq('is_current', true)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Yeni Versiyon Oluştur</h1>
        <p className="text-gray-600 mt-1">{template.name} için yeni bir versiyon oluşturun</p>
      </div>

      <CreateVersionForm
        templateId={template_id}
        templateStructure={template.structure}
        currentVersion={currentVersion?.version || '1.0.0'}
        userId={user.id}
      />
    </div>
  )
}

