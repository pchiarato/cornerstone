import {
	Component, Input, ChangeDetectionStrategy, ViewChild, ElementRef,
	AfterViewInit, OnChanges, SimpleChange
} from '@angular/core';

import { LUT, LUTRendering } from './lut';
import { Image, ImageRendering } from './image';
import { scaleToFit } from './transform';

declare var __zone_symbol__requestAnimationFrame: (Function) => number;

@Component({
	selector: 'cstone-preview',
	styles: [`
		canvas{
			background: white;
		}
	`],
	template: `
		<canvas #canvas></canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})

// TODO create a base class for this and CStoneComponent
export class PreviewComponent implements OnChanges, AfterViewInit {

	@Input() maxWidth =  256;
	@Input() maxHeight = 256;

	@Input() image: Image;
	@Input() lut: LUT;

	@ViewChild('canvas')
	private canvasRef: ElementRef;

	protected renderingFunc: Function;

	protected prevImageRendering: ImageRendering;
	protected prevLutRendering: LUTRendering;

	protected buildRenderingFunc() {
		// don't need to test if this.lut exist because setters prevent it to be undefined when an image is set
		if (this.image) {
			if (!this.lut)
				this.lut = this.image.getDefaultLUT();

			let imgRendering = this.image.previewBuilder,
				lutRendering = this.lut.renderingBuilder;

			if (imgRendering !== this.prevImageRendering || lutRendering !== this.prevLutRendering) {
				this.renderingFunc = new Function('img', 'lut', 'imgData',
					imgRendering.getInitStatements() +
					lutRendering.getInitStatements() +
					imgRendering.getLoopStatements( lutRendering.getApplyStatements() )
				);

				this.prevImageRendering = imgRendering;
				this.prevLutRendering = lutRendering;
			}
		}
	}

	ngOnChanges(changes: { [propName: string]: SimpleChange }) {
		if (changes['image'] || changes['lut'])
			this.buildRenderingFunc();

		this.draw();
	}

	ngAfterViewInit() {
		this.draw();
	}

	draw() {
		if (this.canvasRef.nativeElement) {
			let canvas = this.canvasRef.nativeElement,
				context = canvas.getContext('2d');

			if (this.image) {
				let scale = scaleToFit(this.maxWidth, this.maxHeight, this.image),
					width =  Math.floor(this.image.width  * scale),
					height = Math.floor(this.image.height * scale);

				canvas.width = width;
				canvas.height = height;

				let imgData = context.createImageData(width, height);
				this.renderingFunc(this.image, this.lut, imgData);
				context.putImageData(imgData, 0, 0);

			}
			else {
				canvas.width = this.maxWidth;
				canvas.height = this.maxHeight;

				context.fillStyle = '#000';
				context.fillRect(0, 0, canvas.width, canvas.height);
			}
		}
	}

}
