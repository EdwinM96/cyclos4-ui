import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { DataForUserPasswords, PasswordModeEnum, PasswordStatusAndActions, PasswordStatusEnum } from 'app/api/models';
import { PasswordsService } from 'app/api/services';
import { Configuration } from 'app/configuration';
import { ContentPage } from 'app/content/content-page';
import { handleFullWidthLayout } from 'app/content/content-with-layout';
import { DashboardItemConfig } from 'app/content/dashboard-item-config';
import { ApiHelper } from 'app/shared/api-helper';
import { BasePageComponent, UpdateTitleFrom } from 'app/shared/base-page.component';
import { Breakpoint } from 'app/shared/layout.service';
import { ActiveMenu, Menu } from 'app/shared/menu';
import { BehaviorSubject } from 'rxjs';

export const SessionToken = 'sessionToken';

export const PasswordStatusNeedingAttention = [
  PasswordStatusEnum.EXPIRED, PasswordStatusEnum.RESET,
  PasswordStatusEnum.PENDING, PasswordStatusEnum.NEVER_CREATED
];

/**
 * Displays the home page
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent extends BasePageComponent<void> implements OnInit {

  ready$ = new BehaviorSubject(false);
  homePage: ContentPage;

  configs: DashboardItemConfig[];
  leftConfigs: DashboardItemConfig[];
  rightConfigs: DashboardItemConfig[];
  fullConfigs: DashboardItemConfig[];

  passwords: DataForUserPasswords;
  passwordsNeedingAttention: PasswordStatusAndActions[];
  pendingSecurityAnswer = false;

  constructor(
    private injector: Injector,
    private passwordsService: PasswordsService) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();

    if (this.login.user == null) {
      // For guests, just fetch the content
      this.homePage = Configuration.homePage || { content: '' };
      this.ready$.next(true);
      // Emulate scrolling on d-pad (useful for KaiOS)
      this.emulateKeyboardScroll();
    } else {
      // For logged users, get the passwords statuses and resolve the dashboard items
      this.fetchPasswords();
      const configs = Configuration.dashboard ? Configuration.dashboard.dashboardItems(this.injector) : null;
      if (configs instanceof Array) {
        this.initializeItems(configs);
      } else {
        this.addSub(configs.subscribe(i => {
          this.initializeItems(i);
        }));
      }
    }

  }

  private maybeSetReady() {
    if (this.passwords && this.configs) {
      this.ready$.next(true);
    }
  }

  private fetchPasswords() {
    this.addSub(this.passwordsService.getUserPasswordsListData({
      user: ApiHelper.SELF,
      fields: ['dataForSetSecurityAnswer', 'passwords.status', 'passwords.type.name', 'passwords.type.mode']
    }).subscribe(data => {
      this.passwords = data;
      this.passwordsNeedingAttention = (data.passwords || []).filter(p => this.needsAttention(p));
      this.pendingSecurityAnswer = !!data.dataForSetSecurityAnswer;
      this.maybeSetReady();
    }));
  }

  private needsAttention(password: PasswordStatusAndActions): boolean {
    return password.type.mode !== PasswordModeEnum.OTP && PasswordStatusNeedingAttention.includes(password.status);
  }

  private initializeItems(configs: DashboardItemConfig[]) {
    configs = configs.filter(i => !!i);
    this.configs = configs;
    this.leftConfigs = configs.filter(c => c.column === 'left');
    this.rightConfigs = configs.filter(c => c.column === 'right');
    this.fullConfigs = configs.filter(c => c.column == null || c.column === 'full');
    this.maybeSetReady();
  }

  defaultFullWidthLayout(): boolean {
    if (this.login.user == null) {
      // Home content page may be full width
      return handleFullWidthLayout(Configuration.homePage);
    }
    return false;
  }

  updateTitleFrom(): UpdateTitleFrom {
    return 'menu';
  }

  passwordMessage(ps: PasswordStatusAndActions) {
    const type = ps.type.name;
    switch (ps.status) {
      case PasswordStatusEnum.EXPIRED:
        return this.i18n.dashboard.passwords.expired(type);
      case PasswordStatusEnum.RESET:
        return this.i18n.dashboard.passwords.reset(type);
      case PasswordStatusEnum.PENDING:
        return this.i18n.dashboard.passwords.pending(type);
      case PasswordStatusEnum.NEVER_CREATED:
        return this.i18n.dashboard.passwords.neverCreated(type);
    }
  }

  goToPasswords(event: MouseEvent) {
    this.menu.navigate({
      menu: new ActiveMenu(Menu.PASSWORDS),
      event: event,
      clear: false
    });
  }

  visibleConfigs(breakpoints: Set<Breakpoint>): DashboardItemConfig[] {
    return this.configs.filter(c => this.layout.visible(c.breakpoints, breakpoints));
  }

}
