import {
	Component, Input, Output, ChangeDetectionStrategy, ViewChild, ElementRef, EventEmitter,
	OnInit, AfterViewInit, OnChanges, SimpleChange
} from '@angular/core';

import { SafeSanitization } from './pipes/SafeSanitization';

import { Transform } from './transform';
import { LUT, IdentityLUT } from './lut';
import { Image } from './image';

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
		<canvas #canvas [style.transform]="getCSSTransform() | safesan"></canvas>
	`,
	pipes: [ SafeSanitization ],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class CStoneComponent implements OnInit, OnChanges, AfterViewInit {
	@ViewChild('canvas')
	private canvasRef: ElementRef;
	canvas: HTMLCanvasElement;

	// nativeElement: HTMLElement;

	@Input() transform: Transform = new Transform();
	@Input() lut: LUT;
	@Input() image: Image;

	@Output() render = new EventEmitter();

	/*
	constructor(elRef: ElementRef){
		this.nativeElement = elRef.nativeElement;
	}
	*/

	getCSSTransform() {
		if (this.transform)
			return this.transform.getCSSTransform();
	}

	drawImage() {
		if (this.image) {
			// only if different ?
			this.canvas.width = this.image.width;
			this.canvas.height = this.image.height;

			let lut = this.lut || IdentityLUT;

			this.image.render(this.canvas, lut);

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
			let context = this.canvas.getContext('2d');

			context.fillStyle = '#000';
			context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}

	ngOnChanges(changes: { [propName: string]: SimpleChange }) { }

	ngOnInit() {
		this.ngOnChanges = (changes: { [propName: string]: SimpleChange }) => {
			if (changes['lut'] || changes['image'])
				this.drawImage();
		};
	}

	ngAfterViewInit() {
		this.canvas = this.canvasRef.nativeElement;

		this.drawImage();
	}
}
