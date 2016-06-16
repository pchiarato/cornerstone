export interface LUT {
	apply(v: number): number;
}

export class ComposeLUT implements LUT {
	luts: LUT[];

	constructor(...luts: LUT[]) {
		this.luts = luts;
	}

	apply(v: number): number {
		let r = v;
		for (let lut of this.luts)
			r = lut.apply(v);

		return r;
	}

	// TODO change luts
}

export class IdentityLUT implements LUT {
	apply(v) {
		return v;
	}
}

export class PixInvertLUT implements LUT {
	apply(v) {
		return 255 - v;
	}
}

export class LinearLUT implements LUT {

	constructor(private slope: number, private intercept: number) {}

	apply(v) {
		return v * this.slope + this.intercept;
	}
}

export class WindowingLUT implements LUT {
	min: number;
	max: number;

	private windowWidth: number;

	constructor(private windowCenter: number, windowWidth: number) {
		this.windowWidth = Math.max(0.000001, windowWidth);

		this.min = windowCenter - this.windowWidth / 2;
		this.max = this.min + this.windowWidth;
	}

	apply(v) {
		if (v <= this.min)
			return 0;

		if (v >= this.max)
			return 255;

		return ((v - this.windowCenter) / this.windowWidth + 0.5) * 255.0;
	}
}

export class ModalityLUT implements LUT {
	apply(v: number): number {
		throw 'ModalityLUT is not implemented yet';
	}
}

export class VoiLUT implements LUT {
	apply(v: number): number {
		throw 'VoiLUT is not implemented yet';
	}
}


/**
 * Easier to setup and slighty better performance than ComposeLUT for common cases
 */
export class CommonLUT implements LUT {
	a: number;
	b: number;

	private _invert: boolean;
	private _windowWidth: number;

	constructor(
		private _windowCenter: number,
		windowWidth: number,
		invert = false,
		public slope = 1,
		public intercept = 0) {

		this._windowWidth = Math.max(0.000001, windowWidth);
		this._invert = !invert;

		this.computeAB();
	}

	get windowCenter(){
		return this._windowCenter;
	}

	get windowWidth() {
		return this._windowWidth;
	}

	get invert(){
		return !this._invert;
	}

	private computeAB() {
		this.a = 255 * this.slope / this._windowWidth * (this._invert ? -1 : 1);
		this.b = 255 * (this.intercept - this._windowCenter) / this._windowWidth + 127.5 + (this._invert ? 255 : 0);
	}

	apply(v) {
		return v * this.a + this.b;
	}

	doInvert(): CommonLUT {
		// looks like it should be !this._invert but it's not because we'll invert it on the constructor
		return this.setInvert(this._invert);
	}

	setInvert(invert: boolean): CommonLUT {
		return new CommonLUT(this._windowCenter, this._windowWidth, invert, this.slope, this.intercept);
	}

	incrWindowCenter(deltawWindowCenter: number): CommonLUT {
		return this.setWindowing(this._windowCenter + deltawWindowCenter, this._windowWidth);
	}

	incrWindowWidth(deltaWindowWidth: number): CommonLUT {
		return this.setWindowing(this._windowCenter, this._windowWidth + deltaWindowWidth);
	}

	incrWindowing(deltaWindowCenter: number, deltaWindowWidth: number) {
		return this.setWindowing(this._windowCenter + deltaWindowCenter, this._windowWidth + deltaWindowWidth);
	}

	setWindowing(windowCenter: number, windowWidth: number): CommonLUT {
		console.log('setWindowing ', windowCenter, windowWidth);

		return new CommonLUT(windowCenter, windowWidth, !this._invert, this.slope, this.intercept);
	}
}

export interface LutMetadata {
	slope?: number;
	intercept?: number;

	windowCenter?: number;
	windowWidth?: number;

	modalityLUT?: LUT;
	voiLUT?: LUT;

	invert: boolean;
}

/**
 * [getLut description]
 * @param  {LutMetadata} opt should contains at least voiLUT or couple windowCenter/windowWidth.
 * @return {LUT}             [description]
 */
export function getLut(opt: LutMetadata): LUT {
	let hasSlopeIntercept = opt.slope === undefined || opt.intercept === undefined || (opt.slope === 1 && opt.intercept === 0);

	// TODO
	if (opt.modalityLUT || opt.voiLUT) {
		let modalityLut = opt.modalityLUT || (hasSlopeIntercept ? new IdentityLUT() : new LinearLUT(opt.slope, opt.intercept)),
			voiLut = opt.voiLUT || new WindowingLUT(opt.windowCenter, opt.windowWidth);

		// TODO we won't be able to easily invert
		return new ComposeLUT(modalityLut, voiLut, opt.invert ? undefined : new PixInvertLUT());
	}

	return new CommonLUT(opt.windowCenter, opt.windowWidth, opt.invert, opt.slope, opt.intercept);
}
