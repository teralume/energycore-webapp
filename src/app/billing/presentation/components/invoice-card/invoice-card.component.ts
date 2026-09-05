import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { Invoice } from '../../../domain/model/invoice.entity';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';

@Component({
  selector: 'app-invoice-card',
  standalone: true,
  imports: [TranslateModule, AppButtonComponent],
  templateUrl: './invoice-card.component.html',
  styleUrls: ['./invoice-card.component.scss'],
})
export class InvoiceCardComponent {
  @Input({ required: true }) invoice!: Invoice;

  @Output() download = new EventEmitter<number>();

  onDownload(): void {
    this.download.emit(this.invoice.id);
  }
}
