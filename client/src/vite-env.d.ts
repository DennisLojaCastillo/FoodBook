/// <reference types="svelte" />
/// <reference types="vite/client" />

// Global Svelte HTML element types
declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    [key: string]: any;
  }
}
