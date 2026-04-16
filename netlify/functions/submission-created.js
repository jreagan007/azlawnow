// Fires automatically on every Netlify form submission
// Sends a branded lead dispatch email via Resend to bf@azlawnow.com
// Handles: case-review, lead-capture, contact

exports.handler = async function(event) {
  const { payload } = JSON.parse(event.body);
  const data = payload.data || {};
  const formName = payload.form_name;

  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) data[key] = data[key][0];
  }

  const validForms = ['case-review', 'lead-capture', 'contact'];
  if (!validForms.includes(formName)) {
    return { statusCode: 200, body: 'Skipped' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'AZ Law Now Leads <leads@insights.azlawnow.com>';
  const BCC_EMAIL = process.env.BCC_EMAIL || '';

  if (!RESEND_API_KEY || !NOTIFICATION_EMAIL) {
    console.error('Missing RESEND_API_KEY or NOTIFICATION_EMAIL');
    return { statusCode: 500, body: 'Missing email config' };
  }

  const name = data['name'] || 'Unknown';
  const phone = data['phone'] || '';
  const email = data['email'] || '';
  const description = data['description'] || data['message'] || '';
  const city = data['geo-city'] || '';
  const state = data['geo-state-name'] || data['geo-state'] || '';
  const stateCode = data['geo-state'] || '';
  const zip = data['geo-zip'] || '';
  const country = data['geo-country'] || '';
  const timezone = data['geo-timezone'] || '';
  const device = data['device'] || '';
  const browser = data['browser'] || '';
  const screenSize = data['screen-size'] || '';
  const pagesViewed = data['pages-viewed'] || '';
  const timeOnSite = data['time-on-site'] || '';
  const landingPage = data['landing-page'] || '';
  const referrer = data['referrer'] || 'direct';
  const pageUrl = data['page-url'] || '';
  const utmSource = data['utm-source'] || '';
  const utmMedium = data['utm-medium'] || '';
  const utmCampaign = data['utm-campaign'] || '';
  const utmTerm = data['utm-term'] || '';
  const utmContent = data['utm-content'] || '';

  const formLabels = {
    'case-review': 'Free Case Review',
    'lead-capture': 'Conversion Modal',
    'contact': 'Contact Page',
  };
  const formLabel = formLabels[formName] || formName;

  const subjectParts = ['AZ Law Now Lead', name.trim()];
  if (state) subjectParts.push(stateCode || state);
  if (utmSource) subjectParts.push(utmSource);
  const subject = subjectParts.join(' — ');

  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/Phoenix',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const descriptionHtml = description
    ? `<div style="padding: 16px 0; border-top: 1px solid #F3F4F6;">
        <h2 style="font-size: 11px; color: #D4943A; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">What Happened</h2>
        <p style="color: #111827; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>`
    : '';

  const body = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #FFFFFF;">

  <div style="background: #1A1A1A; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="vertical-align: middle;">
          <span style="font-family: Georgia, serif; color: #D4943A; font-size: 17px; font-weight: 700; letter-spacing: 0.02em;">AZ LAW NOW</span>
          <span style="color: #6B7280; font-size: 13px; padding-left: 8px;">Lead Dispatch</span>
        </td>
        <td style="vertical-align: middle; text-align: right;">
          <span style="color: #A8A29E; font-size: 12px;">${timestamp} AZ</span>
        </td>
      </tr>
    </table>
  </div>
  <div style="height: 3px; background: #C23B22;"></div>

  <div style="padding: 24px; border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB;">
    <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 4px 0;">${name}</h1>
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
      <tr>
        <td style="padding: 4px 0;">
          <a href="tel:${phone.replace(/\D/g, '')}" style="color: #D4943A; font-size: 16px; font-weight: 700; text-decoration: none;">${phone}</a>
        </td>
        <td style="padding: 4px 0; text-align: right;">
          <span style="display: inline-block; background: #FFF8F0; border: 1px solid #E8C9A8; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 600; color: #8B4513; text-transform: uppercase; letter-spacing: 0.03em;">${formLabel}</span>
        </td>
      </tr>
      ${email ? `<tr><td colspan="2" style="padding: 4px 0;"><a href="mailto:${email}" style="color: #4B5563; font-size: 14px; text-decoration: none;">${email}</a></td></tr>` : ''}
    </table>
  </div>

  <div style="padding: 0 24px 8px; border-left: 1px solid #E5E7EB; border-right: 1px solid #E5E7EB;">

    ${descriptionHtml}

    <div style="padding: 16px 0; border-top: 1px solid #F3F4F6;">
      <h2 style="font-size: 11px; color: #D4943A; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Location</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px; width: 120px;">City / State</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${city}${city && state ? ', ' : ''}${state}</td></tr>
        ${zip ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Zip</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${zip}</td></tr>` : ''}
        ${country ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Country</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${country}</td></tr>` : ''}
        ${timezone ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Timezone</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${timezone}</td></tr>` : ''}
      </table>
    </div>

    <div style="padding: 16px 0; border-top: 1px solid #F3F4F6;">
      <h2 style="font-size: 11px; color: #D4943A; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Attribution</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px; width: 120px;">Referrer</td><td style="padding: 4px 0; color: #111827; font-size: 13px; word-break: break-all;">${referrer}</td></tr>
        ${landingPage ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Landing Page</td><td style="padding: 4px 0; color: #111827; font-size: 13px; word-break: break-all;">${landingPage}</td></tr>` : ''}
        ${pageUrl ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Page URL</td><td style="padding: 4px 0; color: #111827; font-size: 13px; word-break: break-all;">${pageUrl}</td></tr>` : ''}
      </table>
    </div>

    ${utmSource || utmCampaign ? `
    <div style="padding: 16px 0; border-top: 1px solid #F3F4F6;">
      <h2 style="font-size: 11px; color: #D4943A; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Campaign</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${utmSource ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px; width: 120px;">Source</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${utmSource}</td></tr>` : ''}
        ${utmMedium ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Medium</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${utmMedium}</td></tr>` : ''}
        ${utmCampaign ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Campaign</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${utmCampaign}</td></tr>` : ''}
        ${utmTerm ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Term</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${utmTerm}</td></tr>` : ''}
        ${utmContent ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Content</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${utmContent}</td></tr>` : ''}
      </table>
    </div>
    ` : ''}

    <div style="padding: 16px 0; border-top: 1px solid #F3F4F6;">
      <h2 style="font-size: 11px; color: #D4943A; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700;">Session</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${device ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px; width: 120px;">Device</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${device}</td></tr>` : ''}
        ${browser ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Browser</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${browser}</td></tr>` : ''}
        ${screenSize ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Screen</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${screenSize}</td></tr>` : ''}
        ${pagesViewed ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Pages Viewed</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${pagesViewed}</td></tr>` : ''}
        ${timeOnSite ? `<tr><td style="padding: 4px 0; color: #6B7280; font-size: 13px;">Time on Site</td><td style="padding: 4px 0; color: #111827; font-size: 13px;">${timeOnSite}</td></tr>` : ''}
      </table>
    </div>

  </div>

  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px; padding: 14px 24px; text-align: center;">
    <p style="color: #9CA3AF; font-size: 11px; margin: 0; letter-spacing: 0.03em;">AZ Law Now Injury Attorneys &bull; (602) 654-0202 &bull; azlawnow.com</p>
  </div>

</div>
  `.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        reply_to: process.env.REPLY_TO_EMAIL || 'bf@azlawnow.com',
        to: NOTIFICATION_EMAIL.split(',').map(e => e.trim()).filter(Boolean),
        bcc: BCC_EMAIL.split(',').map(e => e.trim()).filter(Boolean),
        subject,
        html: body,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error('Resend error:', result);
      return { statusCode: res.status, body: JSON.stringify(result) };
    }
    console.log('Lead email sent:', subject);
    return { statusCode: 200, body: 'Email sent' };
  } catch (err) {
    console.error('Email send failed:', err);
    return { statusCode: 500, body: err.message };
  }
};
