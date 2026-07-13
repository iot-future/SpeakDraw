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
  (function() {
    var iframe = document.getElementById('drawio-frame');
    iframe.src = 'https://embed.diagrams.net/?embed=1&proto=json&spin=1';

    function loadDiagram() {
      fetch('${xmlUrl}')
        .then(function(res) { return res.text(); })
        .then(function(xml) {
          iframe.contentWindow.postMessage(
            { action: 'load', autosave: 0, xml: xml },
            'https://embed.diagrams.net'
          );
        })
        .catch(function(e) {
          console.error('[ai-diagram preview] failed to load XML:', e);
        });
    }

    window.addEventListener('message', function(event) {
      if (event.source !== iframe.contentWindow) return;
      var data = event.data;
      // proto=json sends JSON objects, not strings
      if (data && typeof data === 'object' && data.event === 'init') {
        loadDiagram();
      }
    });
  })();
</script>
</body>
</html>`;
}
