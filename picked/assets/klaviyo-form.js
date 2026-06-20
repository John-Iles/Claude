(function () {
  'use strict';

  var form = document.getElementById('waitlist-form');
  if (!form) return;

  var emailInput = document.getElementById('waitlist-email');
  var statusDiv  = document.getElementById('waitlist-status');
  var submitBtn  = form.querySelector('[type="submit"]');

  function showStatus(message, isError) {
    statusDiv.textContent = message;
    statusDiv.classList.toggle('is-error', !!isError);
    statusDiv.removeAttribute('hidden');
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    if (isLoading) {
      submitBtn.dataset.label = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
    } else if (submitBtn.dataset.label) {
      submitBtn.textContent = submitBtn.dataset.label;
    }
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = (emailInput.value || '').trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('Please enter a valid email address.', true);
      emailInput.focus();
      return;
    }

    var companyId    = form.dataset.companyId || '';
    var listId       = form.dataset.listId    || '';
    var referralCode = (document.getElementById('waitlist-referral') || {}).value || '';
    var source       = (document.getElementById('waitlist-source')   || {}).value || 'phase0-landing';

    if (!companyId || !listId) {
      showStatus('Sign-up is temporarily unavailable. Please try again later.', true);
      return;
    }

    var profileProps = { source: source };
    if (referralCode) profileProps.referred_by = referralCode;

    var payload = {
      data: {
        type: 'subscription',
        attributes: {
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: email,
                properties: profileProps
              }
            }
          },
          list_id: listId
        }
      }
    };

    setLoading(true);
    statusDiv.setAttribute('hidden', '');

    fetch(
      'https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(companyId),
      {
        method: 'POST',
        headers: {
          'content-type': 'application/vnd.api+json',
          'revision': '2023-10-15'
        },
        body: JSON.stringify(payload)
      }
    )
    .then(function (res) {
      setLoading(false);
      // Klaviyo returns 202 for both new and existing subscribers — GDPR-safe design.
      // Never confirm or deny whether an address is already subscribed.
      if (res.status === 202) {
        var row  = form.querySelector('.waitlist-form__row');
        var note = form.querySelector('.waitlist-form__consent-note');
        if (row)  row.setAttribute('hidden', '');
        if (note) note.setAttribute('hidden', '');
        showStatus(
          "You’re on the list! Check your inbox to confirm your spot.",
          false
        );
        document.dispatchEvent(
          new CustomEvent('waitlist:signed_up', {
            bubbles: true,
            detail: { email: email, referred_by: referralCode || null }
          })
        );
      } else {
        showStatus('Something went wrong. Please try again.', true);
      }
    })
    .catch(function () {
      setLoading(false);
      showStatus('Something went wrong. Please check your connection and try again.', true);
    });
  });
})();
