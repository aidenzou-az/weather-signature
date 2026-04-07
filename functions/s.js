import { getWeatherPageData } from './page-data.js';
import { renderErrorPage, renderShellPage } from './render.js';

export async function onRequestGet({ request, env }) {
  try {
    const data = await getWeatherPageData(env);
    const url = new URL(request.url);
    const contentUrl = `${url.origin}/content`;
    const html = renderShellPage(data, {
      canonicalUrl: url.toString(),
      contentUrl,
      ogImageUrl: `${url.origin}/og-image`
    });

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  } catch (error) {
    return new Response(renderErrorPage(error), {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  }
}
