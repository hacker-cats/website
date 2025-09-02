// Mobile Navigation Toggle - 90s Hacker Style
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.navbar-burger');
  const menu = document.querySelector('.navbar-menu');
  
  if (burger && menu) {
    // Toggle mobile menu
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      menu.classList.toggle('is-active');
      
      // Update ARIA attributes for accessibility
      const isExpanded = burger.classList.contains('is-active');
      burger.setAttribute('aria-expanded', isExpanded);
      
      // Focus management
      if (isExpanded) {
        // Focus first menu item when opening
        const firstMenuItem = menu.querySelector('.navbar-item');
        if (firstMenuItem) {
          firstMenuItem.focus();
        }
      }
    });
    
    // Handle keyboard navigation
    burger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        burger.click();
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!burger.contains(e.target) && !menu.contains(e.target)) {
        burger.classList.remove('is-active');
        menu.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-active')) {
        burger.classList.remove('is-active');
        menu.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus(); // Return focus to burger button
      }
    });
    
    // Close menu when navigating to a page
    const menuItems = menu.querySelectorAll('.navbar-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        burger.classList.remove('is-active');
        menu.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // Enhanced keyboard navigation for menu items
  const navItems = document.querySelectorAll('.navbar-item');
  navItems.forEach((item, index) => {
    item.addEventListener('keydown', (e) => {
      let nextIndex;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (index + 1) % navItems.length;
          navItems[nextIndex].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (index - 1 + navItems.length) % navItems.length;
          navItems[nextIndex].focus();
          break;
        case 'Home':
          e.preventDefault();
          navItems[0].focus();
          break;
        case 'End':
          e.preventDefault();
          navItems[navItems.length - 1].focus();
          break;
      }
    });
  });
});

// Add some retro console messages for fun
console.log('%c> HACKERCATS.EXE LOADED SUCCESSFULLY', 'color: #00ff00; font-family: monospace; font-size: 14px;');
console.log('%c> MOBILE NAVIGATION MODULE INITIALIZED', 'color: #00ffff; font-family: monospace; font-size: 12px;');
console.log('%c> WELCOME TO THE MATRIX, HACKER', 'color: #ff00ff; font-family: monospace; font-size: 12px;');