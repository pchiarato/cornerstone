import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges, Inject } from '@angular/core';

import { AbtractView } from './view.abstract';
import { RendererBuilder, RENDERER_BUILDER } from '../renderer/index';

// TODO harmonise names
export enum STATUS {
	valid = 'VALID',
	no_renderer = 'NO_RENDERER',
	rendering_error = 'RENDERING_ERROR',
	invalid_image = 'INVALID_IMAGE'
}

@Component({
	selector: 'img-preview',
	template: '<canvas #canvas></canvas>',
	styles: [`
		canvas{
			background: white;
			vertical-align: top;
		}
	`],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImagePreviewComponent extends AbtractView implements OnChanges {

	@Input() width: number | undefined;
	@Input() height: number | undefined;

	/* fit or none
		default => fit, wrong value => none
	*/
	@Input() scaleStrategy = 'fit';

	constructor(@Inject(RENDERER_BUILDER) rendererBuilder: RendererBuilder) {
		super(rendererBuilder);
	}

	ngOnChanges(changes: SimpleChanges) {
		if (this.renderer === undefined) return;

		let sizeChanged = false;
		if ('image' in changes || 'width' in changes || 'height' in changes || 'scaleStrategy' in changes) {
			const canvas = this.canvas;
			if (this.image != null) {
				let width = this.width || this.image.width;
				let height = this.height || this.image.height;

				if (this.scaleStrategy === 'fit') {
					let ratio = this.image.width / this.image.height;
					if (ratio > 1) {
						height = width / ratio;
					}
					else {
						width = height * ratio;
					}
				}

				if (canvas.width !== width || canvas.height !== height) {
					// always set both canvas value to avoid bugs
					canvas.width = width;
					canvas.height = height;
					sizeChanged = true;
				}
			}
			else
				canvas.width = canvas.height = 0;
		}

		// TODO if there is an error during update and we're using webgl renderer
		// => fallback to 2d renderer
		if ('image' in changes || 'lut' in changes || sizeChanged)
			this.renderer.draw(this.image, this.luts);
	}
}
