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
		<canvas #canvas [style.transform]="transform.getCSSTransform() | safesan"></canvas>
	`,
	pipes: [ SafeSanitization ],
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class CStoneComponent implements OnInit, OnChanges, AfterViewInit {
	@ViewChild('canvas')
	canvasRef: ElementRef;

	// nativeElement: HTMLElement;

	@Input() transform: Transform = new Transform();
	@Input() lut: LUT = new IdentityLUT();
	@Input() image: Image;

	@Output() render = new EventEmitter();

	/*
	constructor(elRef: ElementRef){
		this.nativeElement = elRef.nativeElement;
	}
	*/

	drawImage() {
		if (this.image) {
			// only if different ?
			this.canvasRef.nativeElement.width = this.image.width;
			this.canvasRef.nativeElement.height = this.image.height;

			this.image.render(this.canvasRef.nativeElement, this.lut);

			// TODO interface of event
			this.render.emit({
				canvas: this.canvasRef.nativeElement,
				image: this.image,
				transform: this.transform,
				lut: this.lut
			});
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
		this.drawImage();
	}
}
