import React from 'react';
import Editor from '@monaco-editor/react';

function CodeEditor({ language, value, onChange, height = '300px' }) {
  const handleEditorChange = (value) => {
    onChange(value || '');
  };

  return (
    <div className="h-full">
      <Editor
        height={height}
        language={language}
        value={value}
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
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          automaticLayout: true,
        }}
      />
    </div>
  );
}

export default CodeEditor;