// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDaaBOEREwNkqH94fbwvLqSN9r3jWJEFJU",
  authDomain: "codepod-3031b.firebaseapp.com",
  projectId: "codepod-3031b",
  storageBucket: "codepod-3031b.firebasestorage.app",
  messagingSenderId: "349253382329",
  appId: "1:349253382329:web:164bff93ae1f2cf8bfab68",
  measurementId: "G-18LNXVR39P"
};

// Initialize Firebase (only if config is properly set)
let db = null;
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "your-api-key") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('Firebase initialized successfully');
    } else {
        console.log('Firebase not configured - save functionality will use localStorage');
    }
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

// CodeMirror editors
let htmlEditor, cssEditor, jsEditor;

// Initialize CodeMirror editors
function initializeEditors() {
    try {
        // HTML Editor
        htmlEditor = CodeMirror.fromTextArea(document.getElementById('htmlEditor'), {
            mode: 'htmlmixed',
            theme: 'default',
            lineNumbers: true,
            autoCloseTags: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true
        });

        // CSS Editor
        cssEditor = CodeMirror.fromTextArea(document.getElementById('cssEditor'), {
            mode: 'css',
            theme: 'default',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true
        });

        // JavaScript Editor
        jsEditor = CodeMirror.fromTextArea(document.getElementById('jsEditor'), {
            mode: 'javascript',
            theme: 'default',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true
        });

        // Add change listeners for real-time preview
        htmlEditor.on('change', debounce(updatePreview, 300));
        cssEditor.on('change', debounce(updatePreview, 300));
        jsEditor.on('change', debounce(updatePreview, 300));

        console.log('CodeMirror editors initialized successfully');
    } catch (error) {
        console.error('CodeMirror initialization failed:', error);
        // Fallback to regular textareas
        setupFallbackEditors();
    }
}

// Fallback editor setup (if CodeMirror fails)
function setupFallbackEditors() {
    const htmlTextarea = document.getElementById('htmlEditor');
    const cssTextarea = document.getElementById('cssEditor');
    const jsTextarea = document.getElementById('jsEditor');

    // Add event listeners for real-time preview
    htmlTextarea.addEventListener('input', debounce(updatePreview, 300));
    cssTextarea.addEventListener('input', debounce(updatePreview, 300));
    jsTextarea.addEventListener('input', debounce(updatePreview, 300));

    console.log('Fallback editors initialized');
}

// Get editor content (works with both CodeMirror and textarea)
function getEditorContent(editor, fallbackId) {
    if (editor && editor.getValue) {
        return editor.getValue();
    }
    return document.getElementById(fallbackId).value;
}

// Set editor content (works with both CodeMirror and textarea)
function setEditorContent(editor, fallbackId, content) {
    if (editor && editor.setValue) {
        editor.setValue(content);
    } else {
        document.getElementById(fallbackId).value = content;
    }
}

// Update preview iframe with current code
function updatePreview() {
    const htmlContent = getEditorContent(htmlEditor, 'htmlEditor');
    const cssContent = getEditorContent(cssEditor, 'cssEditor');
    const jsContent = getEditorContent(jsEditor, 'jsEditor');

    // Create complete HTML document
    const previewContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
            <style>
                ${cssContent}
            </style>
        </head>
        <body>
            ${htmlContent}
            <script>
                try {
                    ${jsContent}
                } catch (error) {
                    console.error('JavaScript Error:', error);
                    document.body.innerHTML += '<div style="color: red; padding: 10px; background: #ffe6e6; border: 1px solid #ff0000; margin: 10px;">JavaScript Error: ' + error.message + '</div>';
                }
            </script>
        </body>
        </html>
    `;

    // Update iframe content
    const preview = document.getElementById('preview');
    const previewDoc = preview.contentDocument || preview.contentWindow.document;
    previewDoc.open();
    previewDoc.write(previewContent);
    previewDoc.close();
}

// Debounce function to limit update frequency
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Save code to Firestore or localStorage
async function saveCode() {
    const saveBtn = document.getElementById('saveBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successMessage = document.getElementById('successMessage');

    // Disable save button and show loading
    saveBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');

    try {
        const codeData = {
            html: getEditorContent(htmlEditor, 'htmlEditor'),
            css: getEditorContent(cssEditor, 'cssEditor'),
            javascript: getEditorContent(jsEditor, 'jsEditor'),
            timestamp: new Date(),
            id: generateId()
        };

        if (db) {
            // Save to Firestore
            await db.collection('codepens').add(codeData);
            console.log('Code saved to Firestore successfully');
        } else {
            // Fallback to localStorage
            const savedCodes = JSON.parse(localStorage.getItem('codepod-saves') || '[]');
            savedCodes.push(codeData);
            // Keep only last 10 saves to prevent storage overflow
            if (savedCodes.length > 10) {
                savedCodes.shift();
            }
            localStorage.setItem('codepod-saves', JSON.stringify(savedCodes));
            console.log('Code saved to localStorage successfully');
        }

        // Show success message
        successMessage.classList.remove('hidden');
        setTimeout(() => {
            successMessage.classList.add('hidden');
        }, 3000);

    } catch (error) {
        console.error('Error saving code:', error);
        alert('Failed to save code. Please try again.');
    } finally {
        // Re-enable save button and hide loading
        saveBtn.disabled = false;
        loadingIndicator.classList.add('hidden');
    }
}

// Generate unique ID for saved code
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Load sample code on first visit
function loadSampleCode() {
    const sampleHTML = `<div class="container">
    <h1>Welcome to CodePod!</h1>
    <p>Start coding and see your changes live!</p>
    <button id="clickMe">Click me!</button>
</div>`;

    const sampleCSS = `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 2rem;
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

h1 {
    margin-bottom: 1rem;
    font-size: 2.5rem;
}

p {
    margin-bottom: 2rem;
    font-size: 1.2rem;
}

button {
    background: #ff6b6b;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 5px;
    font-size: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
}

button:hover {
    transform: scale(1.05);
}`;

    const sampleJS = `document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('clickMe');
    let clickCount = 0;
    
    button.addEventListener('click', function() {
        clickCount++;
        button.textContent = \`Clicked \${clickCount} time\${clickCount !== 1 ? 's' : ''}!\`;
        
        // Add some fun animation
        button.style.background = \`hsl(\${Math.random() * 360}, 70%, 60%)\`;
    });
});`;

    // Set sample code
    setEditorContent(htmlEditor, 'htmlEditor', sampleHTML);
    setEditorContent(cssEditor, 'cssEditor', sampleCSS);
    setEditorContent(jsEditor, 'jsEditor', sampleJS);

    // Update preview
    updatePreview();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize editors
    initializeEditors();
    
    // Load sample code
    loadSampleCode();
    
    // Save button event listener
    document.getElementById('saveBtn').addEventListener('click', saveCode);
    
    // Refresh button event listener
    document.getElementById('refreshBtn').addEventListener('click', updatePreview);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S or Cmd+S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveCode();
        }
        
        // Ctrl+R or Cmd+R to refresh preview
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            updatePreview();
        }
    });
    
    console.log('CodePod initialized successfully!');
});

// Handle window resize for responsive layout
window.addEventListener('resize', debounce(function() {
    if (htmlEditor) htmlEditor.refresh();
    if (cssEditor) cssEditor.refresh();
    if (jsEditor) jsEditor.refresh();
}, 100));

// Error handling for iframe
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});