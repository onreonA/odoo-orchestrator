import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { TestTube, Play, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default async function TestsPage() {
  const supabase = await createClient()

  // Get test runs
  const { data: testRuns, error } = await supabase
    .from('test_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      passed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      running: 'bg-blue-100 text-blue-700',
      pending: 'bg-yellow-100 text-yellow-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testler</h1>
          <p className="text-[var(--neutral-600)] mt-1">Test sonuçlarını görüntüleyin ve yönetin</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Test Raporu
          </Button>
          <Button size="sm">
            <Play className="w-4 h-4 mr-2" />
            Test Çalıştır
          </Button>
        </div>
      </div>

      {/* Test Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--neutral-600)]">Toplam Test</p>
              <p className="text-2xl font-bold mt-1">0</p>
            </div>
            <TestTube className="w-8 h-8 text-[var(--brand-primary-500)]" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--neutral-600)]">Geçen</p>
              <p className="text-2xl font-bold mt-1 text-green-600">0</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--neutral-600)]">Başarısız</p>
              <p className="text-2xl font-bold mt-1 text-red-600">0</p>
            </div>
            <TestTube className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-[var(--neutral-200)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--neutral-600)]">Başarı Oranı</p>
              <p className="text-2xl font-bold mt-1">-</p>
            </div>
            <FileText className="w-8 h-8 text-[var(--brand-primary-500)]" />
          </div>
        </div>
      </div>

      {/* Test Runs List */}
      {error ? (
        <div className="bg-[var(--error)]/10 border border-[var(--error)] rounded-lg p-4 text-[var(--error)]">
          Hata: {error.message}
        </div>
      ) : testRuns && testRuns.length > 0 ? (
        <div className="bg-white rounded-xl border border-[var(--neutral-200)]">
          <div className="p-6 border-b border-[var(--neutral-200)]">
            <h2 className="text-xl font-semibold">Son Test Çalıştırmaları</h2>
          </div>
          <div className="divide-y divide-[var(--neutral-200)]">
            {testRuns.map((run: any) => (
              <div key={run.id} className="p-6 hover:bg-[var(--neutral-50)] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[var(--brand-primary-50)]">
                      <TestTube className="w-5 h-5 text-[var(--brand-primary-500)]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Test Run #{run.id.slice(0, 8)}</h3>
                      <p className="text-sm text-[var(--neutral-600)]">
                        {new Date(run.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                      run.status || 'pending'
                    )}`}
                  >
                    {run.status || 'pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 border border-[var(--neutral-200)] text-center">
          <TestTube className="w-16 h-16 text-[var(--neutral-300)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Henüz test çalıştırması yok</h3>
          <p className="text-[var(--neutral-600)] mb-6">
            İlk test çalıştırmasını başlatmak için "Test Çalıştır" butonuna tıklayın
          </p>
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Test Çalıştır
          </Button>
        </div>
      )}
    </div>
  )
}
