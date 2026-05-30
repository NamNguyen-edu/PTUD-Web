

document.addEventListener('DOMContentLoaded', () => {
  const profileTrigger = document.querySelector('.profile-info-admin');
  const profileContainer = document.querySelector('.profile-container-admin');

  if (profileTrigger && profileContainer) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileContainer.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      profileContainer.classList.remove('active');
    });
  }

  const mainNameEl = document.getElementById('profile-name');
  const dropdownNameEl = document.getElementById('profile-menu-name');
  const mainAvatarImg = document.getElementById('user-avatar-img');
  const dropdownAvatarImg = document.getElementById('user-avatar-dropdown-img');

  if (mainNameEl && dropdownNameEl) {
    const observer = new MutationObserver(() => {
      if (mainNameEl.textContent !== "Đang tải...") {
        dropdownNameEl.textContent = mainNameEl.textContent;


        if (mainAvatarImg && dropdownAvatarImg) {
          dropdownAvatarImg.src = mainAvatarImg.src;
        }
      }
    });

    observer.observe(mainNameEl, { childList: true, characterData: true, subtree: true });
  }
});