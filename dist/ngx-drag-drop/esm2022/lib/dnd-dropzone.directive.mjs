import { ContentChild, Directive, EventEmitter, HostListener, Input, Output, } from '@angular/core';
import { getDndType, getDropEffect, isExternalDrag, setDropEffect, } from './dnd-state';
import { getDirectChildElement, getDropData, shouldPositionPlaceholderBeforeElement, } from './dnd-utils';
import * as i0 from "@angular/core";
class DndPlaceholderRefDirective {
    elementRef;
    constructor(elementRef) {
        this.elementRef = elementRef;
    }
    ngOnInit() {
        // placeholder has to be "invisible" to the cursor, or it would interfere with the dragover detection for the same dropzone
        this.elementRef.nativeElement.style.pointerEvents = 'none';
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndPlaceholderRefDirective, deps: [{ token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.1", type: DndPlaceholderRefDirective, isStandalone: true, selector: "[dndPlaceholderRef]", ngImport: i0 });
}
export { DndPlaceholderRefDirective };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndPlaceholderRefDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndPlaceholderRef]', standalone: true }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }]; } });
class DndDropzoneDirective {
    ngZone;
    elementRef;
    renderer;
    dndDropzone = '';
    dndEffectAllowed = 'uninitialized';
    dndAllowExternal = false;
    dndHorizontal = false;
    dndDragoverClass = 'dndDragover';
    dndDropzoneDisabledClass = 'dndDropzoneDisabled';
    dndDragover = new EventEmitter();
    dndDrop = new EventEmitter();
    dndPlaceholderRef;
    placeholder = null;
    disabled = false;
    constructor(ngZone, elementRef, renderer) {
        this.ngZone = ngZone;
        this.elementRef = elementRef;
        this.renderer = renderer;
    }
    set dndDisableIf(value) {
        this.disabled = value;
        if (this.disabled) {
            this.renderer.addClass(this.elementRef.nativeElement, this.dndDropzoneDisabledClass);
        }
        else {
            this.renderer.removeClass(this.elementRef.nativeElement, this.dndDropzoneDisabledClass);
        }
    }
    set dndDisableDropIf(value) {
        this.dndDisableIf = value;
    }
    ngAfterViewInit() {
        this.placeholder = this.tryGetPlaceholder();
        this.removePlaceholderFromDOM();
        this.ngZone.runOutsideAngular(() => {
            this.elementRef.nativeElement.addEventListener('dragenter', this.dragEnterEventHandler);
            this.elementRef.nativeElement.addEventListener('dragover', this.dragOverEventHandler);
            this.elementRef.nativeElement.addEventListener('dragleave', this.dragLeaveEventHandler);
        });
    }
    ngOnDestroy() {
        this.elementRef.nativeElement.removeEventListener('dragenter', this.dragEnterEventHandler);
        this.elementRef.nativeElement.removeEventListener('dragover', this.dragOverEventHandler);
        this.elementRef.nativeElement.removeEventListener('dragleave', this.dragLeaveEventHandler);
    }
    onDragEnter(event) {
        // check if another dropzone is activated
        if (event._dndDropzoneActive === true) {
            this.cleanupDragoverState();
            return;
        }
        // set as active if the target element is inside this dropzone
        if (event._dndDropzoneActive == null) {
            const newTarget = document.elementFromPoint(event.clientX, event.clientY);
            if (this.elementRef.nativeElement.contains(newTarget)) {
                event._dndDropzoneActive = true;
            }
        }
        // check if this drag event is allowed to drop on this dropzone
        const type = getDndType(event);
        if (!this.isDropAllowed(type)) {
            return;
        }
        // allow the dragenter
        event.preventDefault();
    }
    onDragOver(event) {
        // With nested dropzones, we want to ignore this event if a child dropzone
        // has already handled a dragover.  Historically, event.stopPropagation() was
        // used to prevent this bubbling, but that prevents any dragovers outside the
        // ngx-drag-drop component, and stops other use cases such as scrolling on drag.
        // Instead, we can check if the event was already prevented by a child and bail early.
        if (event.defaultPrevented) {
            return;
        }
        // check if this drag event is allowed to drop on this dropzone
        const type = getDndType(event);
        if (!this.isDropAllowed(type)) {
            return;
        }
        this.checkAndUpdatePlaceholderPosition(event);
        const dropEffect = getDropEffect(event, this.dndEffectAllowed);
        if (dropEffect === 'none') {
            this.cleanupDragoverState();
            return;
        }
        // allow the dragover
        event.preventDefault();
        // set the drop effect
        setDropEffect(event, dropEffect);
        this.dndDragover.emit(event);
        this.renderer.addClass(this.elementRef.nativeElement, this.dndDragoverClass);
    }
    onDrop(event) {
        try {
            // check if this drag event is allowed to drop on this dropzone
            const type = getDndType(event);
            if (!this.isDropAllowed(type)) {
                return;
            }
            const data = getDropData(event, isExternalDrag());
            if (!this.isDropAllowed(data.type)) {
                return;
            }
            // signal custom drop handling
            event.preventDefault();
            const dropEffect = getDropEffect(event);
            setDropEffect(event, dropEffect);
            if (dropEffect === 'none') {
                return;
            }
            const dropIndex = this.getPlaceholderIndex();
            // if for whatever reason the placeholder is not present in the DOM but it should be there
            // we don't allow/emit the drop event since it breaks the contract
            // seems to only happen if drag and drop is executed faster than the DOM updates
            if (dropIndex === -1) {
                return;
            }
            this.dndDrop.emit({
                event: event,
                dropEffect: dropEffect,
                isExternal: isExternalDrag(),
                data: data.data,
                index: dropIndex,
                type: type,
            });
            event.stopPropagation();
        }
        finally {
            this.cleanupDragoverState();
        }
    }
    onDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        // check if still inside this dropzone and not yet handled by another dropzone
        if (event._dndDropzoneActive == null) {
            if (this.elementRef.nativeElement.contains(event.relatedTarget)) {
                event._dndDropzoneActive = true;
                return;
            }
        }
        this.cleanupDragoverState();
        // cleanup drop effect when leaving dropzone
        setDropEffect(event, 'none');
    }
    dragEnterEventHandler = (event) => this.onDragEnter(event);
    dragOverEventHandler = (event) => this.onDragOver(event);
    dragLeaveEventHandler = (event) => this.onDragLeave(event);
    isDropAllowed(type) {
        // dropzone is disabled -> deny it
        if (this.disabled) {
            return false;
        }
        // if drag did not start from our directive
        // and external drag sources are not allowed -> deny it
        if (isExternalDrag() && !this.dndAllowExternal) {
            return false;
        }
        // no filtering by types -> allow it
        if (!this.dndDropzone) {
            return true;
        }
        // no type set -> allow it
        if (!type) {
            return true;
        }
        if (!Array.isArray(this.dndDropzone)) {
            throw new Error('dndDropzone: bound value to [dndDropzone] must be an array!');
        }
        // if dropzone contains type -> allow it
        return this.dndDropzone.indexOf(type) !== -1;
    }
    tryGetPlaceholder() {
        if (typeof this.dndPlaceholderRef !== 'undefined') {
            return this.dndPlaceholderRef.elementRef.nativeElement;
        }
        // TODO nasty workaround needed because if ng-container / template is used @ContentChild() or DI will fail because
        // of wrong context see angular bug https://github.com/angular/angular/issues/13517
        return this.elementRef.nativeElement.querySelector('[dndPlaceholderRef]');
    }
    removePlaceholderFromDOM() {
        if (this.placeholder !== null && this.placeholder.parentNode !== null) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }
    }
    checkAndUpdatePlaceholderPosition(event) {
        if (this.placeholder === null) {
            return;
        }
        // make sure the placeholder is in the DOM
        if (this.placeholder.parentNode !== this.elementRef.nativeElement) {
            this.renderer.appendChild(this.elementRef.nativeElement, this.placeholder);
        }
        // update the position if the event originates from a child element of the dropzone
        const directChild = getDirectChildElement(this.elementRef.nativeElement, event.target);
        // early exit if no direct child or direct child is placeholder
        if (directChild === null || directChild === this.placeholder) {
            return;
        }
        const positionPlaceholderBeforeDirectChild = shouldPositionPlaceholderBeforeElement(event, directChild, this.dndHorizontal);
        if (positionPlaceholderBeforeDirectChild) {
            // do insert before only if necessary
            if (directChild.previousSibling !== this.placeholder) {
                this.renderer.insertBefore(this.elementRef.nativeElement, this.placeholder, directChild);
            }
        }
        else {
            // do insert after only if necessary
            if (directChild.nextSibling !== this.placeholder) {
                this.renderer.insertBefore(this.elementRef.nativeElement, this.placeholder, directChild.nextSibling);
            }
        }
    }
    getPlaceholderIndex() {
        if (this.placeholder === null) {
            return undefined;
        }
        const element = this.elementRef.nativeElement;
        return Array.prototype.indexOf.call(element.children, this.placeholder);
    }
    cleanupDragoverState() {
        this.renderer.removeClass(this.elementRef.nativeElement, this.dndDragoverClass);
        this.removePlaceholderFromDOM();
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndDropzoneDirective, deps: [{ token: i0.NgZone }, { token: i0.ElementRef }, { token: i0.Renderer2 }], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.1", type: DndDropzoneDirective, isStandalone: true, selector: "[dndDropzone]", inputs: { dndDropzone: "dndDropzone", dndEffectAllowed: "dndEffectAllowed", dndAllowExternal: "dndAllowExternal", dndHorizontal: "dndHorizontal", dndDragoverClass: "dndDragoverClass", dndDropzoneDisabledClass: "dndDropzoneDisabledClass", dndDisableIf: "dndDisableIf", dndDisableDropIf: "dndDisableDropIf" }, outputs: { dndDragover: "dndDragover", dndDrop: "dndDrop" }, host: { listeners: { "drop": "onDrop($event)" } }, queries: [{ propertyName: "dndPlaceholderRef", first: true, predicate: DndPlaceholderRefDirective, descendants: true }], ngImport: i0 });
}
export { DndDropzoneDirective };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndDropzoneDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndDropzone]', standalone: true }]
        }], ctorParameters: function () { return [{ type: i0.NgZone }, { type: i0.ElementRef }, { type: i0.Renderer2 }]; }, propDecorators: { dndDropzone: [{
                type: Input
            }], dndEffectAllowed: [{
                type: Input
            }], dndAllowExternal: [{
                type: Input
            }], dndHorizontal: [{
                type: Input
            }], dndDragoverClass: [{
                type: Input
            }], dndDropzoneDisabledClass: [{
                type: Input
            }], dndDragover: [{
                type: Output
            }], dndDrop: [{
                type: Output
            }], dndPlaceholderRef: [{
                type: ContentChild,
                args: [DndPlaceholderRefDirective]
            }], dndDisableIf: [{
                type: Input
            }], dndDisableDropIf: [{
                type: Input
            }], onDrop: [{
                type: HostListener,
                args: ['drop', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLWRyb3B6b25lLmRpcmVjdGl2ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2RuZC9zcmMvbGliL2RuZC1kcm9wem9uZS5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUVMLFlBQVksRUFDWixTQUFTLEVBRVQsWUFBWSxFQUNaLFlBQVksRUFDWixLQUFLLEVBSUwsTUFBTSxHQUVQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFDTCxVQUFVLEVBQ1YsYUFBYSxFQUNiLGNBQWMsRUFDZCxhQUFhLEdBQ2QsTUFBTSxhQUFhLENBQUM7QUFFckIsT0FBTyxFQUdMLHFCQUFxQixFQUNyQixXQUFXLEVBQ1gsc0NBQXNDLEdBQ3ZDLE1BQU0sYUFBYSxDQUFDOztBQVdyQixNQUNhLDBCQUEwQjtJQUNUO0lBQTVCLFlBQTRCLFVBQW1DO1FBQW5DLGVBQVUsR0FBVixVQUFVLENBQXlCO0lBQUcsQ0FBQztJQUVuRSxRQUFRO1FBQ04sMkhBQTJIO1FBQzNILElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO0lBQzdELENBQUM7dUdBTlUsMEJBQTBCOzJGQUExQiwwQkFBMEI7O1NBQTFCLDBCQUEwQjsyRkFBMUIsMEJBQTBCO2tCQUR0QyxTQUFTO21CQUFDLEVBQUUsUUFBUSxFQUFFLHFCQUFxQixFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7O0FBVWhFLE1BQ2Esb0JBQW9CO0lBMkJyQjtJQUNBO0lBQ0E7SUE1QkQsV0FBVyxHQUFtQixFQUFFLENBQUM7SUFFakMsZ0JBQWdCLEdBQWtCLGVBQWUsQ0FBQztJQUVsRCxnQkFBZ0IsR0FBWSxLQUFLLENBQUM7SUFFbEMsYUFBYSxHQUFZLEtBQUssQ0FBQztJQUUvQixnQkFBZ0IsR0FBVyxhQUFhLENBQUM7SUFFekMsd0JBQXdCLEdBQUcscUJBQXFCLENBQUM7SUFFdkMsV0FB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LENBQ3ZCLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxFQUM3QixJQUFJLENBQUMsZ0JBQWdCLENBQ3RCLENBQUM7UUFFRixJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztJQUNsQyxDQUFDO3VHQTdWVSxvQkFBb0I7MkZBQXBCLG9CQUFvQiw0aEJBbUJqQiwwQkFBMEI7O1NBbkI3QixvQkFBb0I7MkZBQXBCLG9CQUFvQjtrQkFEaEMsU0FBUzttQkFBQyxFQUFFLFFBQVEsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTs4SUFFL0MsV0FBVztzQkFBbkIsS0FBSztnQkFFRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBRUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUVHLGFBQWE7c0JBQXJCLEtBQUs7Z0JBRUcsZ0JBQWdCO3NCQUF4QixLQUFLO2dCQUVHLHdCQUF3QjtzQkFBaEMsS0FBSztnQkFFYSxXQUFXO3NCQUE3QixNQUFNO2dCQUdZLE9BQU87c0JBQXpCLE1BQU07Z0JBSVUsaUJBQWlCO3NCQURqQyxZQUFZO3VCQUFDLDBCQUEwQjtnQkFhM0IsWUFBWTtzQkFBeEIsS0FBSztnQkFnQk8sZ0JBQWdCO3NCQUE1QixLQUFLO2dCQXlHNEIsTUFBTTtzQkFBdkMsWUFBWTt1QkFBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBBZnRlclZpZXdJbml0LFxuICBDb250ZW50Q2hpbGQsXG4gIERpcmVjdGl2ZSxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBIb3N0TGlzdGVuZXIsXG4gIElucHV0LFxuICBOZ1pvbmUsXG4gIE9uRGVzdHJveSxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG4gIFJlbmRlcmVyMixcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge1xuICBnZXREbmRUeXBlLFxuICBnZXREcm9wRWZmZWN0LFxuICBpc0V4dGVybmFsRHJhZyxcbiAgc2V0RHJvcEVmZmVjdCxcbn0gZnJvbSAnLi9kbmQtc3RhdGUnO1xuaW1wb3J0IHsgRHJvcEVmZmVjdCwgRWZmZWN0QWxsb3dlZCB9IGZyb20gJy4vZG5kLXR5cGVzJztcbmltcG9ydCB7XG4gIERuZEV2ZW50LFxuICBEcmFnRHJvcERhdGEsXG4gIGdldERpcmVjdENoaWxkRWxlbWVudCxcbiAgZ2V0RHJvcERhdGEsXG4gIHNob3VsZFBvc2l0aW9uUGxhY2Vob2xkZXJCZWZvcmVFbGVtZW50LFxufSBmcm9tICcuL2RuZC11dGlscyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRG5kRHJvcEV2ZW50IHtcbiAgZXZlbnQ6IERyYWdFdmVudDtcbiAgZHJvcEVmZmVjdDogRHJvcEVmZmVjdDtcbiAgaXNFeHRlcm5hbDogYm9vbGVhbjtcbiAgZGF0YT86IGFueTtcbiAgaW5kZXg/OiBudW1iZXI7XG4gIHR5cGU/OiBhbnk7XG59XG5cbkBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tkbmRQbGFjZWhvbGRlclJlZl0nLCBzdGFuZGFsb25lOiB0cnVlIH0pXG5leHBvcnQgY2xhc3MgRG5kUGxhY2Vob2xkZXJSZWZEaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQge1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4pIHt9XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgLy8gcGxhY2Vob2xkZXIgaGFzIHRvIGJlIFwiaW52aXNpYmxlXCIgdG8gdGhlIGN1cnNvciwgb3IgaXQgd291bGQgaW50ZXJmZXJlIHdpdGggdGhlIGRyYWdvdmVyIGRldGVjdGlvbiBmb3IgdGhlIHNhbWUgZHJvcHpvbmVcbiAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICB9XG59XG5cbkBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tkbmREcm9wem9uZV0nLCBzdGFuZGFsb25lOiB0cnVlIH0pXG5leHBvcnQgY2xhc3MgRG5kRHJvcHpvbmVEaXJlY3RpdmUgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICBASW5wdXQoKSBkbmREcm9wem9uZT86IHN0cmluZ1tdIHwgJycgPSAnJztcblxuICBASW5wdXQoKSBkbmRFZmZlY3RBbGxvd2VkOiBFZmZlY3RBbGxvd2VkID0gJ3VuaW5pdGlhbGl6ZWQnO1xuXG4gIEBJbnB1dCgpIGRuZEFsbG93RXh0ZXJuYWw6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBASW5wdXQoKSBkbmRIb3Jpem9udGFsOiBib29sZWFuID0gZmFsc2U7XG5cbiAgQElucHV0KCkgZG5kRHJhZ292ZXJDbGFzczogc3RyaW5nID0gJ2RuZERyYWdvdmVyJztcblxuICBASW5wdXQoKSBkbmREcm9wem9uZURpc2FibGVkQ2xhc3MgPSAnZG5kRHJvcHpvbmVEaXNhYmxlZCc7XG5cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZERyYWdvdmVyOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG5cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZERyb3A6IEV2ZW50RW1pdHRlcjxEbmREcm9wRXZlbnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPERuZERyb3BFdmVudD4oKTtcblxuICBAQ29udGVudENoaWxkKERuZFBsYWNlaG9sZGVyUmVmRGlyZWN0aXZlKVxuICBwcml2YXRlIHJlYWRvbmx5IGRuZFBsYWNlaG9sZGVyUmVmPzogRG5kUGxhY2Vob2xkZXJSZWZEaXJlY3RpdmU7XG5cbiAgcHJpdmF0ZSBwbGFjZWhvbGRlcjogRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgZGlzYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIG5nWm9uZTogTmdab25lLFxuICAgIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZixcbiAgICBwcml2YXRlIHJlbmRlcmVyOiBSZW5kZXJlcjJcbiAgKSB7fVxuXG4gIEBJbnB1dCgpIHNldCBkbmREaXNhYmxlSWYodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRpc2FibGVkID0gdmFsdWU7XG5cbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhcbiAgICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgIHRoaXMuZG5kRHJvcHpvbmVEaXNhYmxlZENsYXNzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKFxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy5kbmREcm9wem9uZURpc2FibGVkQ2xhc3NcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgQElucHV0KCkgc2V0IGRuZERpc2FibGVEcm9wSWYodmFsdWU6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmRuZERpc2FibGVJZiA9IHZhbHVlO1xuICB9XG5cbiAgbmdBZnRlclZpZXdJbml0KCk6IHZvaWQge1xuICAgIHRoaXMucGxhY2Vob2xkZXIgPSB0aGlzLnRyeUdldFBsYWNlaG9sZGVyKCk7XG5cbiAgICB0aGlzLnJlbW92ZVBsYWNlaG9sZGVyRnJvbURPTSgpO1xuXG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ2RyYWdlbnRlcicsXG4gICAgICAgIHRoaXMuZHJhZ0VudGVyRXZlbnRIYW5kbGVyXG4gICAgICApO1xuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ2RyYWdvdmVyJyxcbiAgICAgICAgdGhpcy5kcmFnT3ZlckV2ZW50SGFuZGxlclxuICAgICAgKTtcbiAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgICdkcmFnbGVhdmUnLFxuICAgICAgICB0aGlzLmRyYWdMZWF2ZUV2ZW50SGFuZGxlclxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAnZHJhZ2VudGVyJyxcbiAgICAgIHRoaXMuZHJhZ0VudGVyRXZlbnRIYW5kbGVyXG4gICAgKTtcbiAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFxuICAgICAgJ2RyYWdvdmVyJyxcbiAgICAgIHRoaXMuZHJhZ092ZXJFdmVudEhhbmRsZXJcbiAgICApO1xuICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXG4gICAgICAnZHJhZ2xlYXZlJyxcbiAgICAgIHRoaXMuZHJhZ0xlYXZlRXZlbnRIYW5kbGVyXG4gICAgKTtcbiAgfVxuXG4gIG9uRHJhZ0VudGVyKGV2ZW50OiBEbmRFdmVudCkge1xuICAgIC8vIGNoZWNrIGlmIGFub3RoZXIgZHJvcHpvbmUgaXMgYWN0aXZhdGVkXG4gICAgaWYgKGV2ZW50Ll9kbmREcm9wem9uZUFjdGl2ZSA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5jbGVhbnVwRHJhZ292ZXJTdGF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHNldCBhcyBhY3RpdmUgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGluc2lkZSB0aGlzIGRyb3B6b25lXG4gICAgaWYgKGV2ZW50Ll9kbmREcm9wem9uZUFjdGl2ZSA9PSBudWxsKSB7XG4gICAgICBjb25zdCBuZXdUYXJnZXQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KGV2ZW50LmNsaWVudFgsIGV2ZW50LmNsaWVudFkpO1xuXG4gICAgICBpZiAodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY29udGFpbnMobmV3VGFyZ2V0KSkge1xuICAgICAgICBldmVudC5fZG5kRHJvcHpvbmVBY3RpdmUgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNoZWNrIGlmIHRoaXMgZHJhZyBldmVudCBpcyBhbGxvd2VkIHRvIGRyb3Agb24gdGhpcyBkcm9wem9uZVxuICAgIGNvbnN0IHR5cGUgPSBnZXREbmRUeXBlKGV2ZW50KTtcbiAgICBpZiAoIXRoaXMuaXNEcm9wQWxsb3dlZCh0eXBlKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFsbG93IHRoZSBkcmFnZW50ZXJcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICB9XG5cbiAgb25EcmFnT3ZlcihldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgLy8gV2l0aCBuZXN0ZWQgZHJvcHpvbmVzLCB3ZSB3YW50IHRvIGlnbm9yZSB0aGlzIGV2ZW50IGlmIGEgY2hpbGQgZHJvcHpvbmVcbiAgICAvLyBoYXMgYWxyZWFkeSBoYW5kbGVkIGEgZHJhZ292ZXIuICBIaXN0b3JpY2FsbHksIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpIHdhc1xuICAgIC8vIHVzZWQgdG8gcHJldmVudCB0aGlzIGJ1YmJsaW5nLCBidXQgdGhhdCBwcmV2ZW50cyBhbnkgZHJhZ292ZXJzIG91dHNpZGUgdGhlXG4gICAgLy8gbmd4LWRyYWctZHJvcCBjb21wb25lbnQsIGFuZCBzdG9wcyBvdGhlciB1c2UgY2FzZXMgc3VjaCBhcyBzY3JvbGxpbmcgb24gZHJhZy5cbiAgICAvLyBJbnN0ZWFkLCB3ZSBjYW4gY2hlY2sgaWYgdGhlIGV2ZW50IHdhcyBhbHJlYWR5IHByZXZlbnRlZCBieSBhIGNoaWxkIGFuZCBiYWlsIGVhcmx5LlxuICAgIGlmIChldmVudC5kZWZhdWx0UHJldmVudGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgdGhpcyBkcmFnIGV2ZW50IGlzIGFsbG93ZWQgdG8gZHJvcCBvbiB0aGlzIGRyb3B6b25lXG4gICAgY29uc3QgdHlwZSA9IGdldERuZFR5cGUoZXZlbnQpO1xuICAgIGlmICghdGhpcy5pc0Ryb3BBbGxvd2VkKHR5cGUpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGVja0FuZFVwZGF0ZVBsYWNlaG9sZGVyUG9zaXRpb24oZXZlbnQpO1xuXG4gICAgY29uc3QgZHJvcEVmZmVjdCA9IGdldERyb3BFZmZlY3QoZXZlbnQsIHRoaXMuZG5kRWZmZWN0QWxsb3dlZCk7XG5cbiAgICBpZiAoZHJvcEVmZmVjdCA9PT0gJ25vbmUnKSB7XG4gICAgICB0aGlzLmNsZWFudXBEcmFnb3ZlclN0YXRlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gYWxsb3cgdGhlIGRyYWdvdmVyXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIC8vIHNldCB0aGUgZHJvcCBlZmZlY3RcbiAgICBzZXREcm9wRWZmZWN0KGV2ZW50LCBkcm9wRWZmZWN0KTtcblxuICAgIHRoaXMuZG5kRHJhZ292ZXIuZW1pdChldmVudCk7XG5cbiAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKFxuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICB0aGlzLmRuZERyYWdvdmVyQ2xhc3NcbiAgICApO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZHJvcCcsIFsnJGV2ZW50J10pIG9uRHJvcChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIGNoZWNrIGlmIHRoaXMgZHJhZyBldmVudCBpcyBhbGxvd2VkIHRvIGRyb3Agb24gdGhpcyBkcm9wem9uZVxuICAgICAgY29uc3QgdHlwZSA9IGdldERuZFR5cGUoZXZlbnQpO1xuICAgICAgaWYgKCF0aGlzLmlzRHJvcEFsbG93ZWQodHlwZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkYXRhOiBEcmFnRHJvcERhdGEgPSBnZXREcm9wRGF0YShldmVudCwgaXNFeHRlcm5hbERyYWcoKSk7XG5cbiAgICAgIGlmICghdGhpcy5pc0Ryb3BBbGxvd2VkKGRhdGEudHlwZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICAvLyBzaWduYWwgY3VzdG9tIGRyb3AgaGFuZGxpbmdcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IGRyb3BFZmZlY3QgPSBnZXREcm9wRWZmZWN0KGV2ZW50KTtcblxuICAgICAgc2V0RHJvcEVmZmVjdChldmVudCwgZHJvcEVmZmVjdCk7XG5cbiAgICAgIGlmIChkcm9wRWZmZWN0ID09PSAnbm9uZScpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkcm9wSW5kZXggPSB0aGlzLmdldFBsYWNlaG9sZGVySW5kZXgoKTtcblxuICAgICAgLy8gaWYgZm9yIHdoYXRldmVyIHJlYXNvbiB0aGUgcGxhY2Vob2xkZXIgaXMgbm90IHByZXNlbnQgaW4gdGhlIERPTSBidXQgaXQgc2hvdWxkIGJlIHRoZXJlXG4gICAgICAvLyB3ZSBkb24ndCBhbGxvdy9lbWl0IHRoZSBkcm9wIGV2ZW50IHNpbmNlIGl0IGJyZWFrcyB0aGUgY29udHJhY3RcbiAgICAgIC8vIHNlZW1zIHRvIG9ubHkgaGFwcGVuIGlmIGRyYWcgYW5kIGRyb3AgaXMgZXhlY3V0ZWQgZmFzdGVyIHRoYW4gdGhlIERPTSB1cGRhdGVzXG4gICAgICBpZiAoZHJvcEluZGV4ID09PSAtMSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZG5kRHJvcC5lbWl0KHtcbiAgICAgICAgZXZlbnQ6IGV2ZW50LFxuICAgICAgICBkcm9wRWZmZWN0OiBkcm9wRWZmZWN0LFxuICAgICAgICBpc0V4dGVybmFsOiBpc0V4dGVybmFsRHJhZygpLFxuICAgICAgICBkYXRhOiBkYXRhLmRhdGEsXG4gICAgICAgIGluZGV4OiBkcm9wSW5kZXgsXG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICB9KTtcblxuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2xlYW51cERyYWdvdmVyU3RhdGUoKTtcbiAgICB9XG4gIH1cblxuICBvbkRyYWdMZWF2ZShldmVudDogRG5kRXZlbnQpIHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgLy8gY2hlY2sgaWYgc3RpbGwgaW5zaWRlIHRoaXMgZHJvcHpvbmUgYW5kIG5vdCB5ZXQgaGFuZGxlZCBieSBhbm90aGVyIGRyb3B6b25lXG4gICAgaWYgKGV2ZW50Ll9kbmREcm9wem9uZUFjdGl2ZSA9PSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY29udGFpbnMoZXZlbnQucmVsYXRlZFRhcmdldCkpIHtcbiAgICAgICAgZXZlbnQuX2RuZERyb3B6b25lQWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY2xlYW51cERyYWdvdmVyU3RhdGUoKTtcblxuICAgIC8vIGNsZWFudXAgZHJvcCBlZmZlY3Qgd2hlbiBsZWF2aW5nIGRyb3B6b25lXG4gICAgc2V0RHJvcEVmZmVjdChldmVudCwgJ25vbmUnKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVhZG9ubHkgZHJhZ0VudGVyRXZlbnRIYW5kbGVyOiAoZXZlbnQ6IERyYWdFdmVudCkgPT4gdm9pZCA9IChcbiAgICBldmVudDogRHJhZ0V2ZW50XG4gICkgPT4gdGhpcy5vbkRyYWdFbnRlcihldmVudCk7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBkcmFnT3ZlckV2ZW50SGFuZGxlcjogKGV2ZW50OiBEcmFnRXZlbnQpID0+IHZvaWQgPSAoXG4gICAgZXZlbnQ6IERyYWdFdmVudFxuICApID0+IHRoaXMub25EcmFnT3ZlcihldmVudCk7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBkcmFnTGVhdmVFdmVudEhhbmRsZXI6IChldmVudDogRHJhZ0V2ZW50KSA9PiB2b2lkID0gKFxuICAgIGV2ZW50OiBEcmFnRXZlbnRcbiAgKSA9PiB0aGlzLm9uRHJhZ0xlYXZlKGV2ZW50KTtcblxuICBwcml2YXRlIGlzRHJvcEFsbG93ZWQodHlwZT86IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIC8vIGRyb3B6b25lIGlzIGRpc2FibGVkIC0+IGRlbnkgaXRcbiAgICBpZiAodGhpcy5kaXNhYmxlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIGlmIGRyYWcgZGlkIG5vdCBzdGFydCBmcm9tIG91ciBkaXJlY3RpdmVcbiAgICAvLyBhbmQgZXh0ZXJuYWwgZHJhZyBzb3VyY2VzIGFyZSBub3QgYWxsb3dlZCAtPiBkZW55IGl0XG4gICAgaWYgKGlzRXh0ZXJuYWxEcmFnKCkgJiYgIXRoaXMuZG5kQWxsb3dFeHRlcm5hbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIC8vIG5vIGZpbHRlcmluZyBieSB0eXBlcyAtPiBhbGxvdyBpdFxuICAgIGlmICghdGhpcy5kbmREcm9wem9uZSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gbm8gdHlwZSBzZXQgLT4gYWxsb3cgaXRcbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICghQXJyYXkuaXNBcnJheSh0aGlzLmRuZERyb3B6b25lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnZG5kRHJvcHpvbmU6IGJvdW5kIHZhbHVlIHRvIFtkbmREcm9wem9uZV0gbXVzdCBiZSBhbiBhcnJheSEnXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIGlmIGRyb3B6b25lIGNvbnRhaW5zIHR5cGUgLT4gYWxsb3cgaXRcbiAgICByZXR1cm4gdGhpcy5kbmREcm9wem9uZS5pbmRleE9mKHR5cGUpICE9PSAtMTtcbiAgfVxuXG4gIHByaXZhdGUgdHJ5R2V0UGxhY2Vob2xkZXIoKTogRWxlbWVudCB8IG51bGwge1xuICAgIGlmICh0eXBlb2YgdGhpcy5kbmRQbGFjZWhvbGRlclJlZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVybiB0aGlzLmRuZFBsYWNlaG9sZGVyUmVmLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCBhcyBFbGVtZW50O1xuICAgIH1cblxuICAgIC8vIFRPRE8gbmFzdHkgd29ya2Fyb3VuZCBuZWVkZWQgYmVjYXVzZSBpZiBuZy1jb250YWluZXIgLyB0ZW1wbGF0ZSBpcyB1c2VkIEBDb250ZW50Q2hpbGQoKSBvciBESSB3aWxsIGZhaWwgYmVjYXVzZVxuICAgIC8vIG9mIHdyb25nIGNvbnRleHQgc2VlIGFuZ3VsYXIgYnVnIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL2FuZ3VsYXIvaXNzdWVzLzEzNTE3XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkbmRQbGFjZWhvbGRlclJlZl0nKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlUGxhY2Vob2xkZXJGcm9tRE9NKCkge1xuICAgIGlmICh0aGlzLnBsYWNlaG9sZGVyICE9PSBudWxsICYmIHRoaXMucGxhY2Vob2xkZXIucGFyZW50Tm9kZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5wbGFjZWhvbGRlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMucGxhY2Vob2xkZXIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY2hlY2tBbmRVcGRhdGVQbGFjZWhvbGRlclBvc2l0aW9uKGV2ZW50OiBEcmFnRXZlbnQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5wbGFjZWhvbGRlciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIG1ha2Ugc3VyZSB0aGUgcGxhY2Vob2xkZXIgaXMgaW4gdGhlIERPTVxuICAgIGlmICh0aGlzLnBsYWNlaG9sZGVyLnBhcmVudE5vZGUgIT09IHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50KSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLmFwcGVuZENoaWxkKFxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy5wbGFjZWhvbGRlclxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyB1cGRhdGUgdGhlIHBvc2l0aW9uIGlmIHRoZSBldmVudCBvcmlnaW5hdGVzIGZyb20gYSBjaGlsZCBlbGVtZW50IG9mIHRoZSBkcm9wem9uZVxuICAgIGNvbnN0IGRpcmVjdENoaWxkID0gZ2V0RGlyZWN0Q2hpbGRFbGVtZW50KFxuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICBldmVudC50YXJnZXQgYXMgRWxlbWVudFxuICAgICk7XG5cbiAgICAvLyBlYXJseSBleGl0IGlmIG5vIGRpcmVjdCBjaGlsZCBvciBkaXJlY3QgY2hpbGQgaXMgcGxhY2Vob2xkZXJcbiAgICBpZiAoZGlyZWN0Q2hpbGQgPT09IG51bGwgfHwgZGlyZWN0Q2hpbGQgPT09IHRoaXMucGxhY2Vob2xkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwb3NpdGlvblBsYWNlaG9sZGVyQmVmb3JlRGlyZWN0Q2hpbGQgPVxuICAgICAgc2hvdWxkUG9zaXRpb25QbGFjZWhvbGRlckJlZm9yZUVsZW1lbnQoXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBkaXJlY3RDaGlsZCxcbiAgICAgICAgdGhpcy5kbmRIb3Jpem9udGFsXG4gICAgICApO1xuXG4gICAgaWYgKHBvc2l0aW9uUGxhY2Vob2xkZXJCZWZvcmVEaXJlY3RDaGlsZCkge1xuICAgICAgLy8gZG8gaW5zZXJ0IGJlZm9yZSBvbmx5IGlmIG5lY2Vzc2FyeVxuICAgICAgaWYgKGRpcmVjdENoaWxkLnByZXZpb3VzU2libGluZyAhPT0gdGhpcy5wbGFjZWhvbGRlcikge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLmluc2VydEJlZm9yZShcbiAgICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgICB0aGlzLnBsYWNlaG9sZGVyLFxuICAgICAgICAgIGRpcmVjdENoaWxkXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGRvIGluc2VydCBhZnRlciBvbmx5IGlmIG5lY2Vzc2FyeVxuICAgICAgaWYgKGRpcmVjdENoaWxkLm5leHRTaWJsaW5nICE9PSB0aGlzLnBsYWNlaG9sZGVyKSB7XG4gICAgICAgIHRoaXMucmVuZGVyZXIuaW5zZXJ0QmVmb3JlKFxuICAgICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICAgIHRoaXMucGxhY2Vob2xkZXIsXG4gICAgICAgICAgZGlyZWN0Q2hpbGQubmV4dFNpYmxpbmdcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFBsYWNlaG9sZGVySW5kZXgoKTogbnVtYmVyIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5wbGFjZWhvbGRlciA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChlbGVtZW50LmNoaWxkcmVuLCB0aGlzLnBsYWNlaG9sZGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYW51cERyYWdvdmVyU3RhdGUoKSB7XG4gICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyhcbiAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgdGhpcy5kbmREcmFnb3ZlckNsYXNzXG4gICAgKTtcblxuICAgIHRoaXMucmVtb3ZlUGxhY2Vob2xkZXJGcm9tRE9NKCk7XG4gIH1cbn1cbiJdfQ==