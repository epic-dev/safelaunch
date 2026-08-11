import 'react';

declare module 'react' {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    commandfor?: string;
    command?: 'show-modal' | 'close' | 'toggle-popover' | string;
  }
}