import { Component, EventEmitter, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { EnergyReadingsFilterCriteria } from '../../../application/criteria/energy-readings-filter.criteria';
import { AppDatePickerComponent } from '../../../../shared/presentation/components/app-date-picker/app-date-picker.component';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

@Component({
  selector: 'app-energy-filter-form',
  standalone: true,
  imports: [TranslateModule, AppDatePickerComponent, AppButtonComponent],
  templateUrl: './energy-filter-form.component.html',
  styleUrls: ['./energy-filter-form.component.scss'],
})
export class EnergyFilterFormComponent {
  @Output() rangeChanged = new EventEmitter<EnergyReadingsFilterCriteria>();
  @Output() reset = new EventEmitter<void>();

  startDate = '';
  endDate = '';
  today = this.toInputDate(new Date());

  get isInvalidRange(): boolean {
    if (!this.startDate || !this.endDate) {
      return true;
    }

    if (this.startDate > this.endDate) {
      return true;
    }

    if (this.startDate > this.today || this.endDate > this.today) {
      return true;
    }

    return false;
  }

  onDateChange(): void {
    if (this.isInvalidRange) {
      return;
    }

    this.rangeChanged.emit({
      startDate: this.startDate,
      endDate: this.endDate,
    });
  }

  onReset(): void {
    this.startDate = '';
    this.endDate = '';
    this.reset.emit();
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
