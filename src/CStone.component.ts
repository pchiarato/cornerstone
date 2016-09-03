import {
	Component, Input, Output, ChangeDetectionStrategy, ViewChild, ElementRef, EventEmitter,
	AfterViewInit, OnChanges, SimpleChange
} from '@angular/core';

import { Transform } from './transform';
import { LUT, LUTRendering } from './lut';
import { Image, ImageRendering } from './image';

declare var __zone_symbol__requestAnimationFrame: (Function) => number;

@Component({
	selector: 'cstone-view',
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
	template: `
		<canvas #canvas [style.transform]="cssTransform | safesan"></canvas>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})

/* Getting rid of Input() and detaching changeDetection may increase performance, especially for windowing changes
	parent component would have to inject this component and set property directly
	and we would move the onChanges logic on setter.
	since Image and LUT are immutable classes setting a lut or image will cause a draw()

	Problem: Input() is handy for transform: will have to do it ourselves using renderer (not that much trouble)

	conclusion: must be sure it's worth it.
*/
export class CStoneComponent implements OnChanges, AfterViewInit {

	@ViewChild('canvas')
	private canvasRef: ElementRef;
	canvas: HTMLCanvasElement;

	// nativeElement: HTMLElement;

	@Input() transform: Transform;
	@Input() lut: LUT;
	@Input() image: Image;

	@Output() render = new EventEmitter();

	protected isDrawing = false;
	protected needRedraw = false;

	protected renderingFunc: Function;

	protected prevImageRendering: ImageRendering;
	protected prevLutRendering: LUTRendering;

	protected buildRenderingFunc() {
		// don't need to test if this.lut exist because setters prevent it to be undefined when an image is set
		if (this.image) {
			if (!this.lut)
				this.lut = this.image.getDefaultLUT();

			let imgRendering = this.image.renderingBuilder,
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

	get cssTransform() {
		return this.transform ? this.transform.getCSSTransform() : '';
	}

	drawImage() {
		if (this.canvas) {
			if (this.isDrawing)
				this.needRedraw = true;
			else {
				this.isDrawing = true;
				this.draw();
			}
		}
	}

	protected draw() {
		__zone_symbol__requestAnimationFrame( () => {
			let context = this.canvas.getContext('2d');

			if (this.image) {
				// TODO Modifing canvas size clear the canvas so be sure renderer will redraw it (invalidated parameter ?)
				if (this.canvas.width !== this.image.width)
					this.canvas.width = this.image.width;
				if (this.canvas.height !== this.image.height)
					this.canvas.height = this.image.height;

				let imgData = context.createImageData(this.canvas.width, this.canvas.height);

				this.renderingFunc(this.image, this.lut, imgData);

				context.putImageData(imgData, 0, 0);

				// TODO interface of event
				/*
				this.render.emit({
					canvas: this.canvas,
					image: this.image,
					transform: this.transform,
					lut: lut
				});
				*/
			}
			else {
				context.fillStyle = '#000';
				context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			}

			// Rendering loop
			if (this.needRedraw) {
				this.needRedraw = false;
				this.draw();
			}
			else {
				this.isDrawing = false;
			}
		});
	}

	ngOnChanges(changes: { [propName: string]: SimpleChange }) {
		let lut = changes['lut'],
			image = changes['image'];

		if (lut || image) {
			this.buildRenderingFunc();
			this.drawImage();
		}
	}

	ngAfterViewInit() {
		this.canvas = this.canvasRef.nativeElement;

		// drawImage() on first ngOnchanges() has failed because this.canvas was undefined
		this.drawImage();
	}
}
