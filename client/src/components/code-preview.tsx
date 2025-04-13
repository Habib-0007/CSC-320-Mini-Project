import { useEffect, useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Loader2, RefreshCw, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "../lib/utils";
import Prism from "prismjs";

// Import Prism languages
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-php";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-swift";
import "prismjs/components/prism-kotlin";
import "prismjs/components/prism-dart";
import "prismjs/themes/prism-tomorrow.css";

interface CodePreviewProps {
  code: string;
  language?: string;
  showPreview?: boolean;
  title?: string;
}

export function CodePreview({
  code,
  language = "javascript",
  showPreview = true,
  title,
}: CodePreviewProps) {
  const [activeTab, setActiveTab] = useState<"code" | "preview">("code");
  const [iframeHeight, setIframeHeight] = useState(300);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Map language to Prism language
  const getPrismLanguage = (lang: string) => {
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      rb: "ruby",
      cs: "csharp",
      php: "php",
      go: "go",
      rs: "rust",
      java: "java",
      kt: "kotlin",
      swift: "swift",
      dart: "dart",
      sh: "bash",
      bash: "bash",
      json: "json",
      md: "markdown",
      yaml: "yaml",
      yml: "yaml",
      sql: "sql",
      html: "markup",
      xml: "markup",
      css: "css",
      scss: "scss",
      sass: "sass",
    };

    return languageMap[lang.toLowerCase()] || lang;
  };

  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  // Determine if preview is available
  const isPreviewAvailable = showPreview && isPreviewableLanguage(language);

  // Function to check if language is previewable
  function isPreviewableLanguage(lang: string): boolean {
    const previewableLanguages = [
      "html",
      "css",
      "javascript",
      "js",
      "jsx",
      "tsx",
      "typescript",
      "ts",
    ];
    return previewableLanguages.includes(lang.toLowerCase());
  }

  // Function to prepare code for preview
  const preparePreviewCode = () => {
    // Normalize language for processing
    const normalizedLanguage = language.toLowerCase();

    // For HTML, check if it has basic structure, if not add it
    if (normalizedLanguage === "html") {
      // If the code doesn't include <!DOCTYPE html> or <html>, wrap it
      if (!code.includes("<!DOCTYPE html>") && !code.includes("<html")) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Preview</title>
</head>
<body>
${code}
</body>
</html>`;
      }
      return code;
    }

    // For CSS, create a minimal HTML document that includes the CSS
    if (normalizedLanguage === "css") {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Preview</title>
  <style>
${code}
  </style>
</head>
<body>
  <!-- Basic elements to show CSS effects -->
  <div class="container">
    <h1>CSS Preview</h1>
    <p>This is a paragraph to demonstrate text styling.</p>
    <button>Button Element</button>
    <div class="box">Div Element</div>
    <ul>
      <li>List Item 1</li>
      <li>List Item 2</li>
      <li>List Item 3</li>
    </ul>
  </div>
</body>
</html>`;
    }

    // For JavaScript, create an HTML document that runs the JS
    if (normalizedLanguage === "javascript" || normalizedLanguage === "js") {
      // Check if the code appears to be a complete HTML document
      if (code.includes("<!DOCTYPE html>") || code.includes("<html")) {
        return code;
      }

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JavaScript Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; }
    #output { border: 1px solid #ddd; padding: 20px; margin-top: 20px; min-height: 100px; }
  </style>
</head>
<body>
  <h1>JavaScript Output</h1>
  <div id="output"></div>
  <script>
    // Redirect console.log to the output div
    const output = document.getElementById('output');
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      const text = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      const p = document.createElement('p');
      p.textContent = text;
      output.appendChild(p);
    };
    
    // Execute the code
    try {
${code}
    } catch (error) {
      console.log('Error:', error.message);
    }
  </script>
</body>
</html>`;
    }

    // For JSX/TSX, create a React environment
    if (
      normalizedLanguage === "jsx" ||
      normalizedLanguage === "tsx" ||
      normalizedLanguage === "react"
    ) {
      // Check if the code appears to be a complete HTML document
      if (code.includes("<!DOCTYPE html>") || code.includes("<html")) {
        return code;
      }

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Preview</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; }
    #root { padding: 20px; }
    .error { color: red; padding: 10px; border: 1px solid red; margin-top: 10px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
${code}

      // Try to detect and render the component if it's not already rendered
      setTimeout(() => {
        if (!document.getElementById('root').hasChildNodes()) {
          // Look for component declarations (function or class components)
          const componentRegex = /(?:function|class)\\s+([A-Z][A-Za-z0-9_]*)\\s*(?:\\(|extends)/g;
          const matches = [...code.matchAll(componentRegex)];
          
          if (matches.length > 0) {
            const componentName = matches[0][1];
            try {
              // Try to render the component
              ReactDOM.render(React.createElement(eval(componentName)), document.getElementById('root'));
            } catch (err) {
              console.error("Failed to render component:", err);
            }
          }
        }
      }, 100);
    } catch (error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = 'Error: ' + error.message;
      document.getElementById('root').appendChild(errorDiv);
    }
  </script>
</body>
</html>`;
    }

    // For TypeScript, transpile to JavaScript first (simplified approach)
    if (normalizedLanguage === "typescript" || normalizedLanguage === "ts") {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TypeScript Preview</title>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://unpkg.com/@babel/preset-typescript@7.x/lib/index.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; }
    #output { border: 1px solid #ddd; padding: 20px; margin-top: 20px; min-height: 100px; }
    .error { color: red; padding: 10px; border: 1px solid red; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>TypeScript Output</h1>
  <div id="output"></div>
  <script>
    // Redirect console.log to the output div
    const output = document.getElementById('output');
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      const text = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      const p = document.createElement('p');
      p.textContent = text;
      output.appendChild(p);
    };
  </script>
  <script type="text/typescript">
${code}
  </script>
  <script>
    try {
      // Transpile TypeScript to JavaScript
      const tsCode = document.querySelector('script[type="text/typescript"]').textContent;
      const jsCode = Babel.transform(tsCode, {
        filename: 'script.ts',
        presets: ['typescript']
      }).code;
      
      // Execute the transpiled code
      const scriptElement = document.createElement('script');
      scriptElement.textContent = jsCode;
      document.body.appendChild(scriptElement);
    } catch (error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = 'Error: ' + error.message;
      document.getElementById('output').appendChild(errorDiv);
    }
  </script>
</body>
</html>`;
    }

    // For other languages, show a message
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; text-align: center; }
  </style>
</head>
<body>
  <h1>Preview not available</h1>
  <p>Preview is not available for ${language} code.</p>
</body>
</html>`;
  };

  const refreshPreview = () => {
    if (iframeRef.current && activeTab === "preview") {
      setIsLoading(true);

      // Update the iframe content
      const iframe = iframeRef.current;
      const previewCode = preparePreviewCode();

      // Clear the iframe and reload it
      iframe.srcdoc = previewCode;

      // Hide loading when iframe loads
      iframe.onload = () => {
        setIsLoading(false);
      };
    }
  };

  // Refresh preview when tab changes to preview
  useEffect(() => {
    if (activeTab === "preview") {
      refreshPreview();
    }
  }, [activeTab, code, language]);

  // Toggle fullscreen preview
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Adjust height when toggling fullscreen
    setIframeHeight(isFullscreen ? 300 : 500);
  };

  return (
    <div
      className={cn(
        "rounded-md border overflow-hidden transition-all duration-300",
        isFullscreen && "fixed inset-4 z-50 bg-background shadow-xl"
      )}
    >
      {isPreviewAvailable ? (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "code" | "preview")}
          className="h-full flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              {title && <span className="text-sm font-medium">{title}</span>}
              <TabsList>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </div>
            {activeTab === "preview" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshPreview}
                  title="Refresh preview"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  title={
                    isFullscreen ? "Exit fullscreen" : "Fullscreen preview"
                  }
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
          <TabsContent value="code" className="p-0 flex-1 overflow-auto m-0">
            <pre
              className={cn(
                "p-4 overflow-auto h-full",
                `language-${getPrismLanguage(language)}`
              )}
            >
              <code>{code}</code>
            </pre>
          </TabsContent>
          <TabsContent value="preview" className="p-0 flex-1 relative m-0">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              style={{
                height: isFullscreen
                  ? "calc(100vh - 8rem)"
                  : `${iframeHeight}px`,
              }}
              title="Code Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </TabsContent>
        </Tabs>
      ) : (
        <div>
          {title && (
            <div className="px-4 py-2 border-b">
              <span className="text-sm font-medium">{title}</span>
            </div>
          )}
          <pre
            className={cn(
              "p-4 overflow-auto",
              `language-${getPrismLanguage(language)}`
            )}
          >
            <code>{code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
