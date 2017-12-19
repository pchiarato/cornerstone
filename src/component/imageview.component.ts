import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, Renderer2, SimpleChanges } from '@angular/core';

import { distinctUntilChanged } from 'rxjs/operator/distinctUntilChanged';

import { Image } from '../image';
import { InvalidImageError, RenderersManager } from '../renderer/manager';
import { toCSSString, Transform } from '../transform';
import { AbtractView } from './view.abstract';

// TODO harmonise names
export enum STATUS {
    valid = 'VALID',
    no_renderer = 'NO_RENDERER',
    rendering_error = 'RENDERING_ERROR',
    invalid_image = 'INVALID_IMAGE'
}

// TODO directive on canvas ?
@Component({
    selector: 'img-view',
    template: '<canvas #canvas></canvas>',
    styles: [`
		canvas{
			background: white;

			position: absolute;
			top: 50%;
			left: 50%;

			transform: translate(-50%,-50%);

			-webkit-touch-callout: none;
			-webkit-user-select: none;
			-khtml-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;
		}
	`],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageViewComponent extends AbtractView implements OnChanges, OnDestroy {

    @Input() set transform(tr: Transform){
        // using renderer instead of binding to avoid sanitization toCSSString() already does sanitization
        this.domRenderer.setStyle(this.canvas, 'transform', toCSSString(tr));
    };

    private statusSubject = new EventEmitter<STATUS>();
    @Output() status = distinctUntilChanged.call(this.statusSubject);

    protected handleRendererStatus = (v: Error | Image) => {
        this.statusSubject.next(
            v instanceof Error ?
                (v instanceof InvalidImageError ? STATUS.invalid_image : STATUS.rendering_error)
            : STATUS.valid
        );
    }

    constructor(private domRenderer: Renderer2, rendering: RenderersManager) {
        super(rendering);
    }

    ngOnChanges(changes: SimpleChanges) {
        const renderer = this.getRenderer(true);
        if (renderer === undefined) {
            this.statusSubject.next(STATUS.no_renderer);
            return;
        }

        if ('image' in changes ) {
            if (this.image != null) {
                this.canvas.width = this.image.width;
                this.canvas.height = this.image.height;
            }
            else
                this.canvas.width = this.canvas.height = 0;
        }

        // TODO if there is an error during update and we're using webgl renderer
        // => fallback to 2d renderer
        if ('image' in changes || 'lut' in changes)
            renderer.draw(this.image, this.luts);
    }
}
