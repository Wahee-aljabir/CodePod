import React, { useState, useEffect } from 'react';
import CodeEditor from './CodeEditor';
import LivePreview from '../Preview/LivePreview';
import { useAuth } from '../../contexts/AuthContext';
import { saveProject } from '../../services/firestoreService';

function EditorInterface({ project, onBackToProjects }) {
  const [html, setHtml] = useState(project?.html || '<!DOCTYPE html>\n<html>\n<head>\n    <title>My CodePen</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>Start coding...</p>\n</body>\n</html>');
  const [css, setCss] = useState(project?.css || 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background-color: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n}');
  const [js, setJs] = useState(project?.js || '// JavaScript code here\nconsole.log("Hello from CodePen clone!");');
  const [title, setTitle] = useState(project?.title || 'Untitled Project');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const { currentUser } = useAuth();

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('Saving...');
      
      const projectData = {
        id: project?.id,
        title,
        html,
        css,
        js
      };
      
      await saveProject(currentUser.uid, projectData);
      setSaveStatus('Saved!');
      
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('Save failed');
      console.error('Error saving project:', error);
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all code? This cannot be undone.')) {
      setHtml('<!DOCTYPE html>\n<html>\n<head>\n    <title>My CodePen</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <p>Start coding...</p>\n</body>\n</html>');
      setCss('body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background-color: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n}');
      setJs('// JavaScript code here\nconsole.log("Hello from CodePen clone!");');
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (html || css || js) {
        handleSave();
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [html, css, js, title]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToProjects}
            className="text-blue-400 hover:text-blue-300"
          >
            ← Back to Projects
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Project title"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          {saveStatus && (
            <span className={`text-sm ${
              saveStatus === 'Saved!' ? 'text-green-400' : 
              saveStatus === 'Save failed' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editors */}
        <div className="w-1/2 flex flex-col">
          {/* HTML Editor */}
          <div className="flex-1 border-b border-gray-700">
            <div className="bg-gray-800 px-4 py-2 text-sm font-medium border-b border-gray-700">
              HTML
            </div>
            <CodeEditor
              language="html"
              value={html}
              onChange={setHtml}
              height="100%"
            />
          </div>
          
          {/* CSS Editor */}
          <div className="flex-1 border-b border-gray-700">
            <div className="bg-gray-800 px-4 py-2 text-sm font-medium border-b border-gray-700">
              CSS
            </div>
            <CodeEditor
              language="css"
              value={css}
              onChange={setCss}
              height="100%"
            />
          </div>
          
          {/* JavaScript Editor */}
          <div className="flex-1">
            <div className="bg-gray-800 px-4 py-2 text-sm font-medium border-b border-gray-700">
              JavaScript
            </div>
            <CodeEditor
              language="javascript"
              value={js}
              onChange={setJs}
              height="100%"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="w-1/2 border-l border-gray-700">
          <div className="bg-gray-800 px-4 py-2 text-sm font-medium border-b border-gray-700">
            Preview
          </div>
          <div className="h-full">
            <LivePreview html={html} css={css} js={js} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorInterface;