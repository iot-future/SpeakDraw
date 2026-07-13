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
  #drawio-frame { width: 100%; height: 100%; border: none; }
  #loader {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: #f5f5f5; font-family: sans-serif; font-size: 14px; color: #888;
    z-index: 10; transition: opacity 0.3s;
  }
  #loader.hidden { opacity: 0; pointer-events: none; }
</style>
</head>
<body>
<div id="loader">Loading draw.io viewer...</div>
<iframe id="drawio-frame"></iframe>
<script>
(function() {
  var frame = document.getElementById('drawio-frame');
  var loader = document.getElementById('loader');
  // proto=json: draw.io uses JSON message format
  frame.src = 'https://embed.diagrams.net/?embed=1&proto=json&spin=1';

  window.addEventListener('message', function(ev) {
    if (ev.source !== frame.contentWindow) return;
    var data = ev.data;
    var isInit = false;
    if (data === 'ready') {
      isInit = true;
    } else if (typeof data === 'string') {
      try {
        var parsed = JSON.parse(data);
        if (parsed && parsed.event === 'init') isInit = true;
      } catch (e) {}
    } else if (data && typeof data === 'object' && data.event === 'init') {
      isInit = true;
    }
    if (!isInit) return;

    loader.classList.add('hidden');
    fetch('${xmlUrl}')
      .then(function(r) { return r.text(); })
      .then(function(xml) {
        // draw.io embed always uses JSON STRING messages
        frame.contentWindow.postMessage(
          JSON.stringify({ action: 'load', xml: xml, autosave: 0 }),
          'https://embed.diagrams.net'
        );
      })
      .catch(function(e) {
        loader.textContent = 'Error: ' + e.message;
      });
  });
})();
</script>
</body>
</html>`;
}
