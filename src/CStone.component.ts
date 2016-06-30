import {
	Component, Input, Output, ChangeDetectionStrategy, ViewChild, ElementRef, EventEmitter,
	OnInit, AfterViewInit, OnChanges, SimpleChange
} from '@angular/core';

import { SafeSanitization } from './pipes/SafeSanitization';

import { Transform } from './transform';
import { LUT, IdentityLUT } from './lut';
import { Image } from './image';

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
		<canvas #canvas [style.transform]="_transform.getCSSTransform() | safesan"></canvas>
	`,
	pipes: [ SafeSanitization ],
	changeDetection: ChangeDetectionStrategy.OnPush
})

/* Getting rid of Input() and detaching changeDetection may increase performance, especially for windowing changes
	parent component would have to inject this component and set property directly
	and we would move the onChanges logic on setter.
	since Image and LUT are immutable classes setting a lut or image will cause a draw()

	Problem: Input() is handy for transform: will have to do it ourselves using renderer (not that much trouble)

	conclusion: must be sure it's worth it.
*/
export class CStoneComponent implements OnInit, OnChanges, AfterViewInit {

	@ViewChild('canvas')
	private canvasRef: ElementRef;
	canvas: HTMLCanvasElement;

	// nativeElement: HTMLElement;

	protected _lut: LUT = new IdentityLUT();
	protected _transform = new Transform();
	protected renderingFunc: Function;

	@Input() set transform(transform: Transform) {
		this._transform = transform || new Transform();
	}
	get transform() {
		return this._transform;
	}

	@Input() set lut(lut: LUT) {
		this._lut = lut || new IdentityLUT();
	};
	get lut() {
		return this._lut;
	}

	@Input() image: Image;

	@Output() render = new EventEmitter();

	private isDrawing = false;
	private needRedraw = false;

	constructor() {}

	private buildRenderingFunc() {
		this.renderingFunc = new Function('img', 'lut', 'imgData',
			this.image.renderingBuilder.getInitStatements() +
			this.lut.renderingBuilder.getInitStatements() +
			this.image.renderingBuilder.getLoopStatements( this.lut.renderingBuilder.getApplyStatements() )
		);
	}

	drawImage() {
		if (this.isDrawing)
			this.needRedraw = true;
		else {
			this.isDrawing = true;
			this.draw();
		}
	}

	private draw() {
		__zone_symbol__requestAnimationFrame( () => {
			let context = this.canvas.getContext('2d');

			if (this.image) {

				// TODO Modifing canvas size clear the canvas so be sure renderer will redraw it (invalidated parameter ?)
				if (this.canvas.width !== this.image.width)
					this.canvas.width = this.image.width;
				if (this.canvas.height !== this.image.height)
					this.canvas.height = this.image.height;

				let imgData = context.createImageData(this.canvas.width, this.canvas.height);

				this.renderingFunc(this.image, this._lut, imgData.data);

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

	ngOnChanges(changes: { [propName: string]: SimpleChange }) {}

	ngOnInit() {
		this.ngOnChanges = (changes: { [propName: string]: SimpleChange }) => {
			let lut = changes['lut'],
				image = changes['image'];

			if (lut || image) {
				if ((
						// image has changed
						image &&
						// we have set an actual image (not null)
						image.currentValue &&
						// we  didn't had an image previously set or renderingBuilder differ from previous image
						(!image.previousValue || image.currentValue.renderingBuilder !== image.previousValue.rendereringBuilder )
					) ||
					(
						// lut has changed
						lut &&
						// 	no need to test if lut.currentValue nor lut.previousValue are not null because setter prevents it

						// renderingBuilder differ from previous
						lut.currentValue.renderingBuilder !== lut.previousValue.renderingBuilder
					))
						this.buildRenderingFunc();
				this.drawImage();
			}
		};
	}

	ngAfterViewInit() {
		this.canvas = this.canvasRef.nativeElement;

		this.drawImage();
	}
}
