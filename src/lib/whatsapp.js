/** Monta um link wa.me a partir de um telefone brasileiro em qualquer formato. */
export function whatsappLink(phone) {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountryCode}`
}
