const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetLogo() {
  try {
    // Update all settings to set logo to null
    const result = await prisma.settings.updateMany({
      data: {
        logo: null,
      },
    })

    console.log(`✅ Logo reset successfully. ${result.count} settings updated.`)
    
    // Create default settings if none exist
    const count = await prisma.settings.count()
    if (count === 0) {
      await prisma.settings.create({
        data: {
          app_name: 'SABAMAS',
          app_description: 'Sistem Billing Sampah',
          logo: null,
          company_name: 'SABAMAS',
          address: 'Jl. Contoh No. 123',
          city: '',
          postal_code: '',
          phone: '(021) 12345678',
          email: 'info@sabamas.com',
          website: '',
          letter_header: null,
          letter_footer: 'Dokumen ini sah tanpa tanda tangan dan stempel',
          signature_name: null,
          signature_title: 'Petugas SABAMAS',
        },
      })
      console.log('✅ Default settings created.')
    }
  } catch (error) {
    console.error('❌ Error resetting logo:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetLogo()
