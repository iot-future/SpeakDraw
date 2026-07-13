export function embedHtml(sessionId: string): string {
  const xmlUrl = `/api/session/${sessionId}/xml`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI Diagram Preview - ${sessionId}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 100vw; height: 100vh; overflow: hidden; }
  iframe { width: 100%; height: 100%; border: none; }
</style>
</head>
<body>
<iframe id="drawio-frame"></iframe>
<script>
  const iframe = document.getElementById('drawio-frame');
  const params = new URLSearchParams({
    embed: '1',
    ui: 'atlas',
    spin: '1',
    modified: 'unsaved',
    proto: 'json',
    configure: '1',
  });
  iframe.src = 'https://embed.diagrams.net/?' + params.toString();

  window.addEventListener('message', async (event) => {
    if (event.data === 'ready') {
      try {
        const res = await fetch('${xmlUrl}');
        if (!res.ok) return;
        const xml = await res.text();
        iframe.contentWindow?.postMessage(
          JSON.stringify({ action: 'load', autosave: 0, xml }),
          '*'
        );
      } catch (e) {
        console.error('[ai-diagram preview] failed to load XML:', e);
      }
    }
  });
</script>
</body>
</html>`;
}
