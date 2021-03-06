import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { ContentPage } from 'app/content/content-page';
import { ContentService } from 'app/core/content.service';
import { BaseViewPageComponent } from 'app/shared/base-view-page.component';

/**
 * Displays a content page with layout
 */
@Component({
  selector: 'content-page',
  templateUrl: 'content-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentPageComponent extends BaseViewPageComponent<ContentPage> implements OnInit {

  get page(): ContentPage {
    return this.data;
  }

  constructor(
    injector: Injector,
    private content: ContentService
  ) {
    super(injector);
  }

  ngOnInit() {
    super.ngOnInit();
    const slug = this.route.snapshot.params.slug;
    this.menu.setActiveContentPageSlug(slug);
    const page = this.content.contentPage(slug);
    if (page) {
      this.data = page;
      this.layout.fullWidth = page.layout === 'full';
      this.layout.title = page.title || page.label;
    } else {
      this.errorHandler.handleNotFoundError({});
    }
  }

}
