import { format } from 'date-fns'

/**
 * Formatear fecha de manera consistente entre servidor y cliente
 * Evita errores de hidratación causados por diferencias de timezone/locale
 */
export function formatDate(date: string | Date, formatStr: string = "MMM dd, yyyy"): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Validar que la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    return format(dateObj, formatStr)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid Date'
  }
}

/**
 * Formatear fecha simple (equivalente a toLocaleDateString pero consistente)
 * Evita errores de hidratación
 */
export function formatDateSimple(date: string | Date): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    // Validar que la fecha es válida
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date'
    }
    
    // Usar formato consistente en lugar de toLocaleDateString
    return format(dateObj, "MM/dd/yyyy")
  } catch (error) {
    console.error('Error formatting date simple:', error)
    return 'Invalid Date'
  }
}

/**
 * Formatear número como moneda de manera consistente
 * Evita errores de hidratación causados por diferencias de locale
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch (error) {
    console.error('Error formatting currency:', error)
    return `$${amount.toLocaleString()}`
  }
}

/**
 * Formatear número de manera consistente
 * Evita errores de hidratación causados por diferencias de locale
 */
export function formatNumber(num: number): string {
  try {
    return new Intl.NumberFormat('en-US').format(num)
  } catch (error) {
    console.error('Error formatting number:', error)
    return num.toString()
  }
}