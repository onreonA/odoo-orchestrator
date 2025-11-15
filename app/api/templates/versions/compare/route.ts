import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const version1Id = searchParams.get('version1')
  const version2Id = searchParams.get('version2')

  if (!version1Id || !version2Id) {
    return NextResponse.json({ error: 'Missing version IDs' }, { status: 400 })
  }

  // Get both versions
  const { data: version1, error: error1 } = await supabase
    .from('template_versions')
    .select('*')
    .eq('id', version1Id)
    .single()

  const { data: version2, error: error2 } = await supabase
    .from('template_versions')
    .select('*')
    .eq('id', version2Id)
    .single()

  if (error1 || !version1 || error2 || !version2) {
    return NextResponse.json({ error: 'One or both versions not found' }, { status: 404 })
  }

  // Compare structures
  const structure1 = version1.structure as any
  const structure2 = version2.structure as any

  const comparison = {
    modules: compareArrays(structure1?.modules || [], structure2?.modules || [], 'technical_name'),
    custom_fields: compareArrays(
      structure1?.custom_fields || [],
      structure2?.custom_fields || [],
      'field_name'
    ),
    workflows: compareArrays(structure1?.workflows || [], structure2?.workflows || [], 'name'),
    dashboards: compareArrays(structure1?.dashboards || [], structure2?.dashboards || [], 'name'),
  }

  return NextResponse.json({ comparison })
}

function compareArrays(arr1: any[], arr2: any[], key: string) {
  const map1 = new Map(arr1.map(item => [item[key], item]))
  const map2 = new Map(arr2.map(item => [item[key], item]))

  const added = arr2.filter(item => !map1.has(item[key]))
  const removed = arr1.filter(item => !map2.has(item[key]))
  const modified = arr1
    .filter(item => map2.has(item[key]))
    .filter(item => JSON.stringify(item) !== JSON.stringify(map2.get(item[key])))

  return {
    added,
    removed,
    modified,
  }
}

