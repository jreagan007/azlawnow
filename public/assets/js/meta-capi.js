// Meta CAPI client helper — fires server-side event alongside browser pixel
(function() {
  'use strict';

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function genEventId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  window.fireMetaEvent = function(eventName, opts) {
    opts = opts || {};
    var eventId = genEventId();

    // Fire browser pixel with dedup event_id
    if (typeof fbq === 'function') {
      fbq('track', eventName, opts.customData || {}, { eventID: eventId });
    }

    // Build user_data from cookies + optional form fields
    var userData = {
      client_user_agent: navigator.userAgent,
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp')
    };
    if (opts.email) userData.em = opts.email;
    if (opts.phone) userData.ph = opts.phone;

    // Fire server-side CAPI
    var payload = {
      event_name: eventName,
      event_id: eventId,
      event_source_url: window.location.href,
      action_source: 'website',
      user_data: userData
    };

    fetch('/.netlify/functions/meta-capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function() {});
  };
})();
