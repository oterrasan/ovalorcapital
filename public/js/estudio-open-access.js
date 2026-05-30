(function () {
  function openStudio() {
    var login = document.getElementById('login');
    var app = document.getElementById('app');
    var logout = document.getElementById('logout');

    if (login) login.hidden = true;
    if (app) app.hidden = false;
    if (logout) logout.style.display = 'none';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', openStudio);
  } else {
    openStudio();
  }

  setTimeout(openStudio, 0);
  setTimeout(openStudio, 300);
})();
