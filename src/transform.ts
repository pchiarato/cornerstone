import { Coord, Matrix } from './matrix';
import { Image } from './image';

export { Coord, Matrix } from './matrix';

export function scaleToFit(elWidth: number, elHeight: number, imgWidthOrImage: number | Image, imgHeight?: number): number {
	let imgWidth: number;

	if (isNaN(<number>imgWidthOrImage)) {
		imgHeight = (<Image>imgWidthOrImage).rows;
		imgWidth = (<Image>imgWidthOrImage).columns;
	} else
		imgWidth = <number>imgWidthOrImage;

	return Math.min(elWidth / imgWidth, elHeight / imgHeight);
}

export class Transform {

	// TODO named parameter
	constructor(
		private _scale = 1,
		private _translation: Coord = { x: 0, y: 0 },
		private _rotation = 0,
		private _hflip = false,
		private _vflip = false) {

	}

	get scale() {
		return this._scale;
	}

	get translation() {
		return this._translation;
	}

	get rotation() {
		return this._rotation;
	}

	get hflip() {
		return this._hflip;
	}

	get vflip() {
		return this._vflip;
	}


	doScale(scale: number): Transform {
		return this.setScale(this._scale + scale);
	}

	setScale(scale: number): Transform {
		return new Transform( Math.max(0.25, scale), this._translation, this._rotation, this._hflip, this._vflip);
	}

	doTranslation(x: number, y: number): Transform {
		return this.setTranslation({
			x: this._translation.x + x,
			y: this._translation.y + y
		});
	}

	setTranslation(translation: Coord): Transform {
		return new Transform(this._scale, translation, this._rotation, this._hflip, this._vflip);
	}

	doRotation(rotation: number): Transform {
															// mess up with rotation direction when animated
		return this.setRotation((this._rotation + rotation) /*% (2 * Math.PI)*/);
	}

	setRotation(rotation: number): Transform {
		return new Transform(this._scale, this._translation, rotation, this._hflip, this._vflip);
	}

	doHflip(): Transform {
		return this.setHflip(!this._hflip);
	}

	setHflip(hflip: boolean): Transform {
		return new Transform(this._scale, this._translation, this._rotation, hflip, this._vflip);
	}

	doVflip(): Transform {
		return this.setVflip(!this._vflip);
	}

	setVflip(vflip: boolean): Transform {
		return new Transform(this._scale, this._translation, this._rotation, this._hflip, vflip);
	}


	// TODO cache matrix and/or transform string ?
	getMatrix(scale?: number): Matrix {

		let matrix = new Matrix();

		// Apply the rotation before scaling for non square pixels
		let angle = this._rotation;
		if (angle !== 0) {
			matrix.rotate(angle);
		}

		// apply the scale
		let widthScale = this._scale;
		let heightScale = this._scale;
		// TODO
		/*
		if (enabledElement.image.rowPixelSpacing < enabledElement.image.columnPixelSpacing) {
			widthScale = widthScale * (enabledElement.image.columnPixelSpacing / enabledElement.image.rowPixelSpacing);
		}
		else if (enabledElement.image.columnPixelSpacing < enabledElement.image.rowPixelSpacing) {
			heightScale = heightScale * (enabledElement.image.rowPixelSpacing / enabledElement.image.columnPixelSpacing);
		}
		*/
		matrix.scale(widthScale, heightScale);

		// unrotate to so we can translate unrotated
		if (angle !== 0) {
			matrix.rotate(-angle);
		}

		// apply the pan offset
		matrix.translate(this._translation.x, this._translation.y);

		// rotate again so we can apply general scale
		if (angle !== 0) {
			matrix.rotate(angle);
		}

		scale = scale || 1;
		matrix.scale((this._hflip ? -1 : 1) * scale, (this._vflip ? -1 : 1) * scale);

		// translate the origin back to the corner of the image so the event handlers can draw in image coordinate system
		// transform.translate(-enabledElement.image.width / 2 , -enabledElement.image.height/ 2);
		return matrix;
	}

	getCSSTransform(): string {

		let transform = 'translate(' +
			(this._translation.x === 0 ? '-50%,' : 'calc(' + this._translation.x + 'px - 50%),') +
			(this._translation.y === 0 ? '-50%)' : 'calc(' + this._translation.y + 'px - 50%))');

		// We dont need to translate to center to apply scale/rotation thanks to transform-origin

		transform += 'rotate(' + this._rotation + 'rad)';

		// use rotation for flip so we can animate it
		transform += 'rotateY(' + (this._hflip ? Math.PI : 0) + 'rad)';
		transform += 'rotateX(' + (this._vflip ? Math.PI : 0) + 'rad)';

		// scale
		let widthScale = this._scale;
		let heightScale = this._scale;
		/* TODO
		if (image) {
			if (image.rowPixelSpacing < image.columnPixelSpacing)
				widthScale = widthScale * (image.columnPixelSpacing / image.rowPixelSpacing);
			else if (image.columnPixelSpacing < image.rowPixelSpacing)
				heightScale = heightScale * (image.rowPixelSpacing / image.columnPixelSpacing);
		}
		*/

		transform += 'scale(' + widthScale + ',' + heightScale + ')';

		return transform;

		/*
		$(enabledElement.element).trigger("CornerstoneTransformUpdated", {
			viewport : enabledElement.viewport,
			transform: transform,
			element : enabledElement.element,
			image : enabledElement.image,
			enabledElement : enabledElement,
			canvasContext: enabledElement.canvas.getContext('2d')
		});
		*/
	}
}
