import { Injector, OnInit } from '@angular/core';
import {
  Currency, Image, RecurringPaymentStatusEnum, TransactionDataForSearch,
  TransactionKind, TransactionResult, TransferFilter
} from 'app/api/models';
import { TransactionsService } from 'app/api/services';
import { TransactionStatusService } from 'app/core/transaction-status.service';
import { ApiHelper } from 'app/shared/api-helper';
import { BaseSearchPageComponent } from 'app/shared/base-search-page.component';
import { empty } from 'app/shared/helper';
import { BehaviorSubject } from 'rxjs';
import { BankingHelperService } from 'app/core/banking-helper.service';

/**
 * Base implementation for pages that search for transaction
 */
export abstract class BaseTransactionsSearch
  extends BaseSearchPageComponent<TransactionDataForSearch, TransactionResult>
  implements OnInit {

  transferFilters$ = new BehaviorSubject<TransferFilter[]>([]);
  currencies = new Map<string, Currency>();

  protected transactionsService: TransactionsService;
  protected transactionStatusService: TransactionStatusService;
  protected bankingHelper: BankingHelperService;

  constructor(injector: Injector) {
    super(injector);
    this.transactionsService = injector.get(TransactionsService);
    this.transactionStatusService = injector.get(TransactionStatusService);
    this.bankingHelper = injector.get(BankingHelperService);
  }

  getFormControlNames() {
    return ['status', 'accountType', 'transferFilter', 'preselectedPeriod', 'periodBegin', 'periodEnd'];
  }

  ngOnInit() {
    super.ngOnInit();

    // Get the account history data
    this.stateManager.cache('data',
      this.transactionsService.getTransactionsDataForSearch({
        owner: ApiHelper.SELF,
        fields: ['accountTypes', 'transferFilters', 'preselectedPeriods', 'query']
      })
    ).subscribe(data => {
      this.bankingHelper.preProcessPreselectedPeriods(data, this.form);

      // Initialize the currencies Map to make lookups easier
      (data.accountTypes || []).forEach(at => {
        const currency = at.currency;
        this.currencies.set(currency.id, currency);
        if (!empty(currency.internalName)) {
          this.currencies.set(currency.internalName, currency);
        }
      });

      // Only initialize the data once the form is filled-in
      this.data = data;
    });

    // Whenever the account type changes, also update the transfer filters
    this.addSub(this.form.get('accountType').valueChanges.subscribe(at => {
      this.form.patchValue({ transferFilter: null }, { emitEvent: false });
      const filters = this.data.transferFilters.filter(tf => tf.accountType.id === at);
      this.transferFilters$.next(filters);
    }));

    this.printable = true;
    this.headingActions = [this.printAction];
  }

  /**
   * Must be implemented to return the actual kinds of transactions to be returned
   */
  protected abstract getKinds(): TransactionKind[];

  doSearch(value: any) {
    const query = this.buildQuery(value);
    return this.transactionsService.searchTransactions$Response(query);
  }

  protected buildQuery(value: any): any {
    return {
      page: value.page, pageSize: value.pageSize,
      owner: ApiHelper.SELF,
      accountTypes: value.accountType ? [value.accountType] : null,
      transferFilters: value.transferFilter ? [value.transferFilter] : null,
      datePeriod: this.bankingHelper.resolveDatePeriod(value),
      kinds: this.getKinds()
    };
  }

  /**
   * Returns the route components for the given row
   * @param row The row
   */
  path(row: TransactionResult): string[] {
    return ['/banking', 'transaction', this.bankingHelper.transactionNumberOrId(row)];
  }

  get toLink() {
    return (row: TransactionResult) => this.path(row);
  }

  /**
   * Returns the icon used on the given row's avatar
   * @param row The row
   */
  avatarIcon(row: TransactionResult): string {
    return row.relatedKind === 'user' ? 'user' : 'account_balance_circle';
  }

  /**
   * Returns the image used on the given row's avatar
   * @param row The row
   */
  avatarImage(row: TransactionResult): Image {
    return (row.relatedUser || {}).image;
  }

  /**
   * Returns wither the user display or 'System account'
   * @param row The row
   */
  subjectName(row: TransactionResult): string {
    if (row.relatedKind === 'system') {
      return this.i18n.account.system;
    } else {
      return (row.relatedUser || {}).display;
    }
  }

  /**
   * Returns the status name
   * @param row The transaction
   */
  status(row: TransactionResult): string {
    return this.transactionStatusService.transactionStatus(row);
  }

  /**
   * Returns the scheduling label for the given transaction result
   */
  scheduling(row: TransactionResult) {
    switch (row.kind) {
      case TransactionKind.SCHEDULED_PAYMENT:
        if (row.installmentCount === 1) {
          const installment = row.firstInstallment || {};
          return this.i18n.transaction.schedulingStatus.scheduledToDate(installment.dueDate);
        } else {
          const count = row.installmentCount;
          const firstOpen = row.firstOpenInstallment;
          if (firstOpen) {
            return this.i18n.transaction.schedulingStatus.openInstallments({
              count: String(count),
              dueDate: this.format.formatAsDate(firstOpen.dueDate)
            });
          } else {
            return this.i18n.transaction.schedulingStatus.closedInstallments(String(count));
          }
        }
      case TransactionKind.RECURRING_PAYMENT:
        switch (row.recurringPaymentStatus) {
          case RecurringPaymentStatusEnum.CLOSED:
            return this.i18n.transaction.schedulingStatus.closedRecurring;
          case RecurringPaymentStatusEnum.CANCELED:
            return this.i18n.transaction.schedulingStatus.canceledRecurring;
          default:
            return this.i18n.transaction.schedulingStatus.openRecurring(this.format.formatAsDate(row.nextOccurrenceDate));
        }
      default:
        return this.i18n.transaction.schedulingStatus.direct;
    }
  }
}
