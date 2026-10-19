export function accountHome(role) {
  return role === 'admin' ? '/admin' : role === 'seller' ? '/seller' : '/account';
}

export function loginDestination(role, requested) {
  if (typeof requested !== 'string' || !/^\/(?!\/)/.test(requested) || /[\\\u0000-\u0020]/.test(requested)) return accountHome(role);
  if (requested === '/login' || /^\/(admin|seller)\/(login|register)/.test(requested)) return accountHome(role);
  if (/^\/admin(?:\/|$)/.test(requested) && role !== 'admin') return accountHome(role);
  if (/^\/seller(?:\/|$)/.test(requested) && role !== 'seller') return accountHome(role);
  return requested;
}
