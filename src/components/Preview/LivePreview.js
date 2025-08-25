import React, { useEffect, useRef } from 'react';

function LivePreview({ html, css, js }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const document = iframe.contentDocument;
    const documentContents = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>
          // Error handling for user JavaScript
          window.addEventListener('error', function(e) {
            console.error('Preview Error:', e.error);
            document.body.innerHTML += '<div style="color: red; background: #ffe6e6; padding: 10px; margin: 10px 0; border-radius: 4px;"><strong>JavaScript Error:</strong> ' + e.message + '</div>';
          });
          
          try {
            ${js}
          } catch (error) {
            console.error('JavaScript execution error:', error);
            document.body.innerHTML += '<div style="color: red; background: #ffe6e6; padding: 10px; margin: 10px 0; border-radius: 4px;"><strong>JavaScript Error:</strong> ' + error.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;

    document.open();
    document.write(documentContents);
    document.close();
  }, [html, css, js]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0 bg-white"
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

export default LivePreview;