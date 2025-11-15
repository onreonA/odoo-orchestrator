'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Workflow {
  name: string
  model: string
  trigger: string
  states: Array<{ name: string; label: string }>
  transitions: Array<{ from: string; to: string; condition?: string }>
}

interface WorkflowEditorProps {
  workflows: Workflow[]
  onChange: (workflows: Workflow[]) => void
}

export function WorkflowEditor({ workflows, onChange }: WorkflowEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAdd = () => {
    const newWorkflow: Workflow = {
      name: 'Yeni Workflow',
      model: 'res.partner',
      trigger: 'on_create',
      states: [{ name: 'draft', label: 'Draft' }],
      transitions: [],
    }
    onChange([...workflows, newWorkflow])
    setEditingIndex(workflows.length)
  }

  const handleDelete = (index: number) => {
    onChange(workflows.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workflows</h3>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Workflow Ekle
        </Button>
      </div>

      {workflows.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henüz workflow eklenmemiş</div>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{workflow.name}</div>
                  <div className="text-sm text-gray-500">
                    {workflow.model} • {workflow.states.length} states •{' '}
                    {workflow.transitions.length} transitions
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditingIndex(index)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


