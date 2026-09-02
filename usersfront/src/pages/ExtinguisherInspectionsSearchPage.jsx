import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { buscarExtintores, obtenerExtintor } from '../services/api'
import ExtinguisherInspectionsPage from './ExtinguisherInspectionsPage'

const SELECTOR_ATTRIBUTE = 'data-extinguisher-search-enhanced'

const crearTarjeta = (extintor, onSelect) => {
  const card = document.createElement('button')
  card.type = 'button'
  card.className = 'w-100 text-start border rounded bg-body p-3 mb-2 shadow-sm'
  card.style.cursor = 'pointer'
  card.innerHTML = `
    <div class="d-flex justify-content-between align-items-start gap-2">
      <div>
        <div class="fw-bold">🧯 ${extintor.code || 'Sin código'}</div>
        <div class="small text-muted">${extintor.extinguisher_type?.name || 'Sin tipo'}${extintor.capacity ? ` · ${extintor.capacity}` : ''}</div>
        <div class="small mt-1">📍 ${extintor.location || 'Sin ubicación'}</div>
      </div>
      <span class="badge text-bg-primary">Seleccionar</span>
    </div>
  `
  card.addEventListener('click', () => onSelect(extintor))
  return card
}

function ExtinguisherInspectionsSearchPage() {
  const { token, manejarSesionExpirada } = useAuth()

  useEffect(() => {
    if (!token) return undefined

    const enhanced = new WeakSet()

    const enhance = async (select) => {
      if (enhanced.has(select)) return
      enhanced.add(select)
      select.setAttribute(SELECTOR_ATTRIBUTE, 'true')
      select.style.display = 'none'

      const container = document.createElement('div')
      container.className = 'extinguisher-search-container'
      select.parentNode.insertBefore(container, select)

      let searchTimer = null
      let requestId = 0

      const render = (html) => {
        container.innerHTML = html
      }

      const selectedId = () => select.value ? String(select.value) : ''

      const selectExtinguisher = (extintor) => {
        select.value = String(extintor.id)
        select.dispatchEvent(new Event('change', { bubbles: true }))
        render(`
          <div class="border rounded p-3 bg-body shadow-sm">
            <div class="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div class="text-muted small">Extintor seleccionado</div>
                <div class="fw-bold fs-5">🧯 ${extintor.code || 'Sin código'}</div>
                <div class="small text-muted">${extintor.extinguisher_type?.name || 'Sin tipo'}${extintor.capacity ? ` · ${extintor.capacity}` : ''}</div>
                <div class="small mt-1">📍 ${extintor.location || 'Sin ubicación'}</div>
              </div>
              <button type="button" class="btn btn-outline-secondary btn-sm cambiar-extintor">Cambiar</button>
            </div>
          </div>
        `)
        container.querySelector('.cambiar-extintor')?.addEventListener('click', () => renderSearch(''))
      }

      const loadSelected = async () => {
        if (!selectedId()) {
          renderSearch('')
          return
        }
        try {
          const extintor = await obtenerExtintor(Number(selectedId()), token)
          selectExtinguisher(extintor)
        } catch (error) {
          if (error.status === 401) manejarSesionExpirada()
          else renderSearch('')
        }
      }

      const renderSearch = (value) => {
        container.innerHTML = `
          <div class="position-relative">
            <label class="form-label fw-semibold">Buscar extintor</label>
            <div class="input-group">
              <span class="input-group-text">🔍</span>
              <input type="search" class="form-control extintor-search-input" placeholder="Código, ubicación, tipo o capacidad..." autocomplete="off" value="${value.replace(/"/g, '&quot;')}" />
            </div>
            <div class="small text-muted mt-1">Escribe al menos 2 caracteres para buscar entre los extintores activos.</div>
            <div class="extintor-search-results mt-2"></div>
          </div>
        `

        const input = container.querySelector('.extintor-search-input')
        const results = container.querySelector('.extintor-search-results')

        input.addEventListener('input', () => {
          clearTimeout(searchTimer)
          const valueActual = input.value.trim()
          if (valueActual.length < 2) {
            results.innerHTML = '<div class="alert alert-light border mb-0">Escribe al menos 2 caracteres para comenzar la búsqueda.</div>'
            return
          }
          results.innerHTML = '<div class="text-center text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Buscando...</div>'
          const currentRequest = ++requestId
          searchTimer = setTimeout(async () => {
            try {
              const encontrados = await buscarExtintores(valueActual, token, 20)
              if (currentRequest !== requestId) return
              results.innerHTML = ''
              if (!encontrados.length) {
                results.innerHTML = '<div class="alert alert-warning mb-0">No encontramos extintores con ese criterio.</div>'
                return
              }
              encontrados.forEach((extintor) => results.appendChild(crearTarjeta(extintor, selectExtinguisher)))
            } catch (error) {
              if (error.status === 401) {
                manejarSesionExpirada()
                return
              }
              results.innerHTML = `<div class="alert alert-danger mb-0">${error.message || 'No fue posible buscar los extintores.'}</div>`
            }
          }, 250)
        })

        input.focus()
      }

      renderSearch('')
      if (selectedId()) await loadSelected()
    }

    const observer = new MutationObserver(() => {
      document.querySelectorAll(`select[name="extinguisherId"]:not([${SELECTOR_ATTRIBUTE}])`).forEach(enhance)
    })

    observer.observe(document.body, { childList: true, subtree: true })
    document.querySelectorAll(`select[name="extinguisherId"]:not([${SELECTOR_ATTRIBUTE}])`).forEach(enhance)

    return () => {
      observer.disconnect()
    }
  }, [token, manejarSesionExpirada])

  return <ExtinguisherInspectionsPage />
}

export default ExtinguisherInspectionsSearchPage
