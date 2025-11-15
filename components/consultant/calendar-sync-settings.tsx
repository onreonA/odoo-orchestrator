'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarSyncSettingsProps {
  consultantId: string
  calendar: any
}

export function CalendarSyncSettings({ consultantId, calendar }: CalendarSyncSettingsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  useEffect(() => {
    fetchSyncStatus()
  }, [consultantId])

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/consultant/calendar/sync')
      if (response.ok) {
        const data = await response.json()
        setSyncStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching sync status:', error)
    }
  }

  const handleSync = async (syncType: string) => {
    setLoading(syncType)
    try {
      const response = await fetch('/api/consultant/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_type: syncType }),
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()
      setLastSync(new Date().toISOString())
      alert(`${syncType} sync completed: ${data.result.syncedCount} events synced`)
      fetchSyncStatus()
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`)
    } finally {
      setLoading(null)
    }
  }

  const syncTypes = [
    { id: 'odoo', label: 'Odoo Calendar', enabled: syncStatus?.syncEnabled?.odoo },
    { id: 'google', label: 'Google Calendar', enabled: syncStatus?.syncEnabled?.google },
    { id: 'outlook', label: 'Outlook Calendar', enabled: syncStatus?.syncEnabled?.outlook },
  ]

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">Calendar Sync</h3>
      </div>

      <div className="space-y-3">
        {syncTypes.map(syncType => (
          <div
            key={syncType.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              {syncType.enabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
              <span className="font-medium">{syncType.label}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync(syncType.id)}
              disabled={loading === syncType.id || !syncType.enabled}
            >
              {loading === syncType.id ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Sync Now
                </>
              )}
            </Button>
          </div>
        ))}

        <div className="pt-3 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleSync('all')}
            disabled={loading === 'all'}
          >
            {loading === 'all' ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                Syncing All...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" />
                Sync All Calendars
              </>
            )}
          </Button>
        </div>

        {lastSync && (
          <div className="text-xs text-gray-500 text-center">
            Last sync: {new Date(lastSync).toLocaleString('tr-TR')}
          </div>
        )}
      </div>
    </div>
  )
}







