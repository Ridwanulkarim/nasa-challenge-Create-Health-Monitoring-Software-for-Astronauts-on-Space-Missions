/**
 * NASA Space Apps Challenge 2026: AstroHealth
 * Astronaut Personal Profile Script: frontend/js/profile.js
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = window.api ? window.api.getUser() : null;
  if (!user) return;

  const form = document.getElementById('edit-profile-form');
  const toast = document.getElementById('profile-success-toast');

  try {
    const res = await window.api.get('/astronauts/me');
    if (res && res.success && res.astronaut) {
      renderProfileData(res.astronaut);
    }
  } catch (err) {
    console.warn('Could not fetch astronaut profile:', err);
    // fallback to local user data
    const fbFirst = (user && user.firstName !== undefined && user.firstName !== null && user.firstName !== '') ? user.firstName : 'Astronaut';
    const fbLast = (user && user.lastName !== undefined && user.lastName !== null) ? user.lastName : '';
    renderProfileData({
      first_name: fbFirst,
      last_name: fbLast,
      role_title: user.roleTitle || 'Mission Commander',
      astronaut_id: user.astronautId || 'AST-001',
      mission_name: user.missionName || 'ARTEMIS III',
      spacecraft: 'Orion CSM'
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('btn-save-profile');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving Preferences...';

      const rawFullName = document.getElementById('edit_full_name').value.trim();
      const parts = rawFullName.split(/\s+/);
      const firstName = parts[0] || 'Astronaut';
      const lastName = parts.slice(1).join(' ') || '';
      const roleTitle = document.getElementById('edit_role_title').value.trim();
      const exerciseTarget = document.getElementById('edit_exercise_target').value;
      const notes = document.getElementById('edit_notes').value;

      try {
        const patchRes = await window.api.patch('/astronauts/me', {
          first_name: firstName,
          last_name: lastName,
          role_title: roleTitle
        });

        localStorage.setItem('astro_pref_exercise', exerciseTarget);
        localStorage.setItem('astro_pref_notes', notes);

        // Update local session
        user.firstName = firstName;
        user.lastName = lastName;
        user.roleTitle = roleTitle;
        window.api.setUser(user);

        // Instantly update sidebar profile pill if present
        const sidebarName = document.querySelector('.crew-name');
        if (sidebarName) sidebarName.textContent = [firstName, lastName].filter(Boolean).join(' ') || 'Astronaut';
        const sidebarRole = document.querySelector('.crew-role');
        if (sidebarRole) sidebarRole.textContent = roleTitle;
        const sidebarAvatar = document.querySelector('.crew-avatar');
        if (sidebarAvatar) sidebarAvatar.textContent = ((firstName[0] || 'A') + (lastName ? lastName[0] : '')).toUpperCase();

        if (patchRes && patchRes.astronaut) {
          renderProfileData(patchRes.astronaut);
        }

        if (toast) {
          toast.textContent = '✓ Profile preferences saved successfully. Telemetry HUD updated.';
          toast.style.display = 'block';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        alert('Failed to update profile: ' + err.message);
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'SAVE PROFILE PREFERENCES';
      }
    });
  }
});

function renderProfileData(a) {
  const avatar = document.getElementById('prof-avatar');
  const fullName = document.getElementById('prof-full-name');
  const roleTitle = document.getElementById('prof-role-title');
  const astronautId = document.getElementById('prof-astronaut-id');
  const missionName = document.getElementById('prof-mission-name');
  const spacecraft = document.getElementById('prof-spacecraft');
  const callsignBadge = document.getElementById('prof-callsign-badge');

  const user = window.api ? window.api.getUser() : null;
  const fName = (a && a.first_name !== undefined && a.first_name !== null && a.first_name !== '')
    ? a.first_name
    : ((user && user.firstName) || (user && user.username) || 'Astronaut');
  const lName = (a && a.last_name !== undefined && a.last_name !== null)
    ? a.last_name
    : ((user && user.lastName !== undefined && user.lastName !== null) ? user.lastName : '');
  const role = (a && a.role_title) || (user && user.roleTitle) || 'Mission Specialist';

  const cleanFullName = [fName, lName].filter(Boolean).join(' ') || 'Astronaut';
  const initialF = (fName[0] || 'A').toUpperCase();
  const initialL = lName ? lName[0].toUpperCase() : '';
  if (avatar) avatar.textContent = `${initialF}${initialL}`;
  if (fullName) fullName.textContent = cleanFullName;
  if (callsignBadge) callsignBadge.textContent = `CALLSIGN: ${(fName || 'CREW').toUpperCase()}-1`;
  if (roleTitle) roleTitle.textContent = role;
  if (astronautId) astronautId.textContent = a.astronaut_id || (user && user.astronautId) || 'AST-001';
  if (missionName) missionName.textContent = a.mission_name || 'ARTEMIS III';
  if (spacecraft) spacecraft.textContent = a.spacecraft || 'Orion CSM';

  // Pre-fill inputs
  const inFullName = document.getElementById('edit_full_name');
  const inRole = document.getElementById('edit_role_title');
  const inEx = document.getElementById('edit_exercise_target');
  const inNotes = document.getElementById('edit_notes');

  if (inFullName) inFullName.value = cleanFullName;
  if (inRole) inRole.value = role;
  if (inEx) inEx.value = localStorage.getItem('astro_pref_exercise') || '2.0';
  if (inNotes) inNotes.value = localStorage.getItem('astro_pref_notes') || '';
}
