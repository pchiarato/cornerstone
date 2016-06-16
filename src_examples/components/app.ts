import { Component, Pipe, PipeTransform, ElementRef, Renderer, ViewChild, OnDestroy} from '@angular/core';

import { ToolbarComponent } from './toolbar';
import { CStoneComponent } from '../../src/CStone.component';

import { image1PixelData, image2PixelData } from '../images';

import { GrayscaleImage } from '../../src/image';
import { CommonLUT } from '../../src/lut';
import { Coord, Transform, scaleToFit } from '../../src/transform';

@Pipe({ name: 'round' })
export class RoundPipe implements PipeTransform {
	transform(input: number, nbDecimal: number) {
		return input.toFixed(nbDecimal);
	}
}

@Component({
	selector: 'the-app',
	styles: [ require('../styles/app.css') ],
	// TODO the oncontextmenu="return false" should be done by cornerstone. using a attribute directive maybe
	template: `
		<cs-toolbar (scale)="scale($event)" (invert)="invert()" (hflip)="hflip()" (vflip)="vflip()" (rotation)="rotation($event)"></cs-toolbar>
		<div #cell class="cell" oncontextmenu="return false"
			(mousemove)="mouseTracking($event)"
			(mousedown)="startMouseTool($event)"
			(mouseleave)="stopMouseTool()"
			(mouseup)="stopMouseTool()"
			(mousewheel)="changeImage($event)">
				<cstone-view [image]="images[currIdx]" [lut]="lut" [transform]="transform"></cstone-view>

				<div class="overlay zoom">x{{transform.scale | round:2}}</div>
				<div class="overlay windowing">WC/WW:{{lut.windowCenter}}/{{lut.windowWidth}}</div>
				<div class="overlay pixel" *ngIf="!!mousePos">({{mousePos.x}},{{mousePos.y}})</div>
		</div>
	`,
	pipes: [ RoundPipe ],
	directives: [
		ToolbarComponent,
		CStoneComponent
	]
})

export class AppComponent implements OnDestroy {
	@ViewChild(CStoneComponent)
	view: CStoneComponent;

	@ViewChild('cell')
	cell: any;

	images = [
		new GrayscaleImage(image1PixelData, {
			minPixelValue: 0,
			maxPixelValue: 257,

			rows: 256,
			columns: 256,
			height: 256,
			width: 256,

			columnPixelSpacing: .8984375,
			rowPixelSpacing: .8984375,
			sizeInBytes: 256 * 256 * 2
		}),
		new GrayscaleImage(image2PixelData, {
			minPixelValue: 0,
			maxPixelValue: 257,

			rows: 256,
			columns: 256,
			height: 256,
			width: 256,

			columnPixelSpacing: .8984375,
			rowPixelSpacing: .8984375,
			sizeInBytes: 256 * 256 * 2
		})
	];

	currIdx = 0;

	lut = new CommonLUT(127, 256, false, 1, 0);
	transform = new Transform( scaleToFit(512, 512, this.images[this.currIdx]) );

	mousePos: Coord;

	mousemoveListener: Function;

	constructor(private renderer: Renderer, private elRef: ElementRef) {}

	scale(v) {
		this.transform = this.transform.setScale(v);
	}

	invert() {
		this.lut = this.lut.setInvert( !this.lut.invert );
	}

	hflip() {
		this.transform = this.transform.doHflip();
	}

	vflip() {
		this.transform = this.transform.doVflip();
	}

	rotation(v) {
		this.transform = this.transform.doRotation( v );
	}

	changeImage(event) {
		if (event.wheelDelta < 0 || event.detail > 0)
			this.currIdx = 1;
		else
			this.currIdx = 0;

		// TODO reset transform ?
	}

	mouseTracking(event) {
		// TODO create helper function
		if (event.target === this.view.canvasRef.nativeElement)
			this.mousePos = {
				x: event.offsetX,
				y: event.offsetY
			};
		else
			delete this.mousePos;
	}

	getMousetoolListener(initialEvent: MouseEvent): (event) => void {
		let	lastX = initialEvent.pageX,
			lastY = initialEvent.pageY;

		let helperFunc = (dofunc) =>
			(event) => {
				let deltaX = event.pageX - lastX,
					deltaY = event.pageY - lastY;

				lastX = event.pageX;
				lastY = event.pageY;

				return dofunc(deltaX, deltaY);
			};

		switch (initialEvent.which) {
			case 1:
				return helperFunc((x, y) => {
					this.lut = this.lut.incrWindowing(x, y);
				});
			case 2:
				return helperFunc((x, y) => {
					this.transform = this.transform.doTranslation(x, y);
				});
			case 3:
				return helperFunc((x, y) => {
					this.transform = this.transform.doScale(y / 100);
				});
		}
	}

	startMouseTool(event: MouseEvent) {
		console.log('cell ', this.cell);

		this.stopMouseTool();
		this.mousemoveListener = this.renderer.listen(this.cell.nativeElement, 'mousemove', this.getMousetoolListener(event));
	}

	stopMouseTool() {
		if (this.mousemoveListener) {
			this.mousemoveListener();
			delete this.mousemoveListener;
		}
	}

	ngOnDestroy() {
		this.stopMouseTool();
	}
}
