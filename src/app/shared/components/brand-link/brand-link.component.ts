import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-brand-link',
  imports: [RouterLink],
  template: `
    <a routerLink="/movies" class="brand-link">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M7 3v18M17 3v18M3 8h4m-4 8h4M17 8h4m-4 8h4" />
        <path d="m10 9 4 3-4 3Z" />
      </svg>
      <span>Movie Explorer</span>
    </a>
  `,
  styles: `
    :host {
      display: inline-block;
      min-width: 0;
    }
    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      color: var(--accent-color);
      border-radius: 0.25rem;
      transition: color 150ms;
    }
    svg {
      width: 1em;
      height: 1em;
      flex-shrink: 0;
    }
    a:hover {
      color: var(--accent-hover-color);
    }
    a:focus-visible {
      outline: 2px solid var(--accent-color);
      outline-offset: 4px;
    }
    @media (prefers-reduced-motion: reduce) {
      a {
        transition: none;
      }
    }
  `,
})
export class BrandLinkComponent {}
