import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TemplateCustomizationEditor } from '@/components/templates/customization-editor'

export default async function CustomizeTemplatePage({
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
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Get template
  const { data: template, error } = await supabase
    .from('template_library')
    .select('*')
    .eq('template_id', template_id)
    .single()

  if (error || !template) {
    notFound()
  }

  // Get existing customizations for this template
  const { data: existingCustomizations } = await supabase
    .from('template_customizations')
    .select('*')
    .eq('template_id', template_id)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Template Özelleştir</h1>
        <p className="text-gray-600 mt-1">{template.name} template'ini özelleştirin</p>
      </div>

      {/* Customization Editor */}
      <TemplateCustomizationEditor
        template={template}
        userId={user.id}
        companyId={profile?.company_id}
        existingCustomizations={existingCustomizations || []}
      />
    </div>
  )
}







