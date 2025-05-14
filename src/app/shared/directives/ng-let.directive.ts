import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

interface NgLetContext<T> {
  ngLet: T;
  $implicit: T;
}

@Directive({
  selector: '[ngLet]',
  standalone: true
})
export class NgLetDirective<T> {
  private context: NgLetContext<T> = {
    ngLet: null as any,
    $implicit: null as any
  };

  constructor(
    private viewContainer: ViewContainerRef,
    private templateRef: TemplateRef<NgLetContext<T>>
  ) {
    this.viewContainer.createEmbeddedView(this.templateRef, this.context);
  }

  @Input()
  set ngLet(value: T) {
    this.context.ngLet = this.context.$implicit = value;
  }
}