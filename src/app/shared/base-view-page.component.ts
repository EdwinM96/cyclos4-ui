import { Injector, OnInit } from '@angular/core';
import { BasePageComponent } from 'app/shared/base-page.component';

/**
 * Base class for components which are a view-only page
 */
export abstract class BaseViewPageComponent<D> extends BasePageComponent<D> implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnDestroy();
    this.emulateKeyboardScroll();
  }
}
