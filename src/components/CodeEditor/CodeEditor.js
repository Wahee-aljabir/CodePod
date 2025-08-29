// Make sure the CodeEditor component uses the initialCode prop properly
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const CodeEditor = ({ onCodeChange, initialCode = { html: '', css: '', js: '' } }) => {
  const [activeTab, setActiveTab] = useState('html');
  const [code, setCode] = useState(initialCode);

  // Update code when initialCode changes (important for loading projects)
  useEffect(() => {
    console.log('CodeEditor: initialCode changed:', initialCode);
    setCode(initialCode);
  }, [initialCode.html, initialCode.css, initialCode.js]);

  const handleEditorChange = (value) => {
    const newCode = { ...code, [activeTab]: value || '' };
    setCode(newCode);
    onCodeChange(newCode);
  };

  const tabs = [
    { id: 'html', label: 'HTML', language: 'html' },
    { id: 'css', label: 'CSS', language: 'css' },
    { id: 'js', label: 'JavaScript', language: 'javascript' }
  ];

  return (
    <div className="code-editor">
      <div className="editor-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* JavaScript Tip */}
      {activeTab === 'js' && (
        <div className="js-tip">
          <div className="tip-icon">💡</div>
          <div className="tip-text">
            <strong>Tip:</strong> Wrap your JavaScript code in <code>DOMContentLoaded</code> event listeners to ensure the DOM is fully loaded before execution.
          </div>
        </div>
      )}
      
      <div className="editor-container">
        <Editor
          height="100%"
          language={tabs.find(tab => tab.id === activeTab)?.language}
          value={code[activeTab]}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            selectOnLineNumbers: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
              alwaysConsumeMouseWheel: false
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditor;