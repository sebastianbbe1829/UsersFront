// ==========================
// VALIDACIONES DE EMAIL
// ==========================

export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}


// ==========================
// VALIDACIONES DE TELÉFONO
// ==========================

export const validarTelefono = (telefono) => {
  // Acepta números con 7-15 dígitos, permitiendo espacios y guiones
  const regex = /^[\d\s\-()]{7,15}$/
  return regex.test(telefono.replace(/\s/g, ''))
}


// ==========================
// VALIDACIONES DE DNI
// ==========================

export const validarDNI = (dni) => {
  // Acepta números de 6 a 20 dígitos
  const regex = /^\d{6,20}$/
  return regex.test(dni)
}


// ==========================
// VALIDACIONES DE CONTRASEÑA
// ==========================

export const validarContrasena = (contrasena) => {
  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return regex.test(contrasena)
}


// ==========================
// OBTENER MENSAJE DE VALIDACIÓN DE CONTRASEÑA
// ==========================

export const obtenerMensajeContrasena = () => {
  return 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números'
}


// ==========================
// VALIDACIONES DE NOMBRE
// ==========================

export const validarNombre = (nombre) => {
  const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/
  return regex.test(nombre.trim())
}


// ==========================
// OBJETO DE VALIDACIÓN
// ==========================

export const validaciones = {
  email: (email) => {
    const trimmed = email.trim()
    if (!trimmed) return { valido: false, error: 'El email es requerido' }
    if (!validarEmail(trimmed)) {
      return { valido: false, error: 'El email no es válido' }
    }
    return { valido: true, error: '' }
  },

  nombre: (nombre) => {
    const trimmed = nombre.trim()
    if (!trimmed) return { valido: false, error: 'El nombre es requerido' }
    if (trimmed.length < 2) {
      return { valido: false, error: 'El nombre debe tener al menos 2 caracteres' }
    }
    if (!validarNombre(trimmed)) {
      return { valido: false, error: 'El nombre solo puede contener letras y espacios' }
    }
    return { valido: true, error: '' }
  },

  telefono: (telefono) => {
    const trimmed = telefono.trim()
    if (!trimmed) return { valido: false, error: 'El teléfono es requerido' }
    if (!validarTelefono(trimmed)) {
      return { valido: false, error: 'El teléfono no es válido' }
    }
    return { valido: true, error: '' }
  },

  dni: (dni) => {
    const trimmed = dni.trim()
    if (!trimmed) return { valido: false, error: 'El DNI es requerido' }
    if (!validarDNI(trimmed)) {
      return { valido: false, error: 'El DNI debe contener solo números (6-20 dígitos)' }
    }
    return { valido: true, error: '' }
  },

  contrasena: (contrasena) => {
    if (!contrasena) return { valido: false, error: 'La contraseña es requerida' }
    if (!validarContrasena(contrasena)) {
      return { valido: false, error: obtenerMensajeContrasena() }
    }
    return { valido: true, error: '' }
  },

  contrasenaNueva: (contrasena) => {
    // Para edición, la contraseña nueva es opcional
    if (!contrasena) return { valido: true, error: '' }
    if (!validarContrasena(contrasena)) {
      return { valido: false, error: obtenerMensajeContrasena() }
    }
    return { valido: true, error: '' }
  },
}
