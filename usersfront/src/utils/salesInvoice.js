const money = (value) => new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
}).format(Number(value || 0))

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

export const abrirFactura = (sale) => {
  // Do not use noopener/noreferrer here: some browsers return null from
  // window.open when those flags are combined with an about:blank document.
  const invoiceWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes')
  if (!invoiceWindow) {
    throw new Error('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio.')
  }

  const items = (sale.items || []).map((item) => `
    <tr><td>${escapeHtml(item.product_code)}</td><td>${escapeHtml(item.product_name)}</td>
    <td>${escapeHtml(item.quantity)}</td><td>${money(item.unit_price)}</td><td>${money(item.line_total)}</td></tr>`).join('')
  const customers = (sale.customers || []).map((customer) => `<li>${escapeHtml(customer.customer_name)} — ${customer.allocation_percentage}% — ${money(customer.allocation_amount)}</li>`).join('')
  const payments = (sale.payments || [])
    .map((payment) => `<li>${escapeHtml(payment.payment_method)} — ${money(payment.amount)}</li>`)
    .join('')

  invoiceWindow.document.open()
  invoiceWindow.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Factura ${escapeHtml(sale.sale_number)}</title>
    <style>body{font-family:Arial,sans-serif;margin:32px;color:#222}h1{margin:0 0 4px}.muted{color:#666}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.summary{margin-left:auto;max-width:360px;margin-top:20px}.summary div{display:flex;justify-content:space-between;padding:4px}.total{font-size:20px;font-weight:bold;border-top:2px solid #222;margin-top:6px;padding-top:10px}.columns{display:flex;gap:48px;margin-top:28px}.columns>div{flex:1}@media print{body{margin:12mm}.no-print{display:none}}</style>
    </head><body><div class="no-print" style="text-align:right"><button onclick="window.print()">🖨️ Imprimir</button></div>
    <h1>Factura ${escapeHtml(sale.sale_number)}</h1><div class="muted">Estado: ${escapeHtml(sale.status)}</div>
    <div class="muted">Fecha: ${escapeHtml(sale.created_at ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(sale.created_at)) : '—')}</div>
    <table><thead><tr><th>Código</th><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>${items}</tbody></table>
    <div class="summary"><div><span>Subtotal</span><span>${money(sale.subtotal)}</span></div><div><span>Descuento (${sale.discount_percentage}%)</span><span>${money(sale.discount_amount)}</span></div><div class="total"><span>Total</span><span>${money(sale.total)}</span></div></div>
    <div class="columns"><div><h3>Cliente(s)</h3><ul>${customers || '<li>Consumidor final</li>'}</ul></div><div><h3>Medios de pago</h3><ul>${payments || '<li>Sin medios de pago registrados.</li>'}</ul></div></div>
    </body></html>`)
  invoiceWindow.document.close()
  invoiceWindow.focus()

  // Keep the print call tied to the user-initiated popup. The small delay gives
  // the browser time to finish rendering the invoice without relying on onload.
  window.setTimeout(() => {
    try {
      invoiceWindow.print()
    } catch {
      // The invoice remains open with its own Imprimir button as fallback.
    }
  }, 250)
}
