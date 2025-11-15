/**
 * Browser Console Test Script for Instance Creation
 *
 * Bu script'i browser console'da çalıştırarak instance oluşturma testi yapabilirsiniz.
 *
 * Kullanım:
 * 1. Browser'da /odoo/instances/new sayfasına gidin
 * 2. F12 ile Developer Tools'u açın
 * 3. Console sekmesine geçin
 * 4. Bu script'i yapıştırın ve Enter'a basın
 */

async function testInstanceCreate() {
  console.log('🧪 Instance Oluşturma Testi Başlatılıyor...\n')

  // 1. Form verilerini hazırla
  const testData = {
    companyId: '', // Önce company listesini al
    deploymentMethod: 'odoo_com',
    instanceName: 'Test Instance ' + Date.now(),
    instanceUrl: 'https://test-instance-' + Date.now() + '.odoo.com',
    databaseName: 'test_db_' + Date.now(),
    version: '19.0',
    adminUsername: 'admin',
    adminPassword: 'test123456',
  }

  try {
    // 2. Company listesini al
    console.log('📋 Company listesi alınıyor...')
    const companiesRes = await fetch('/api/v1/companies')
    const companiesData = await companiesRes.json()

    if (!companiesRes.ok || !companiesData.companies || companiesData.companies.length === 0) {
      throw new Error('Company bulunamadı. Önce bir company oluşturun.')
    }

    testData.companyId = companiesData.companies[0].id
    console.log('✅ Company bulundu:', companiesData.companies[0].name)
    console.log('   Company ID:', testData.companyId)

    // 3. Instance oluştur
    console.log('\n🚀 Instance oluşturuluyor...')
    console.log('   Instance Name:', testData.instanceName)
    console.log('   Instance URL:', testData.instanceUrl)
    console.log('   Database Name:', testData.databaseName)
    console.log('   Version:', testData.version)
    console.log('   Deployment Method:', testData.deploymentMethod)

    const createRes = await fetch('/api/odoo/instances', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: testData.companyId,
        deploymentMethod: testData.deploymentMethod,
        instanceName: testData.instanceName,
        instanceUrl: testData.instanceUrl,
        databaseName: testData.databaseName,
        version: testData.version,
        adminUsername: testData.adminUsername,
        adminPassword: testData.adminPassword,
      }),
    })

    const createData = await createRes.json()

    if (!createRes.ok) {
      throw new Error(createData.error || 'Instance oluşturulamadı')
    }

    console.log('\n✅ Instance başarıyla oluşturuldu!')
    console.log('   Instance ID:', createData.instance.id)
    console.log('   Instance Name:', createData.instance.instance_name)
    console.log('   Instance URL:', createData.instance.instance_url)
    console.log('   Status:', createData.instance.status)
    console.log('\n📍 Instance detay sayfası:', `/odoo/instances/${createData.instance.id}`)

    return createData.instance
  } catch (error) {
    console.error('\n❌ Hata:', error.message)
    console.error('   Detaylar:', error)
    throw error
  }
}

// Test'i çalıştır
testInstanceCreate()
  .then(instance => {
    console.log('\n✅ Test başarıyla tamamlandı!')
    console.log('   Oluşturulan instance:', instance)
  })
  .catch(error => {
    console.error('\n❌ Test başarısız:', error)
  })
