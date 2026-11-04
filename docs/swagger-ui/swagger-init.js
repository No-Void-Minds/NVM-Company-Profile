// A separate file because the docs CSP allows scripts from 'self' only, no inline script.
window.ui = SwaggerUIBundle({
  url: '/api/docs/openapi.yaml',
  dom_id: '#swagger-ui',
  deepLinking: true,
  // The admin session cookie is HttpOnly, so "Try it out" relies on the browser sending it
  withCredentials: true,
  presets: [SwaggerUIBundle.presets.apis],
  layout: 'BaseLayout',
})
