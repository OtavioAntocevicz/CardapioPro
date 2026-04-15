import type { Category, Product } from '@/types/database'
import { formatPrice } from '@/utils/format'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function groupMenuSections(products: Product[], categories: Category[]) {
  const validCatIds = new Set(categories.map((c) => c.id))
  const visible = products.filter((p) => p.is_available)
  const byCat = new Map<string | null, Product[]>()
  for (const p of visible) {
    const k =
      p.category_id && validCatIds.has(p.category_id) ? p.category_id : null
    if (!byCat.has(k)) byCat.set(k, [])
    byCat.get(k)!.push(p)
  }

  const sections: { label: string; items: Product[] }[] = []
  for (const c of categories) {
    const items = byCat.get(c.id)
    if (items?.length) sections.push({ label: c.name, items })
  }
  const uncategorized = byCat.get(null)
  if (uncategorized?.length) {
    sections.push({ label: 'Outros', items: uncategorized })
  }
  return sections
}

function buildMenuHtml(opts: {
  restaurantName: string
  includePhotos: boolean
  sections: { label: string; items: Product[] }[]
}) {
  const { restaurantName, includePhotos, sections } = opts

  const body = sections
    .map((sec) => {
      const rows = sec.items
        .map((p) => {
          const price = escapeHtml(formatPrice(Number(p.price)))
          const desc = p.description ? escapeHtml(p.description) : ''
          const thumb =
            includePhotos && p.image_url
              ? `<img width="56" height="56" style="flex-shrink:0;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;" crossorigin="anonymous" src="${escapeHtml(p.image_url)}" alt="" />`
              : ''
          const rowStyle =
            'display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f3f4f6;'
          const inner = `
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;">
                <span style="font-weight:600;font-size:13px;color:#111827;">${escapeHtml(p.name)}</span>
                <span style="font-weight:700;font-size:13px;color:#4f46e5;white-space:nowrap;">${price}</span>
              </div>
              ${desc ? `<p style="margin:4px 0 0 0;font-size:11px;line-height:1.4;color:#6b7280;">${desc}</p>` : ''}
            </div>`
          if (includePhotos) {
            return `<div style="${rowStyle}">${thumb}${inner}</div>`
          }
          return `<div style="display:flex;align-items:flex-start;padding:10px 0;border-bottom:1px solid #f3f4f6;">${inner}</div>`
        })
        .join('')

      return `
        <section style="margin-top:18px;">
          <h2 style="margin:0 0 10px 0;font-size:15px;font-weight:700;color:#111827;border-bottom:1px solid #d1d5db;padding-bottom:4px;">${escapeHtml(sec.label)}</h2>
          <div>${rows}</div>
        </section>`
    })
    .join('')

  return `
    <div style="width:680px;background:#ffffff;color:#111827;padding:20px 24px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;box-sizing:border-box;">
      <header style="border-bottom:2px solid #4f46e5;padding-bottom:12px;margin-bottom:4px;">
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;">${escapeHtml(restaurantName)}</h1>
      </header>
      ${body}
      <footer style="margin-top:28px;padding-top:14px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;font-size:8px;letter-spacing:0.02em;color:#9ca3af;">
          Cardápio<span style="color:#4f46e5;font-weight:600;">Pro</span>
        </p>
      </footer>
    </div>`
}

/**
 * html2canvas não interpreta cores em oklch (usadas pelo Tailwind v4 no app).
 * Um iframe com documento mínimo evita herdar estilos globais.
 */
function mountMenuInIsolatedFrame(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'exportacao-pdf-cardapio')
  iframe.style.cssText =
    'position:fixed;left:-12000px;top:0;width:720px;height:9000px;border:0;opacity:0;pointer-events:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) {
    iframe.remove()
    throw new Error('Não foi possível preparar o PDF (iframe).')
  }

  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  html, body { margin: 0; padding: 0; background: #ffffff; color: #111827; }
  body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  *, *::before, *::after { box-sizing: border-box; }
</style></head><body>${html}</body></html>`)
  doc.close()

  const root = doc.body.firstElementChild as HTMLElement | null
  if (!root) {
    iframe.remove()
    throw new Error('Não foi possível preparar o PDF (conteúdo vazio).')
  }

  return { iframe, root }
}

function waitForImages(root: HTMLElement) {
  const imgs = root.querySelectorAll('img')
  return Promise.all(
    [...imgs].map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        }),
    ),
  )
}

function addCanvasToPdf(pdf: jsPDF, canvas: HTMLCanvasElement, marginMm: number) {
  const imgData = canvas.toDataURL('image/jpeg', 0.92)
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = pdf.internal.pageSize.getHeight()
  const contentW = pdfW - 2 * marginMm
  const pageInnerH = pdfH - 2 * marginMm
  const imgDisplayH = (canvas.height * contentW) / canvas.width

  let yPos = marginMm
  pdf.addImage(imgData, 'JPEG', marginMm, yPos, contentW, imgDisplayH)

  let heightLeft = imgDisplayH - pageInnerH
  while (heightLeft > 0) {
    yPos = marginMm - (imgDisplayH - heightLeft)
    pdf.addPage()
    pdf.addImage(imgData, 'JPEG', marginMm, yPos, contentW, imgDisplayH)
    heightLeft -= pageInnerH
  }
}

export async function downloadMenuPdf(params: {
  restaurantName: string
  categories: Category[]
  products: Product[]
  includePhotos: boolean
  fileBaseName: string
}) {
  const sections = groupMenuSections(params.products, params.categories)
  if (sections.length === 0) {
    throw new Error('Não há itens disponíveis no cardápio para exportar.')
  }

  const html = buildMenuHtml({
    restaurantName: params.restaurantName,
    includePhotos: params.includePhotos,
    sections,
  })

  const { iframe, root } = mountMenuInIsolatedFrame(html)

  try {
    if (params.includePhotos) {
      await waitForImages(root)
    }

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      foreignObjectRendering: false,
    })

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    addCanvasToPdf(pdf, canvas, 10)
    pdf.save(`${params.fileBaseName}.pdf`)
  } finally {
    iframe.remove()
  }
}
