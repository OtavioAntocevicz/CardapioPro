import QRCode from 'qrcode'

export async function downloadMenuQrPng(publicUrl: string, fileBaseName: string) {
  const dataUrl = await QRCode.toDataURL(publicUrl, {
    width: 512,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = `${fileBaseName}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
}
