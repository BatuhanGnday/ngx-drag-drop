import { Directive, HostBinding, HostListener, inject, } from '@angular/core';
import { DndDraggableDirective } from './dnd-draggable.directive';
import * as i0 from "@angular/core";
class DndHandleDirective {
    draggable = true;
    dndDraggableDirective = inject(DndDraggableDirective);
    ngOnInit() {
        this.dndDraggableDirective.registerDragHandle(this);
    }
    onDragEvent(event) {
        event._dndUsingHandle = true;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndHandleDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "16.0.1", type: DndHandleDirective, isStandalone: true, selector: "[dndHandle]", host: { listeners: { "dragstart": "onDragEvent($event)", "dragend": "onDragEvent($event)" }, properties: { "attr.draggable": "this.draggable" } }, ngImport: i0 });
}
export { DndHandleDirective };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndHandleDirective, decorators: [{
            type: Directive,
            args: [{ selector: '[dndHandle]', standalone: true }]
        }], propDecorators: { draggable: [{
                type: HostBinding,
                args: ['attr.draggable']
            }], onDragEvent: [{
                type: HostListener,
                args: ['dragstart', ['$event']]
            }, {
                type: HostListener,
                args: ['dragend', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLWhhbmRsZS5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9kbmQvc3JjL2xpYi9kbmQtaGFuZGxlLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULFdBQVcsRUFDWCxZQUFZLEVBQ1osTUFBTSxHQUVQLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDOztBQUdsRSxNQUNhLGtCQUFrQjtJQUNFLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFFaEQscUJBQXFCLEdBQUcsTUFBTSxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFFdEQsUUFBUTtRQUNOLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBSUQsV0FBVyxDQUFDLEtBQWU7UUFDekIsS0FBSyxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7SUFDL0IsQ0FBQzt1R0FiVSxrQkFBa0I7MkZBQWxCLGtCQUFrQjs7U0FBbEIsa0JBQWtCOzJGQUFsQixrQkFBa0I7a0JBRDlCLFNBQVM7bUJBQUMsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7OEJBRXZCLFNBQVM7c0JBQXZDLFdBQVc7dUJBQUMsZ0JBQWdCO2dCQVU3QixXQUFXO3NCQUZWLFlBQVk7dUJBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDOztzQkFDcEMsWUFBWTt1QkFBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBEaXJlY3RpdmUsXG4gIEhvc3RCaW5kaW5nLFxuICBIb3N0TGlzdGVuZXIsXG4gIGluamVjdCxcbiAgT25Jbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IERuZERyYWdnYWJsZURpcmVjdGl2ZSB9IGZyb20gJy4vZG5kLWRyYWdnYWJsZS5kaXJlY3RpdmUnO1xuaW1wb3J0IHsgRG5kRXZlbnQgfSBmcm9tICcuL2RuZC11dGlscyc7XG5cbkBEaXJlY3RpdmUoeyBzZWxlY3RvcjogJ1tkbmRIYW5kbGVdJywgc3RhbmRhbG9uZTogdHJ1ZSB9KVxuZXhwb3J0IGNsYXNzIERuZEhhbmRsZURpcmVjdGl2ZSBpbXBsZW1lbnRzIE9uSW5pdCB7XG4gIEBIb3N0QmluZGluZygnYXR0ci5kcmFnZ2FibGUnKSBkcmFnZ2FibGUgPSB0cnVlO1xuXG4gIGRuZERyYWdnYWJsZURpcmVjdGl2ZSA9IGluamVjdChEbmREcmFnZ2FibGVEaXJlY3RpdmUpO1xuXG4gIG5nT25Jbml0KCkge1xuICAgIHRoaXMuZG5kRHJhZ2dhYmxlRGlyZWN0aXZlLnJlZ2lzdGVyRHJhZ0hhbmRsZSh0aGlzKTtcbiAgfVxuXG4gIEBIb3N0TGlzdGVuZXIoJ2RyYWdzdGFydCcsIFsnJGV2ZW50J10pXG4gIEBIb3N0TGlzdGVuZXIoJ2RyYWdlbmQnLCBbJyRldmVudCddKVxuICBvbkRyYWdFdmVudChldmVudDogRG5kRXZlbnQpIHtcbiAgICBldmVudC5fZG5kVXNpbmdIYW5kbGUgPSB0cnVlO1xuICB9XG59XG4iXX0=