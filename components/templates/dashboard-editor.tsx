'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Dashboard {
  name: string
  model: string
  components: Array<{
    type: string
    title: string
    field: string
  }>
}

interface DashboardEditorProps {
  dashboards: Dashboard[]
  onChange: (dashboards: Dashboard[]) => void
}

export function DashboardEditor({ dashboards, onChange }: DashboardEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleAdd = () => {
    const newDashboard: Dashboard = {
      name: 'Yeni Dashboard',
      model: 'res.partner',
      components: [
        {
          type: 'bar',
          title: 'Örnek Grafik',
          field: 'id',
        },
      ],
    }
    onChange([...dashboards, newDashboard])
    setEditingIndex(dashboards.length)
  }

  const handleDelete = (index: number) => {
    onChange(dashboards.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dashboards</h3>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Dashboard Ekle
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henüz dashboard eklenmemiş</div>
      ) : (
        <div className="space-y-3">
          {dashboards.map((dashboard, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{dashboard.name}</div>
                  <div className="text-sm text-gray-500">
                    {dashboard.model} • {dashboard.components.length} components
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

