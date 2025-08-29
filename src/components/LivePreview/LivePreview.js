import React, { useEffect, useRef } from 'react';
import './LivePreview.css';

const LivePreview = ({ code }) => {
  const iframeRef = useRef(null);

  const updatePreview = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const document = iframe.contentDocument || iframe.contentWindow.document;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live Preview</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          }
          ${code.css || ''}
        </style>
      </head>
      <body>
        ${code.html || ''}
        <script>
          try {
            ${code.js || ''}
          } catch (error) {
            console.error('JavaScript Error:', error);
            document.body.innerHTML += '<div style="color: red; background: #ffe6e6; padding: 10px; margin: 10px 0; border-radius: 4px;">JavaScript Error: ' + error.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;

    document.open();
    document.write(htmlContent);
    document.close();
  };

  useEffect(() => {
    updatePreview();
  }, [code]);

  const handleRefresh = () => {
    // Only refresh the iframe content, not the entire page
    updatePreview();
  };

  return (
    <div className="live-preview">
      <div className="preview-header">
        <h3>Live Preview</h3>
        <button 
          className="refresh-btn"
          onClick={handleRefresh}
          title="Refresh Preview"
        >
          ↻
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className="preview-iframe"
        title="Live Preview"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default LivePreview;