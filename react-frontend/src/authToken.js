let tokenMem = null;

try {
  tokenMem = sessionStorage.getItem('token') || null;
} catch (_) {
  tokenMem = null;
}

export function setToken(token) {
  tokenMem = token || null;
  try {
    if (token) sessionStorage.setItem('token', token);
    else sessionStorage.removeItem('token');
  } catch (_) {}
}

export function getToken() {
  if (tokenMem) return tokenMem;
  try {
    tokenMem = sessionStorage.getItem('token') || null;
  } catch (_) {
    tokenMem = null;
  }
  return tokenMem;
}

export function clearToken() {
  setToken(null);
}

export function setUser(user) {
  try {
    if (user) sessionStorage.setItem('user', JSON.stringify(user));
    else sessionStorage.removeItem('user');
  } catch (_) {}
}

export function getUser() {
  try {
    const s = sessionStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch (_) {
    return null;
  }
}

