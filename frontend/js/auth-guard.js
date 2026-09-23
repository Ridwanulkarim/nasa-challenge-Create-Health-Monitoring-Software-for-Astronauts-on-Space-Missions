(function initAuthGuard() {
  const token = localStorage.getItem('astro_token');
  const userStr = localStorage.getItem('astro_user');
  let user = null;

  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    user = null;
  }

  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('index.html') || currentPath.endsWith('/') || currentPath === '';

  if (!token || !user) {
    if (!isLoginPage) {
      window.location.href = 'index.html';
      return;
    }
    return;
  }

  try {
    const payloadBase64 = token.split('.')[1];
    const decoded = JSON.parse(atob(payloadBase64));
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      localStorage.removeItem('astro_token');
      localStorage.removeItem('astro_user');
      if (!isLoginPage) {
        window.location.href = 'index.html';
      }
      return;
    }
  } catch (e) {
    localStorage.removeItem('astro_token');
    localStorage.removeItem('astro_user');
    if (!isLoginPage) {
      window.location.href = 'index.html';
    }
    return;
  }

  if (isLoginPage) {
    if (user.role === 'MISSION_CONTROL') {
      window.location.href = 'mission-control.html';
    } else {
      window.location.href = 'dashboard.html';
    }
    return;
  }

  if (currentPath.includes('mission-control.html') && user.role !== 'MISSION_CONTROL') {
    alert('Access Restricted: Mission Control authorization required.');
    window.location.href = 'dashboard.html';
    return;
  }

  if (currentPath.includes('health-check.html') && user.role === 'MISSION_CONTROL') {
    alert('Mission Control personnel cannot submit astronaut health check-ins.');
    window.location.href = 'mission-control.html';
    return;
  }
})();
