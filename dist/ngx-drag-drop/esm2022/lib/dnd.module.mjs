import { NgModule } from '@angular/core';
import { DndDraggableDirective, DndDragImageRefDirective, } from './dnd-draggable.directive';
import { DndDropzoneDirective, DndPlaceholderRefDirective, } from './dnd-dropzone.directive';
import { DndHandleDirective } from './dnd-handle.directive';
import * as i0 from "@angular/core";
class DndModule {
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
    static ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "16.0.1", ngImport: i0, type: DndModule, imports: [DndDragImageRefDirective,
            DndDropzoneDirective,
            DndHandleDirective,
            DndPlaceholderRefDirective,
            DndDraggableDirective], exports: [DndDraggableDirective,
            DndDropzoneDirective,
            DndHandleDirective,
            DndPlaceholderRefDirective,
            DndDragImageRefDirective] });
    static ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndModule });
}
export { DndModule };
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "16.0.1", ngImport: i0, type: DndModule, decorators: [{
            type: NgModule,
            args: [{
                    exports: [
                        DndDraggableDirective,
                        DndDropzoneDirective,
                        DndHandleDirective,
                        DndPlaceholderRefDirective,
                        DndDragImageRefDirective,
                    ],
                    imports: [
                        DndDragImageRefDirective,
                        DndDropzoneDirective,
                        DndHandleDirective,
                        DndPlaceholderRefDirective,
                        DndDraggableDirective,
                    ],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG5kLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3Byb2plY3RzL2RuZC9zcmMvbGliL2RuZC5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUN6QyxPQUFPLEVBQ0wscUJBQXFCLEVBQ3JCLHdCQUF3QixHQUN6QixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIsMEJBQTBCLEdBQzNCLE1BQU0sMEJBQTBCLENBQUM7QUFDbEMsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sd0JBQXdCLENBQUM7O0FBRTVELE1BZ0JhLFNBQVM7dUdBQVQsU0FBUzt3R0FBVCxTQUFTLFlBUGxCLHdCQUF3QjtZQUN4QixvQkFBb0I7WUFDcEIsa0JBQWtCO1lBQ2xCLDBCQUEwQjtZQUMxQixxQkFBcUIsYUFYckIscUJBQXFCO1lBQ3JCLG9CQUFvQjtZQUNwQixrQkFBa0I7WUFDbEIsMEJBQTBCO1lBQzFCLHdCQUF3Qjt3R0FVZixTQUFTOztTQUFULFNBQVM7MkZBQVQsU0FBUztrQkFoQnJCLFFBQVE7bUJBQUM7b0JBQ1IsT0FBTyxFQUFFO3dCQUNQLHFCQUFxQjt3QkFDckIsb0JBQW9CO3dCQUNwQixrQkFBa0I7d0JBQ2xCLDBCQUEwQjt3QkFDMUIsd0JBQXdCO3FCQUN6QjtvQkFDRCxPQUFPLEVBQUU7d0JBQ1Asd0JBQXdCO3dCQUN4QixvQkFBb0I7d0JBQ3BCLGtCQUFrQjt3QkFDbEIsMEJBQTBCO3dCQUMxQixxQkFBcUI7cUJBQ3RCO2lCQUNGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmdNb2R1bGUgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7XG4gIERuZERyYWdnYWJsZURpcmVjdGl2ZSxcbiAgRG5kRHJhZ0ltYWdlUmVmRGlyZWN0aXZlLFxufSBmcm9tICcuL2RuZC1kcmFnZ2FibGUuZGlyZWN0aXZlJztcbmltcG9ydCB7XG4gIERuZERyb3B6b25lRGlyZWN0aXZlLFxuICBEbmRQbGFjZWhvbGRlclJlZkRpcmVjdGl2ZSxcbn0gZnJvbSAnLi9kbmQtZHJvcHpvbmUuZGlyZWN0aXZlJztcbmltcG9ydCB7IERuZEhhbmRsZURpcmVjdGl2ZSB9IGZyb20gJy4vZG5kLWhhbmRsZS5kaXJlY3RpdmUnO1xuXG5ATmdNb2R1bGUoe1xuICBleHBvcnRzOiBbXG4gICAgRG5kRHJhZ2dhYmxlRGlyZWN0aXZlLFxuICAgIERuZERyb3B6b25lRGlyZWN0aXZlLFxuICAgIERuZEhhbmRsZURpcmVjdGl2ZSxcbiAgICBEbmRQbGFjZWhvbGRlclJlZkRpcmVjdGl2ZSxcbiAgICBEbmREcmFnSW1hZ2VSZWZEaXJlY3RpdmUsXG4gIF0sXG4gIGltcG9ydHM6IFtcbiAgICBEbmREcmFnSW1hZ2VSZWZEaXJlY3RpdmUsXG4gICAgRG5kRHJvcHpvbmVEaXJlY3RpdmUsXG4gICAgRG5kSGFuZGxlRGlyZWN0aXZlLFxuICAgIERuZFBsYWNlaG9sZGVyUmVmRGlyZWN0aXZlLFxuICAgIERuZERyYWdnYWJsZURpcmVjdGl2ZSxcbiAgXSxcbn0pXG5leHBvcnQgY2xhc3MgRG5kTW9kdWxlIHt9XG4iXX0=