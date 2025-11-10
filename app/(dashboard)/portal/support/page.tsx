'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Filter, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface SupportTicket {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  company_id: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showNewTicketModal, setShowNewTicketModal] = useState(false)

  useEffect(() => {
    loadTickets()
  }, [statusFilter])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/support/tickets?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setTickets(data.data || [])
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'waiting':
        return 'bg-orange-100 text-orange-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Açık',
      in_progress: 'Devam Ediyor',
      waiting: 'Beklemede',
      resolved: 'Çözüldü',
      closed: 'Kapatıldı',
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'Kritik',
      high: 'Yüksek',
      medium: 'Orta',
      low: 'Düşük',
    }
    return labels[priority] || priority
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'waiting':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      default:
        return <MessageSquare className="w-5 h-5 text-blue-500" />
    }
  }

  const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Destek Talepleri</h1>
          <p className="text-gray-600">Sorularınız ve sorunlarınız için destek talebi oluşturun</p>
        </div>
        <button
          onClick={() => setShowNewTicketModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <Plus className="w-5 h-5" />
          Yeni Talep
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Toplam Talep</p>
              <p className="text-2xl font-bold">{tickets.length}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Açık Talepler</p>
              <p className="text-2xl font-bold">{openTickets}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Çözülen</p>
              <p className="text-2xl font-bold">{resolvedTickets}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="open">Açık</option>
          <option value="in_progress">Devam Ediyor</option>
          <option value="waiting">Beklemede</option>
          <option value="resolved">Çözüldü</option>
          <option value="closed">Kapatıldı</option>
        </select>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Yükleniyor...</div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Henüz Destek Talebi Yok</h2>
          <p className="text-gray-600 mb-4">İlk destek talebinizi oluşturarak başlayın</p>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Yeni Talep Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/support/${ticket.id}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(ticket.status)}
                    <h3 className="text-xl font-semibold">{ticket.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Oluşturulma: {new Date(ticket.created_at).toLocaleDateString('tr-TR')}</span>
                    {ticket.resolved_at && (
                      <span>Çözülme: {new Date(ticket.resolved_at).toLocaleDateString('tr-TR')}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Yeni Destek Talebi</h2>
            <p className="text-gray-600 mb-4">Destek talebi oluşturma formu yakında eklenecek.</p>
            <button
              onClick={() => setShowNewTicketModal(false)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

