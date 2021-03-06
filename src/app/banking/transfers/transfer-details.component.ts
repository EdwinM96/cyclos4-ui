import { ChangeDetectionStrategy, Component, Injector, Input, OnInit } from '@angular/core';
import { Transfer, TransferView } from 'app/api/models';
import { BankingHelperService } from 'app/core/banking-helper.service';
import { BaseComponent } from 'app/shared/base.component';
import { empty } from 'app/shared/helper';


/**
 * Displays fields of a transfer or payment
 */
@Component({
  selector: 'transfer-details',
  templateUrl: 'transfer-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransferDetailsComponent extends BaseComponent implements OnInit {

  @Input() transfer: TransferView;
  lastAuthComment: string;

  constructor(
    injector: Injector,
    private bankingHelper: BankingHelperService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const transaction = this.transfer.transaction || {};
    if (!empty(transaction.authorizations)) {
      this.lastAuthComment = transaction.authorizations[0].comments;
    }
  }

  path(transfer: Transfer): string[] {
    return ['/banking', 'transfer', this.bankingHelper.transactionNumberOrId(transfer)];
  }

  get toLink() {
    return (transfer: Transfer) => this.path(transfer);
  }
}
