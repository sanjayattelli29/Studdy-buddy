// Declaration file for Pyodide

declare global {
  interface Window {
    loadPyodide: () => Promise<PyodideInterface>;
  }
}

// Interface for Pyodide
export interface PyodideInterface {
  runPython: (code: string) => unknown;
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
  loadPackagesFromImports: (code: string) => Promise<void>;
}

// Needed to make TypeScript treat this as a module
export {};
