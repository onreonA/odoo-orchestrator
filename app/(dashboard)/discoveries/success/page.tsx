import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DiscoverySuccessPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">Discovery Başarıyla Başlatıldı!</h1>
        <p className="text-gray-600 mb-6">
          Ses kaydınız analiz ediliyor. İşlem tamamlandığında bildirim alacaksınız.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/discoveries">
            <Button>
              Discoveries Listesine Git
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard'a Dön</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}




