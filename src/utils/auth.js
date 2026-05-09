// Авторизация — фронтовая демонстрация на sessionStorage
export function isLoggedIn() {
  try {
    return sessionStorage.getItem('gdekod_auth') === '1';
  } catch (e) {
    return false;
  }
}

export function setLoggedIn(v = true) {
  try {
    if (v) sessionStorage.setItem('gdekod_auth', '1');
    else sessionStorage.removeItem('gdekod_auth');
  } catch (e) {}
}

export function goToLk(navigate) {
  if (navigate) navigate('/lk');
  else window.location.href = '/lk';
}
