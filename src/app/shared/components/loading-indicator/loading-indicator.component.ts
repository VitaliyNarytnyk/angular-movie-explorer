import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-indicator',
  styleUrl: './loading-indicator.component.css',
  templateUrl: './loading-indicator.component.html',
  host: {
    class: 'block',
  },
})
export class LoadingIndicatorComponent {
  readonly message = input('Loading...');
}
