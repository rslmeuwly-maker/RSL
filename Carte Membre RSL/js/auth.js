
window.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  const btnAccount = document.getElementById('btnAccount');
  const isLogged = !!localStorage.getItem('rsl_demo_user');
  if(btnLogin) btnLogin.style.display = isLogged ? 'none' : 'inline-flex';
  if(btnAccount) btnAccount.style.display = isLogged ? 'inline-flex' : 'none';
  btnLogin?.addEventListener('click', () => { localStorage.setItem('rsl_demo_user','ok'); location.reload(); });
});
