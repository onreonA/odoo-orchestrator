/**
 * Browser Console Test Script for Instance Detail Page
 *
 * Bu script'i browser console'da çalıştırarak instance detay sayfası testi yapabilirsiniz.
 *
 * Kullanım:
 * 1. Browser'da /odoo/instances/[id] sayfasına gidin
 * 2. F12 ile Developer Tools'u açın
 * 3. Console sekmesine geçin
 * 4. Bu script'i yapıştırın ve Enter'a basın
 */

async function testInstanceDetail(instanceId) {
  console.log('🧪 Instance Detay Sayfası Testi Başlatılıyor...\n')

  if (!instanceId) {
    // URL'den instance ID'yi al
    const pathParts = window.location.pathname.split('/')
    instanceId = pathParts[pathParts.length - 1]

    if (instanceId === 'instances' || !instanceId) {
      throw new Error('Instance ID bulunamadı. Lütfen bir instance detay sayfasına gidin.')
    }
  }

  console.log('📋 Instance ID:', instanceId)

  try {
    // 1. Instance bilgilerini al
    console.log('\n📥 Instance bilgileri alınıyor...')
    const instanceRes = await fetch(`/api/odoo/instances/${instanceId}`)
    const instanceData = await instanceRes.json()

    if (!instanceRes.ok) {
      throw new Error(instanceData.error || 'Instance bulunamadı')
    }

    console.log('✅ Instance bilgileri alındı:')
    console.log('   Instance Name:', instanceData.instance.instance_name)
    console.log('   Instance URL:', instanceData.instance.instance_url)
    console.log('   Database Name:', instanceData.instance.database_name)
    console.log('   Version:', instanceData.instance.version)
    console.log('   Status:', instanceData.instance.status)
    console.log('   Deployment Method:', instanceData.instance.deployment_method)

    // 2. Active deployments kontrolü
    console.log('\n📦 Active deployments kontrol ediliyor...')
    try {
      const deploymentsRes = await fetch(
        `/api/odoo/deployments?instanceId=${instanceId}&status=in_progress`
      )
      const deploymentsData = await deploymentsRes.json()

      if (deploymentsRes.ok && deploymentsData.deployments) {
        console.log('✅ Active deployments:', deploymentsData.deployments.length)
        deploymentsData.deployments.forEach((dep, idx) => {
          console.log(`   ${idx + 1}. Deployment ID: ${dep.id}`)
          console.log(`      Status: ${dep.status}`)
          console.log(`      Progress: ${dep.progress}%`)
          console.log(`      Current Step: ${dep.current_step || 'N/A'}`)
        })
      } else {
        console.log('ℹ️  Active deployment yok')
      }
    } catch (error) {
      console.warn('⚠️  Active deployments kontrol edilemedi:', error.message)
    }

    // 3. Health check (opsiyonel)
    console.log('\n🏥 Health check yapılıyor...')
    try {
      const healthRes = await fetch(`/api/odoo/instances/${instanceId}/health`)
      const healthData = await healthRes.json()

      if (healthRes.ok) {
        console.log('✅ Health check sonucu:')
        console.log('   Status:', healthData.status)
        console.log('   Response Time:', healthData.response_time_ms, 'ms')
        console.log('   Uptime:', healthData.uptime, 'seconds')
      } else {
        console.warn('⚠️  Health check başarısız:', healthData.error)
      }
    } catch (error) {
      console.warn('⚠️  Health check yapılamadı:', error.message)
    }

    console.log('\n✅ Test başarıyla tamamlandı!')
    return instanceData.instance
  } catch (error) {
    console.error('\n❌ Hata:', error.message)
    console.error('   Detaylar:', error)
    throw error
  }
}

// Test'i çalıştır
testInstanceDetail()
  .then(instance => {
    console.log('\n✅ Instance detay testi başarılı!')
  })
  .catch(error => {
    console.error('\n❌ Test başarısız:', error)
  })
