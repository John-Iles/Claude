(function () {
  'use strict';

  var ref = null;

  try {
    // Capture ?ref= param if present (also done inline in <head>, this is belt-and-braces)
    var urlRef = new URLSearchParams(location.search).get('ref');
    if (urlRef) {
      sessionStorage.setItem('picked_ref', urlRef);
      ref = urlRef;
    } else {
      ref = sessionStorage.getItem('picked_ref');
    }
  } catch (e) {}

  if (!ref) return;

  function populate() {
    var field = document.getElementById('waitlist-referral');
    if (field && !field.value) field.value = ref;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populate);
  } else {
    populate();
  }
})();
