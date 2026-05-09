// Маска телефона +7 (XXX) XXX-XX-XX
export function formatPhone(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.startsWith('8')) v = '7' + v.slice(1);
  if (!v.startsWith('7')) v = '7' + v;
  v = v.slice(0, 11);
  let r = '+7';
  if (v.length > 1) r += ' (' + v.slice(1, 4);
  if (v.length >= 4) r += ') ' + v.slice(4, 7);
  if (v.length >= 7) r += '-' + v.slice(7, 9);
  if (v.length >= 9) r += '-' + v.slice(9, 11);
  input.value = r;
}

export function initPhoneInput(inp) {
  if (!inp || inp._pi) return;
  inp._pi = true;
  inp.addEventListener('input', () => formatPhone(inp));
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && (inp.value === '+7' || inp.value === '+7 ')) {
      e.preventDefault();
    }
  });
  inp.addEventListener('focus', () => {
    if (!inp.value) inp.value = '+7 ';
  });
}

export function initAllPhoneInputs(root = document) {
  root.querySelectorAll('input[type="tel"]').forEach(initPhoneInput);
}
