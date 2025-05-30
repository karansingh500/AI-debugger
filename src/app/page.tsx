"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Bot, Wand2, Loader2 } from 'lucide-react';
import { explainError, ExplainErrorInput } from '@/ai/flows/explain-error';
import { suggestCodeFix, SuggestCodeFixInput } from '@/ai/flows/suggest-code-fix';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from "@/hooks/use-toast";

interface LanguageOption {
  value: string;
  label: string;
}

const languages: LanguageOption[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'typescript', label: 'TypeScript' },
];

// Predefined buggy code example for JavaScript
const defaultBuggyJSCode = `function calculateSum(arr) {
  let sum = 0;
  // Error: Off-by-one, should be i < arr.length
  // This will try to access arr[arr.length] which is undefined
  for (let i = 0; i <= arr.length; i++) { 
    sum += arr[i]; 
  }
  return sum;
}

const numbers = [1, 2, 3, 4, 5];
console.log('Calculating sum for:', numbers);
const result = calculateSum(numbers);
console.log('Result:', result); // This line might not be reached if error is thrown
`;

export default function AetherDebugPage() {
  const [code, setCode] = useState<string>(defaultBuggyJSCode);
  const [language, setLanguage] = useState<string>('javascript');
  const [output, setOutput] = useState<string>('');
  const [errorExplanation, setErrorExplanation] = useState<string>('');
  const [suggestedFix, setSuggestedFix] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput('');
    setErrorExplanation('');
    setSuggestedFix('');

    let currentCode = code;
    let currentLanguage = language;
    let executionOutput = '';
    let executionError: Error | null = null;
    // Defaults for simulated errors or successful JS execution for AI
    let currentErrorMessage = ""; 
    let currentErrorDescription = "";

    if (currentCode.trim() === '') {
      toast({
        title: "Empty Code",
        description: "Please enter some code to debug.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (currentLanguage === 'javascript') {
      const capturedLogs: string[] = [];
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;
      const originalConsoleDebug = console.debug;

      // Override console methods to capture logs
      const captureLog = (type: string = '') => (...args: any[]) => {
        const message = args.map(arg => {
          try {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
          } catch (e) {
            return 'Unserializable object';
          }
        }).join(' ');
        capturedLogs.push(type ? `${type.toUpperCase()}: ${message}` : message);
        // Call original console method as well
        switch(type) {
          case 'error': originalConsoleError.apply(console, args); break;
          case 'warn': originalConsoleWarn.apply(console, args); break;
          case 'info': originalConsoleInfo.apply(console, args); break;
          case 'debug': originalConsoleDebug.apply(console, args); break;
          default: originalConsoleLog.apply(console, args);
        }
      };

      console.log = captureLog('');
      console.error = captureLog('error');
      console.warn = captureLog('warn');
      console.info = captureLog('info');
      console.debug = captureLog('debug');

      try {
        const result = new Function(currentCode)();
        if (result !== undefined) {
          capturedLogs.push(`Return value: ${String(result)}`);
        }
        executionOutput = capturedLogs.join('\n');
        if (!executionOutput && !capturedLogs.some(log => log.startsWith("ERROR:"))) {
          executionOutput = "JavaScript code executed successfully. No output logged to console.";
        }
        currentErrorMessage = ""; // No error by default if execution succeeds
        currentErrorDescription = "";
      } catch (e: any) {
        executionError = e;
        capturedLogs.push(`EXCEPTION: ${e.message}`);
        executionOutput = `Error executing JavaScript:\n${e.message}\nStack:\n${e.stack || 'No stack available'}\n\nCaptured Logs:\n${capturedLogs.join('\n')}`;
        currentErrorMessage = e.message;
        currentErrorDescription = e.stack || "Error during JavaScript execution.";
      } finally {
        // Restore original console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        console.info = originalConsoleInfo;
        console.debug = originalConsoleDebug;
      }
      setOutput(executionOutput);
    } else {
      // Simulation for other languages
      let simulatedDetails = {
        outputMsg: `Simulating ${currentLanguage} execution...\n(Note: Live execution is only available for JavaScript.)\nEncountered a simulated error. Check AI Debugger for analysis.`,
        errorMsg: `Simulated ${currentLanguage} error.`,
        errorDesc: `A generic error occurred during simulated ${currentLanguage} execution.`
      };

      if (currentLanguage === 'python') {
        if (currentCode.includes('print(divide(10, 0))')) {
          simulatedDetails.errorMsg = "ZeroDivisionError: division by zero";
          simulatedDetails.errorDesc = "Traceback (most recent call last):\n  File \"<string>\", line 5, in <module>\n  File \"<string>\", line 2, in divide\nZeroDivisionError: division by zero";
          simulatedDetails.outputMsg = `Simulating Python execution...\n(Note: Live execution is only available for JavaScript.)\nError: ${simulatedDetails.errorMsg}\nSee AI Debugger for analysis.`;
        } else {
          simulatedDetails.outputMsg = `Simulating ${currentLanguage} execution...\n(Note: Live execution is only available for JavaScript.)\nNo specific error simulated for this code. AI will analyze the code structure.`;
        }
      }
      // Add similar specific simulations for other languages if needed

      setOutput(simulatedDetails.outputMsg);
      currentErrorMessage = simulatedDetails.errorMsg;
      currentErrorDescription = simulatedDetails.errorDesc;
    }

    // AI Analysis
    try {
      const explainInput: ExplainErrorInput = {
        code: currentCode,
        language: currentLanguage,
        errorMessage: (currentLanguage === 'javascript' && !executionError)
          ? "JavaScript code executed successfully. No runtime errors detected."
          : currentErrorMessage || "No specific error message captured.",
      };
      const explanationResult = await explainError(explainInput);
      setErrorExplanation(explanationResult.explanation);

      const fixInput: SuggestCodeFixInput = {
        code: currentCode,
        language: currentLanguage,
        errorDescription: (currentLanguage === 'javascript' && !executionError)
          ? "The JavaScript code ran without errors. Please review it for best practices, potential logic flaws, or areas for improvement."
          : currentErrorDescription || "No specific error description available. Analyze for general issues.",
      };
      const fixResult = await suggestCodeFix(fixInput);
      setSuggestedFix(fixResult.suggestedFix + "\n\nExplanation:\n" + fixResult.explanation);
      
      toast({
        title: "AI Analysis Complete",
        description: "AI analysis results are available in the respective panels.",
      });

    } catch (aiError: any) {
      console.error("AI Processing Error:", aiError);
      setErrorExplanation(prev => prev || 'Failed to get explanation from AI. ' + (aiError.message || ''));
      setSuggestedFix(prev => prev || 'Failed to get suggested fix from AI. ' + (aiError.message || ''));
      toast({
        title: "AI Error",
        description: "Could not connect to AI services or AI processing failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (language === 'javascript') {
      setCode(defaultBuggyJSCode);
    } else if (language === 'python') {
      setCode(`# Python buggy code example
def divide(x, y):
  # Potential ZeroDivisionError if y is 0
  result = x / y 
  return result

print(divide(10, 2)) # Example of a working call
# print(divide(10, 0)) # Example of a call that would cause an error
`);
    } else {
      setCode(`// Enter your ${language} code here...
// Note: Live execution is only supported for JavaScript.
// For other languages, this will be a simulated run for AI analysis.`);
    }
    setOutput('');
    setErrorExplanation('');
    setSuggestedFix('');
  }, [language]);


  return (
    <div className="flex flex-col h-screen bg-background text-foreground font-mono">
      <header className="flex items-center justify-between p-3 border-b border-border shadow-md shrink-0">
        <div className="flex items-center space-x-2">
          <Bot className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold text-primary-foreground">AetherDebug</h1>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px] bg-input text-foreground">
              <SelectValue placeholder="Select Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRunCode} disabled={isLoading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Code
          </Button>
        </div>
      </header>

      <div className="flex flex-1 mt-2 overflow-hidden">
        <div className="w-3/5 flex flex-col p-4 border-r border-border">
          <label htmlFor="code-editor" className="mb-2 text-sm font-medium text-muted-foreground">
            Code Workspace
          </label>
          <Textarea
            id="code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Enter your ${language} code here... ${language !== 'javascript' ? '(Live execution for JS only)' : ''}`}
            className="flex-1 p-3 rounded-md shadow-inner bg-input border-border focus:ring-accent focus:border-accent text-base resize-none"
            spellCheck="false"
          />
        </div>
        <div className="w-2/5 flex flex-col p-4 space-y-4 overflow-y-auto">
          <Card className="flex-1 flex flex-col bg-card shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Bot className="mr-2 h-5 w-5 text-accent" />
                AI Error Analysis
              </CardTitle>
              <CardDescription>Explanation of the identified issue.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading && !errorExplanation ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : errorExplanation ? (
                <pre className="text-sm whitespace-pre-wrap text-foreground animate-fadeIn">{errorExplanation}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">Run code to see AI error analysis.</p>
              )}
            </CardContent>
          </Card>
          <Card className="flex-1 flex flex-col bg-card shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <Wand2 className="mr-2 h-5 w-5 text-accent" />
                AI Suggested Fix
              </CardTitle>
              <CardDescription>Automated code correction suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto custom-scrollbar">
              {isLoading && !suggestedFix ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : suggestedFix ? (
                <pre className="text-sm whitespace-pre-wrap text-foreground animate-fadeIn">{suggestedFix}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">Run code to see AI suggested fixes.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="h-1/4 border-t border-border flex flex-col shrink-0">
        <label htmlFor="output-console" className="p-2 pb-0 text-sm font-medium text-muted-foreground">
          Output Console
        </label>
        <pre
          id="output-console"
          className="flex-1 p-3 bg-input text-sm whitespace-pre-wrap overflow-auto custom-scrollbar text-foreground"
        >
          {output || (isLoading ? 'Executing...' : '// Output will appear here...')}
        </pre>
      </div>
      <style jsx global>{`
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--input)); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground)); 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--accent)); 
        }
      `}</style>
    </div>
  );
}