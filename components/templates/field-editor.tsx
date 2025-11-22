'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Field {
  field_name: string
  model: string
  field_type: string
  label: string
  required?: boolean
  default_value?: any
  selection?: Array<[string, string]>
}

interface FieldEditorProps {
  fields: Field[]
  onChange: (fields: Field[]) => void
}

export function FieldEditor({ fields, onChange }: FieldEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<Field | null>(null)

  const handleAdd = () => {
    const newField: Field = {
      field_name: 'x_new_field',
      model: 'res.partner',
      field_type: 'char',
      label: 'Yeni Alan',
      required: false,
    }
    onChange([...fields, newField])
    setEditingIndex(fields.length)
    setEditingField(newField)
  }

  const handleEdit = (index: number) => {
    setEditingIndex(index)
    setEditingField({ ...fields[index] })
  }

  const handleSave = () => {
    if (editingIndex !== null && editingField) {
      const updatedFields = [...fields]
      updatedFields[editingIndex] = editingField
      onChange(updatedFields)
      setEditingIndex(null)
      setEditingField(null)
    }
  }

  const handleDelete = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      char: 'Text',
      integer: 'Integer',
      float: 'Float',
      boolean: 'Boolean',
      date: 'Date',
      datetime: 'DateTime',
      selection: 'Selection',
      many2one: 'Many2One',
      one2many: 'One2Many',
      many2many: 'Many2Many',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Fields</h3>
        <Button variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Alan Ekle
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Henüz custom field eklenmemiş</div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              {editingIndex === index ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Field Name *</label>
                      <input
                        type="text"
                        value={editingField?.field_name || ''}
                        onChange={e =>
                          setEditingField({ ...editingField!, field_name: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                        placeholder="x_field_name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Model *</label>
                      <input
                        type="text"
                        value={editingField?.model || ''}
                        onChange={e => setEditingField({ ...editingField!, model: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                        placeholder="res.partner"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Field Type *</label>
                      <select
                        value={editingField?.field_type || 'char'}
                        onChange={e =>
                          setEditingField({ ...editingField!, field_type: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="char">Text</option>
                        <option value="integer">Integer</option>
                        <option value="float">Float</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="datetime">DateTime</option>
                        <option value="selection">Selection</option>
                        <option value="many2one">Many2One</option>
                        <option value="one2many">One2Many</option>
                        <option value="many2many">Many2Many</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Label *</label>
                      <input
                        type="text"
                        value={editingField?.label || ''}
                        onChange={e => setEditingField({ ...editingField!, label: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingField?.required || false}
                        onChange={e =>
                          setEditingField({ ...editingField!, required: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleSave}>
                      Kaydet
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingIndex(null)
                        setEditingField(null)
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{field.field_name}</div>
                    <div className="text-sm text-gray-500">
                      {field.model} • {getFieldTypeLabel(field.field_type)} • {field.label}
                    </div>
                    {field.required && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded mt-1 inline-block">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(index)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



