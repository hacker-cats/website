// QR Code Display Handler
// Shows QR code in left margin when ?qr=1 is in URL

(function() {
  'use strict';

  // Check if ?qr=1 is in the URL
  const urlParams = new URLSearchParams(window.location.search);
  const showQR = urlParams.get('qr') === '1';

  if (showQR) {
    // Find the floating QR element
    const qrElement = document.querySelector('.floating-qr');

    if (qrElement) {
      // Make it visible
      qrElement.classList.add('visible');
    }
  }
})();
