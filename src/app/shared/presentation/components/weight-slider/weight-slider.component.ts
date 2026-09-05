import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-weight-slider',
  standalone: true,
  templateUrl: './weight-slider.component.html',
  styleUrls: ['./weight-slider.component.scss'],
})
export class WeightSliderComponent {
  @Input() label = 'Peso';
  @Input() value = 0;
  @Input() percent = 0;
  @Input() active = true;
  @Input() min = 0;
  @Input() max = 30;
  @Input() step = 1;

  @Output() valueChange = new EventEmitter<number>();

  update(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.valueChange.emit(Number(input.value));
  }
}
