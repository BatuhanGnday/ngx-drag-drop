import { Directive, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, inject, Input, NgZone, Output, Renderer2, } from '@angular/core';
import { dndState, endDrag, startDrag } from './dnd-state';
import { calculateDragImageOffset, setDragData, setDragImage, } from './dnd-utils';
import * as i0 from "@angular/core";
class DndDragImageRefDirective {
    dndDraggableDirective = inject(forwardRef(() => DndDraggableDirective));
    elementRef = inject(ElementRef);
    ngOnInit() {
        this.dndDraggableDirective.registerDragImage(this.elementRef);
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndDragImageRefDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.1", type: DndDragImageRefDirective, isStandalone: true, selector: "[dndDragImageRef]", ngImport: i0 });
}
export { DndDragImageRefDirective };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndDragImageRefDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndDragImageRef]', standalone: true }]
        }] });
class DndDraggableDirective {
    dndDraggable;
    dndEffectAllowed = 'copy';
    dndType;
    dndDraggingClass = 'dndDragging';
    dndDraggingSourceClass = 'dndDraggingSource';
    dndDraggableDisabledClass = 'dndDraggableDisabled';
    dndDragImageOffsetFunction = calculateDragImageOffset;
    dndStart = new EventEmitter();
    dndDrag = new EventEmitter();
    dndEnd = new EventEmitter();
    dndMoved = new EventEmitter();
    dndCopied = new EventEmitter();
    dndLinked = new EventEmitter();
    dndCanceled = new EventEmitter();
    draggable = true;
    dndHandle;
    dndDragImageElementRef;
    dragImage;
    isDragStarted = false;
    elementRef = inject(ElementRef);
    renderer = inject(Renderer2);
    ngZone = inject(NgZone);
    set dndDisableIf(value) {
        this.draggable = !value;
        if (this.draggable) {
            this.renderer.removeClass(this.elementRef.nativeElement, this.dndDraggableDisabledClass);
        }
        else {
            this.renderer.addClass(this.elementRef.nativeElement, this.dndDraggableDisabledClass);
        }
    }
    set dndDisableDragIf(value) {
        this.dndDisableIf = value;
    }
    ngAfterViewInit() {
        this.ngZone.runOutsideAngular(() => {
            this.elementRef.nativeElement.addEventListener('drag', this.dragEventHandler);
        });
    }
    ngOnDestroy() {
        this.elementRef.nativeElement.removeEventListener('drag', this.dragEventHandler);
        if (this.isDragStarted) {
            endDrag();
        }
    }
    onDragStart(event) {
        if (!this.draggable) {
            return false;
        }
        // check if there is dnd handle and if the dnd handle was used to start the drag
        if (this.dndHandle != null && event._dndUsingHandle == null) {
            event.stopPropagation();
            return false;
        }
        // initialize global state
        startDrag(event, this.dndEffectAllowed, this.dndType);
        this.isDragStarted = true;
        setDragData(event, { data: this.dndDraggable, type: this.dndType }, dndState.effectAllowed);
        this.dragImage = this.determineDragImage();
        // set dragging css class prior to setDragImage so styles are applied before
        // TODO breaking change: add class to elementRef rather than drag image which could be another element
        this.renderer.addClass(this.dragImage, this.dndDraggingClass);
        // set custom dragimage if present
        // set dragimage if drag is started from dndHandle
        if (this.dndDragImageElementRef != null || event._dndUsingHandle != null) {
            setDragImage(event, this.dragImage, this.dndDragImageOffsetFunction);
        }
        // add dragging source css class on first drag event
        const unregister = this.renderer.listen(this.elementRef.nativeElement, 'drag', () => {
            this.renderer.addClass(this.elementRef.nativeElement, this.dndDraggingSourceClass);
            unregister();
        });
        this.dndStart.emit(event);
        event.stopPropagation();
        setTimeout(() => {
            if (this.isDragStarted) {
                this.renderer.setStyle(this.dragImage, 'pointer-events', 'none');
            }
        }, 100);
        return true;
    }
    onDrag(event) {
        this.dndDrag.emit(event);
    }
    onDragEnd(event) {
        if (!this.draggable || !this.isDragStarted) {
            return;
        }
        // get drop effect from custom stored state as its not reliable across browsers
        const dropEffect = dndState.dropEffect;
        this.renderer.setStyle(this.dragImage, 'pointer-events', 'unset');
        let dropEffectEmitter;
        switch (dropEffect) {
            case 'copy':
                dropEffectEmitter = this.dndCopied;
                break;
            case 'link':
                dropEffectEmitter = this.dndLinked;
                break;
            case 'move':
                dropEffectEmitter = this.dndMoved;
                break;
            default:
                dropEffectEmitter = this.dndCanceled;
                break;
        }
        dropEffectEmitter.emit(event);
        this.dndEnd.emit(event);
        // reset global state
        endDrag();
        this.isDragStarted = false;
        this.renderer.removeClass(this.dragImage, this.dndDraggingClass);
        // IE9 special hammering
        window.setTimeout(() => {
            this.renderer.removeClass(this.elementRef.nativeElement, this.dndDraggingSourceClass);
        }, 0);
        event.stopPropagation();
    }
    registerDragHandle(handle) {
        this.dndHandle = handle;
    }
    registerDragImage(elementRef) {
        this.dndDragImageElementRef = elementRef;
    }
    dragEventHandler = (event) => this.onDrag(event);
    determineDragImage() {
        // evaluate custom drag image existence
        if (typeof this.dndDragImageElementRef !== 'undefined') {
            return this.dndDragImageElementRef.nativeElement;
        }
        else {
            return this.elementRef.nativeElement;
        }
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndDraggableDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.1", type: DndDraggableDirective, isStandalone: true, selector: "[dndDraggable]", inputs: { dndDraggable: "dndDraggable", dndEffectAllowed: "dndEffectAllowed", dndType: "dndType", dndDraggingClass: "dndDraggingClass", dndDraggingSourceClass: "dndDraggingSourceClass", dndDraggableDisabledClass: "dndDraggableDisabledClass", dndDragImageOffsetFunction: "dndDragImageOffsetFunction", dndDisableIf: "dndDisableIf", dndDisableDragIf: "dndDisableDragIf" }, outputs: { dndStart: "dndStart", dndDrag: "dndDrag", dndEnd: "dndEnd", dndMoved: "dndMoved", dndCopied: "dndCopied", dndLinked: "dndLinked", dndCanceled: "dndCanceled" }, host: { listeners: { "dragstart": "onDragStart($event)", "dragend": "onDragEnd($event)" }, properties: { "attr.draggable": "this.draggable" } }, ngImport: i0 });
}
export { DndDraggableDirective };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndDraggableDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndDraggable]', standalone: true }]
        }], propDecorators: { dndDraggable: [{
                type: Input
            }], dndEffectAllowed: [{
                type: Input
            }], dndType: [{
                type: Input
            }], dndDraggingClass: [{
                type: Input
            }], dndDraggingSourceClass: [{
                type: Input
            }], dndDraggableDisabledClass: [{
                type: Input
            }], dndDragImageOffsetFunction: [{
                type: Input
            }], dndStart: [{
                type: Output
            }], dndDrag: [{
                type: Output
            }], dndEnd: [{
                type: Output
            }], dndMoved: [{
                type: Output
            }], dndCopied: [{
                type: Output
            }], dndLinked: [{
                type: Output
            }], dndCanceled: [{
                type: Output
            }], draggable: [{
                type: HostBinding,
                args: ['attr.draggable']
            }], dndDisableIf: [{
                type: Input
            }], dndDisableDragIf: [{
                type: Input
            }], onDragStart: [{
                type: HostListener,
                args: ['dragstart', ['$event']]
            }], onDragEnd: [{
                type: HostListener,
                args: ['dragend', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLWRyYWdnYWJsZS5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9kbmQvc3JjL2xpYi9kbmQtZHJhZ2dhYmxlLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRUwsU0FBUyxFQUNULFVBQVUsRUFDVixZQUFZLEVBQ1osVUFBVSxFQUNWLFdBQVcsRUFDWCxZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFDTCxNQUFNLEVBR04sTUFBTSxFQUNOLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFM0QsT0FBTyxFQUNMLHdCQUF3QixFQUd4QixXQUFXLEVBQ1gsWUFBWSxHQUNiLE1BQU0sYUFBYSxDQUFDOztBQUVyQixNQUNhLHdCQUF3QjtJQUNuQyxxQkFBcUIsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztJQUN4RSxVQUFVLEdBQTRCLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUV6RCxRQUFRO1FBQ04sSUFBSSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNoRSxDQUFDO3VHQU5VLHdCQUF3QjsyRkFBeEIsd0JBQXdCOztTQUF4Qix3QkFBd0I7MkZBQXhCLHdCQUF3QjtrQkFEcEMsU0FBUzttQkFBQyxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFOztBQVU5RCxNQUNhLHFCQUFxQjtJQUN2QixZQUFZLENBQU07SUFDbEIsZ0JBQWdCLEdBQWtCLE1BQU0sQ0FBQztJQUN6QyxPQUFPLENBQVU7SUFDakIsZ0JBQWdCLEdBQUcsYUFBYSxDQUFDO0lBQ2pDLHNCQUFzQixHQUFHLG1CQUFt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QTNCLE1BQU07Z0JBRVksU0FBUztzQkFBM0IsTUFBTTtnQkFFWSxXQUFXO3NCQUE3QixNQUFNO2dCQUd3QixTQUFTO3NCQUF2QyxXQUFXO3VCQUFDLGdCQUFnQjtnQkFXaEIsWUFBWTtzQkFBeEIsS0FBSztnQkFnQk8sZ0JBQWdCO3NCQUE1QixLQUFLO2dCQXVCaUMsV0FBVztzQkFBakQsWUFBWTt1QkFBQyxXQUFXLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBZ0VBLFNBQVM7c0JBQTdDLFlBQVk7dUJBQUMsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQWZ0ZXJWaWV3SW5pdCxcbiAgRGlyZWN0aXZlLFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIGZvcndhcmRSZWYsXG4gIEhvc3RCaW5kaW5nLFxuICBIb3N0TGlzdGVuZXIsXG4gIGluamVjdCxcbiAgSW5wdXQsXG4gIE5nWm9uZSxcbiAgT25EZXN0cm95LFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgUmVuZGVyZXIyLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IERuZEhhbmRsZURpcmVjdGl2ZSB9IGZyb20gJy4vZG5kLWhhbmRsZS5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgZG5kU3RhdGUsIGVuZERyYWcsIHN0YXJ0RHJhZyB9IGZyb20gJy4vZG5kLXN0YXRlJztcbmltcG9ydCB7IEVmZmVjdEFsbG93ZWQgfSBmcm9tICcuL2RuZC10eXBlcyc7XG5pbXBvcnQge1xuICBjYWxjdWxhdGVEcmFnSW1hZ2VPZmZzZXQsXG4gIERuZERyYWdJbWFnZU9mZnNldEZ1bmN0aW9uLFxuICBEbmRFdmVudCxcbiAgc2V0RHJhZ0RhdGEsXG4gIHNldERyYWdJbWFnZSxcbn0gZnJvbSAnLi9kbmQtdXRpbHMnO1xuXG5ARGlyZWN0aXZlKHsgc2VsZWN0b3I6ICdbZG5kRHJhZ0ltYWdlUmVmXScsIHN0YW5kYWxvbmU6IHRydWUgfSlcbmV4cG9ydCBjbGFzcyBEbmREcmFnSW1hZ2VSZWZEaXJlY3RpdmUgaW1wbGVtZW50cyBPbkluaXQge1xuICBkbmREcmFnZ2FibGVEaXJlY3RpdmUgPSBpbmplY3QoZm9yd2FyZFJlZigoKSA9PiBEbmREcmFnZ2FibGVEaXJlY3RpdmUpKTtcbiAgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gPSBpbmplY3QoRWxlbWVudFJlZik7XG5cbiAgbmdPbkluaXQoKSB7XG4gICAgdGhpcy5kbmREcmFnZ2FibGVEaXJlY3RpdmUucmVnaXN0ZXJEcmFnSW1hZ2UodGhpcy5lbGVtZW50UmVmKTtcbiAgfVxufVxuXG5ARGlyZWN0aXZlKHsgc2VsZWN0b3I6ICdbZG5kRHJhZ2dhYmxlXScsIHN0YW5kYWxvbmU6IHRydWUgfSlcbmV4cG9ydCBjbGFzcyBEbmREcmFnZ2FibGVEaXJlY3RpdmUgaW1wbGVtZW50cyBBZnRlclZpZXdJbml0LCBPbkRlc3Ryb3kge1xuICBASW5wdXQoKSBkbmREcmFnZ2FibGU6IGFueTtcbiAgQElucHV0KCkgZG5kRWZmZWN0QWxsb3dlZDogRWZmZWN0QWxsb3dlZCA9ICdjb3B5JztcbiAgQElucHV0KCkgZG5kVHlwZT86IHN0cmluZztcbiAgQElucHV0KCkgZG5kRHJhZ2dpbmdDbGFzcyA9ICdkbmREcmFnZ2luZyc7XG4gIEBJbnB1dCgpIGRuZERyYWdnaW5nU291cmNlQ2xhc3MgPSAnZG5kRHJhZ2dpbmdTb3VyY2UnO1xuICBASW5wdXQoKSBkbmREcmFnZ2FibGVEaXNhYmxlZENsYXNzID0gJ2RuZERyYWdnYWJsZURpc2FibGVkJztcbiAgQElucHV0KCkgZG5kRHJhZ0ltYWdlT2Zmc2V0RnVuY3Rpb246IERuZERyYWdJbWFnZU9mZnNldEZ1bmN0aW9uID1cbiAgICBjYWxjdWxhdGVEcmFnSW1hZ2VPZmZzZXQ7XG5cbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZFN0YXJ0OiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG4gIEBPdXRwdXQoKSByZWFkb25seSBkbmREcmFnOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG4gIEBPdXRwdXQoKSByZWFkb25seSBkbmRFbmQ6IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPERyYWdFdmVudD4oKTtcbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZE1vdmVkOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PiA9XG4gICAgbmV3IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+KCk7XG4gIEBPdXRwdXQoKSByZWFkb25seSBkbmRDb3BpZWQ6IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPERyYWdFdmVudD4oKTtcbiAgQE91dHB1dCgpIHJlYWRvbmx5IGRuZExpbmtlZDogRXZlbnRFbWl0dGVyPERyYWdFdmVudD4gPVxuICAgIG5ldyBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PigpO1xuICBAT3V0cHV0KCkgcmVhZG9ubHkgZG5kQ2FuY2VsZWQ6IEV2ZW50RW1pdHRlcjxEcmFnRXZlbnQ+ID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPERyYWdFdmVudD4oKTtcblxuICBASG9zdEJpbmRpbmcoJ2F0dHIuZHJhZ2dhYmxlJykgZHJhZ2dhYmxlID0gdHJ1ZTtcblxuICBwcml2YXRlIGRuZEhhbmRsZT86IERuZEhhbmRsZURpcmVjdGl2ZTtcbiAgcHJpdmF0ZSBkbmREcmFnSW1hZ2VFbGVtZW50UmVmPzogRWxlbWVudFJlZjtcbiAgcHJpdmF0ZSBkcmFnSW1hZ2U6IEVsZW1lbnQgfCB1bmRlZmluZWQ7XG4gIHByaXZhdGUgaXNEcmFnU3RhcnRlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHByaXZhdGUgZWxlbWVudFJlZjogRWxlbWVudFJlZjxIVE1MRWxlbWVudD4gPSBpbmplY3QoRWxlbWVudFJlZik7XG4gIHByaXZhdGUgcmVuZGVyZXIgPSBpbmplY3QoUmVuZGVyZXIyKTtcbiAgcHJpdmF0ZSBuZ1pvbmUgPSBpbmplY3QoTmdab25lKTtcblxuICBASW5wdXQoKSBzZXQgZG5kRGlzYWJsZUlmKHZhbHVlOiBib29sZWFuKSB7XG4gICAgdGhpcy5kcmFnZ2FibGUgPSAhdmFsdWU7XG5cbiAgICBpZiAodGhpcy5kcmFnZ2FibGUpIHtcbiAgICAgIHRoaXMucmVuZGVyZXIucmVtb3ZlQ2xhc3MoXG4gICAgICAgIHRoaXMuZWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LFxuICAgICAgICB0aGlzLmRuZERyYWdnYWJsZURpc2FibGVkQ2xhc3MsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbmRlcmVyLmFkZENsYXNzKFxuICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgdGhpcy5kbmREcmFnZ2FibGVEaXNhYmxlZENsYXNzLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBASW5wdXQoKSBzZXQgZG5kRGlzYWJsZURyYWdJZih2YWx1ZTogYm9vbGVhbikge1xuICAgIHRoaXMuZG5kRGlzYWJsZUlmID0gdmFsdWU7XG4gIH1cblxuICBuZ0FmdGVyVmlld0luaXQoKTogdm9pZCB7XG4gICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgJ2RyYWcnLFxuICAgICAgICB0aGlzLmRyYWdFdmVudEhhbmRsZXIsXG4gICAgICApO1xuICAgIH0pO1xuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcbiAgICAgICdkcmFnJyxcbiAgICAgIHRoaXMuZHJhZ0V2ZW50SGFuZGxlcixcbiAgICApO1xuICAgIGlmICh0aGlzLmlzRHJhZ1N0YXJ0ZWQpIHtcbiAgICAgIGVuZERyYWcoKTtcbiAgICB9XG4gIH1cblxuICBASG9zdExpc3RlbmVyKCdkcmFnc3RhcnQnLCBbJyRldmVudCddKSBvbkRyYWdTdGFydChldmVudDogRG5kRXZlbnQpOiBib29sZWFuIHtcbiAgICBpZiAoIXRoaXMuZHJhZ2dhYmxlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gY2hlY2sgaWYgdGhlcmUgaXMgZG5kIGhhbmRsZSBhbmQgaWYgdGhlIGRuZCBoYW5kbGUgd2FzIHVzZWQgdG8gc3RhcnQgdGhlIGRyYWdcbiAgICBpZiAodGhpcy5kbmRIYW5kbGUgIT0gbnVsbCAmJiBldmVudC5fZG5kVXNpbmdIYW5kbGUgPT0gbnVsbCkge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gaW5pdGlhbGl6ZSBnbG9iYWwgc3RhdGVcbiAgICBzdGFydERyYWcoZXZlbnQsIHRoaXMuZG5kRWZmZWN0QWxsb3dlZCwgdGhpcy5kbmRUeXBlKTtcblxuICAgIHRoaXMuaXNEcmFnU3RhcnRlZCA9IHRydWU7XG5cbiAgICBzZXREcmFnRGF0YShcbiAgICAgIGV2ZW50LFxuICAgICAgeyBkYXRhOiB0aGlzLmRuZERyYWdnYWJsZSwgdHlwZTogdGhpcy5kbmRUeXBlIH0sXG4gICAgICBkbmRTdGF0ZS5lZmZlY3RBbGxvd2VkISxcbiAgICApO1xuXG4gICAgdGhpcy5kcmFnSW1hZ2UgPSB0aGlzLmRldGVybWluZURyYWdJbWFnZSgpO1xuXG4gICAgLy8gc2V0IGRyYWdnaW5nIGNzcyBjbGFzcyBwcmlvciB0byBzZXREcmFnSW1hZ2Ugc28gc3R5bGVzIGFyZSBhcHBsaWVkIGJlZm9yZVxuICAgIC8vIFRPRE8gYnJlYWtpbmcgY2hhbmdlOiBhZGQgY2xhc3MgdG8gZWxlbWVudFJlZiByYXRoZXIgdGhhbiBkcmFnIGltYWdlIHdoaWNoIGNvdWxkIGJlIGFub3RoZXIgZWxlbWVudFxuICAgIHRoaXMucmVuZGVyZXIuYWRkQ2xhc3ModGhpcy5kcmFnSW1hZ2UsIHRoaXMuZG5kRHJhZ2dpbmdDbGFzcyk7XG5cbiAgICAvLyBzZXQgY3VzdG9tIGRyYWdpbWFnZSBpZiBwcmVzZW50XG4gICAgLy8gc2V0IGRyYWdpbWFnZSBpZiBkcmFnIGlzIHN0YXJ0ZWQgZnJvbSBkbmRIYW5kbGVcbiAgICBpZiAodGhpcy5kbmREcmFnSW1hZ2VFbGVtZW50UmVmICE9IG51bGwgfHwgZXZlbnQuX2RuZFVzaW5nSGFuZGxlICE9IG51bGwpIHtcbiAgICAgIHNldERyYWdJbWFnZShldmVudCwgdGhpcy5kcmFnSW1hZ2UsIHRoaXMuZG5kRHJhZ0ltYWdlT2Zmc2V0RnVuY3Rpb24pO1xuICAgIH1cblxuICAgIC8vIGFkZCBkcmFnZ2luZyBzb3VyY2UgY3NzIGNsYXNzIG9uIGZpcnN0IGRyYWcgZXZlbnRcbiAgICBjb25zdCB1bnJlZ2lzdGVyID0gdGhpcy5yZW5kZXJlci5saXN0ZW4oXG4gICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICdkcmFnJyxcbiAgICAgICgpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJlci5hZGRDbGFzcyhcbiAgICAgICAgICB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudCxcbiAgICAgICAgICB0aGlzLmRuZERyYWdnaW5nU291cmNlQ2xhc3MsXG4gICAgICAgICk7XG4gICAgICAgIHVucmVnaXN0ZXIoKTtcbiAgICAgIH0sXG4gICAgKTtcblxuICAgIHRoaXMuZG5kU3RhcnQuZW1pdChldmVudCk7XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNEcmFnU3RhcnRlZCkge1xuICAgICAgICB0aGlzLnJlbmRlcmVyLnNldFN0eWxlKHRoaXMuZHJhZ0ltYWdlLCAncG9pbnRlci1ldmVudHMnLCAnbm9uZScpO1xuICAgICAgfVxuICAgIH0sIDEwMCk7XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG9uRHJhZyhldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgdGhpcy5kbmREcmFnLmVtaXQoZXZlbnQpO1xuICB9XG5cbiAgQEhvc3RMaXN0ZW5lcignZHJhZ2VuZCcsIFsnJGV2ZW50J10pIG9uRHJhZ0VuZChldmVudDogRHJhZ0V2ZW50KSB7XG4gICAgaWYgKCF0aGlzLmRyYWdnYWJsZSB8fCAhdGhpcy5pc0RyYWdTdGFydGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGdldCBkcm9wIGVmZmVjdCBmcm9tIGN1c3RvbSBzdG9yZWQgc3RhdGUgYXMgaXRzIG5vdCByZWxpYWJsZSBhY3Jvc3MgYnJvd3NlcnNcbiAgICBjb25zdCBkcm9wRWZmZWN0ID0gZG5kU3RhdGUuZHJvcEVmZmVjdDtcblxuICAgIHRoaXMucmVuZGVyZXIuc2V0U3R5bGUodGhpcy5kcmFnSW1hZ2UsICdwb2ludGVyLWV2ZW50cycsICd1bnNldCcpO1xuXG4gICAgbGV0IGRyb3BFZmZlY3RFbWl0dGVyOiBFdmVudEVtaXR0ZXI8RHJhZ0V2ZW50PjtcblxuICAgIHN3aXRjaCAoZHJvcEVmZmVjdCkge1xuICAgICAgY2FzZSAnY29weSc6XG4gICAgICAgIGRyb3BFZmZlY3RFbWl0dGVyID0gdGhpcy5kbmRDb3BpZWQ7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlICdsaW5rJzpcbiAgICAgICAgZHJvcEVmZmVjdEVtaXR0ZXIgPSB0aGlzLmRuZExpbmtlZDtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgJ21vdmUnOlxuICAgICAgICBkcm9wRWZmZWN0RW1pdHRlciA9IHRoaXMuZG5kTW92ZWQ7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBkcm9wRWZmZWN0RW1pdHRlciA9IHRoaXMuZG5kQ2FuY2VsZWQ7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGRyb3BFZmZlY3RFbWl0dGVyLmVtaXQoZXZlbnQpO1xuICAgIHRoaXMuZG5kRW5kLmVtaXQoZXZlbnQpO1xuXG4gICAgLy8gcmVzZXQgZ2xvYmFsIHN0YXRlXG4gICAgZW5kRHJhZygpO1xuXG4gICAgdGhpcy5pc0RyYWdTdGFydGVkID0gZmFsc2U7XG5cbiAgICB0aGlzLnJlbmRlcmVyLnJlbW92ZUNsYXNzKHRoaXMuZHJhZ0ltYWdlLCB0aGlzLmRuZERyYWdnaW5nQ2xhc3MpO1xuXG4gICAgLy8gSUU5IHNwZWNpYWwgaGFtbWVyaW5nXG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdGhpcy5yZW5kZXJlci5yZW1vdmVDbGFzcyhcbiAgICAgICAgdGhpcy5lbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQsXG4gICAgICAgIHRoaXMuZG5kRHJhZ2dpbmdTb3VyY2VDbGFzcyxcbiAgICAgICk7XG4gICAgfSwgMCk7XG5cbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHJlZ2lzdGVyRHJhZ0hhbmRsZShoYW5kbGU6IERuZEhhbmRsZURpcmVjdGl2ZSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuZG5kSGFuZGxlID0gaGFuZGxlO1xuICB9XG5cbiAgcmVnaXN0ZXJEcmFnSW1hZ2UoZWxlbWVudFJlZjogRWxlbWVudFJlZiB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuZG5kRHJhZ0ltYWdlRWxlbWVudFJlZiA9IGVsZW1lbnRSZWY7XG4gIH1cblxuICBwcml2YXRlIHJlYWRvbmx5IGRyYWdFdmVudEhhbmRsZXI6IChldmVudDogRHJhZ0V2ZW50KSA9PiB2b2lkID0gKFxuICAgIGV2ZW50OiBEcmFnRXZlbnQsXG4gICkgPT4gdGhpcy5vbkRyYWcoZXZlbnQpO1xuXG4gIHByaXZhdGUgZGV0ZXJtaW5lRHJhZ0ltYWdlKCk6IEVsZW1lbnQge1xuICAgIC8vIGV2YWx1YXRlIGN1c3RvbSBkcmFnIGltYWdlIGV4aXN0ZW5jZVxuICAgIGlmICh0eXBlb2YgdGhpcy5kbmREcmFnSW1hZ2VFbGVtZW50UmVmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHRoaXMuZG5kRHJhZ0ltYWdlRWxlbWVudFJlZi5uYXRpdmVFbGVtZW50IGFzIEVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRSZWYubmF0aXZlRWxlbWVudDtcbiAgICB9XG4gIH1cbn1cbiJdfQ==