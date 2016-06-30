// TODO do otherwise using decorators or something...
/**
 * To create the rendering function, allowing flexibility and performance.
 * Accessible variable are :
 * 	- img : Image
 * 	- lut : LUT (this)
 * 	- imgData: Uint8clampedArray
 *
 * /*\ This must be js code not ts => DONT USE let it slows function execution A LOT
 */
export interface LUTRendering {
	getInitStatements: () => string;

	/* Accessible variable v (which should be transformed after this function) */
	getApplyStatements: () => string;
}


// TODO separate into 2 interface : ModalityLUT and VOILUT ?
// 	map is only used for ModalityLUT
// 	invert and renderingBuilder are only used by VOILUT
export interface LUT {

	renderingBuilder: LUTRendering;

	// TODO replace any with LUT
	toggleInvert(): any;
	setInvert(invert: boolean): any;

	map(input: number[]): number[];
}

export abstract class AbstractLUT {

	/*readonly*/ invert: boolean;

	constructor(invert = false) {
		this.invert = invert;
	}

	toggleInvert() {
		return this.setInvert(!this.invert);
	}
	abstract setInvert(invert: boolean);
}

export class IdentityLUT extends AbstractLUT implements LUT {
	static IdentityRenderingBuilder: LUTRendering = {
		getInitStatements: function(): string {
			return '';
		},

		getApplyStatements: function(): string {
			return this.invert ? 'v = 255 - v;' : '';
		}
	};

	get renderingBuilder() {
		return IdentityLUT.IdentityRenderingBuilder;
	}

	constructor(invert?) {
		super(invert);
	}

	setInvert(invert: boolean): IdentityLUT {
		return new IdentityLUT(invert);
	}

	map(input: number[]): number[] {
		return input.slice();
	}
};

export class LinearLUT extends AbstractLUT implements LUT {

	static LinearLUTRenderingBuilder: LUTRendering = {
		getInitStatements: function(): string {
			return `
				var slope = lut.slope,
					intercept = lut.intercept;
			`;
		},

		getApplyStatements: function(): string {
			return 'v = v * slope + intercept;';
		}
	};

	get renderingBuilder() {
		return LinearLUT.LinearLUTRenderingBuilder;
	}

	/*readonly*/ slope: number;
	/*readonly*/ intercept: number;

	constructor(slope: number, intercept: number, invert?) {
		super(invert);

		this.slope = (invert ? -1 : 1) * slope;
		this.intercept = intercept;
	}

	setInvert(invert: boolean): LinearLUT {
		return new LinearLUT(this.slope, this.intercept, invert);
	}

	map(input: number[]): number[] {
		let slope = this.slope,
			intercept = this.intercept,
			ret = [];

		for (let i = 0, l = input.length; i < l; i++)
			ret[i] = input[i] * slope + intercept;

		return ret;
	}
}

/* TODO
export abstract class ArrayLUT extends AbstractLUT {

	static ArrayRenderingBuilder: LUTRendering = {
		getInitStatements: function(): string {
			return `
				var min = lut.min,
					max = lut.max,

					minV = lut.invert ? 255 : 0,
					maxV = lut.invert ? 0 : 255,

					lutArr = lut.buffer,
					offset = lut.bufferOffset;
			`;
		},

		getApplyStatements: function(): string {
			//TODO
		}
	};

	get renderingBuilder() {
		return ArrayLUT.ArrayRenderingBuilder;
	}

	protected abstract buffer: Uint8ClampedArray;
	protected abstract bufferOffset: number;
	protected abstract min: number;
	protected abstract max: number;

	map(input: number[]): number[] {
		let min = this.min,
			max = this.max,

			minV = this.invert ? 255 : 0,
			maxV = this.invert ? 0 : 255,

			lut = this.buffer,
			offset = this.bufferOffset,

			i = 0,
			length = input.length,

			ret = [];

		while (i < length) {
			let v = input[i++];

			if ( v <= min)
				ret[i++] = minV;
			else if (v > max)
				ret[i++] = maxV;
			else
				ret[i++] = lut[v + offset];
		}

		return ret;
	}
}
export class VoiLUT extends ArrayLUT implements LUT {

	constructor() {
		throw 'VoiLUT is not implemented yet';
	}

	setInvert() {};

	getArray() {};
}
*/

export class WindowingLUT extends LinearLUT implements LUT {
	/*readonly*/ windowWidth: number;
	/*readonly*/ windowCenter: number;

	protected buffer: Uint8ClampedArray;
	protected bufferOffset: number;

	constructor(
		windowCenter: number,
		windowWidth: number,
		invert?) {

		let _windowWidth = Math.max(0.000001, windowWidth);
		// invert must be inverted because we use opposite of luminance (higher = darker)
		let realInvert = !invert;

		// LinearLUT apply invert with (0,0) as center but we want to invert with windowCenter as center
		// This means invert will be correctly applied to slope but for intercept we must do it ourself here
		super(
			255 / (_windowWidth - 1),  // slope
			255 * windowCenter / _windowWidth + (realInvert ? 1 : -1) * 127.5, // intercept
			realInvert
		);

		this.windowCenter = windowCenter;
		this.windowWidth = _windowWidth;
	}

	/*
	private buildBuffer() {
		let ww = this.windowWidth,
			wc = this.windowCenter,

			bufferSize = ww,
			buffer = this.buffer = new Uint8ClampedArray(bufferSize),

			coef = (this.invert ? -1 : 1) * 255 / ww,
			i = 0;

		while ( i < bufferSize)
			buffer[i++] = i * coef;

		this.bufferOffset = -(wc - (ww / 2));
	}

	protected get min() {
		return this.windowCenter - this.windowWidth / 2;
	}

	protected get max() {
		return this.windowCenter + this.windowWidth / 2;
	}
	*/

	setInvert(invert: boolean): WindowingLUT {
		return new WindowingLUT(this.windowCenter, this.windowWidth, invert);
	}

	incrWindowCenter(deltawWindowCenter: number): WindowingLUT {
		return this.setWindowCenter(this.windowCenter + deltawWindowCenter);
	}

	incrWindowWidth(deltaWindowWidth: number): WindowingLUT {
		return this.setWindowWidth(this.windowWidth + deltaWindowWidth);
	}

	incrWindowing(deltaWindowCenter: number, deltaWindowWidth: number) {
		return this.setWindowing(this.windowCenter + deltaWindowCenter, this.windowWidth + deltaWindowWidth);
	}

	setWindowCenter(windowCenter: number): WindowingLUT {
		return this.setWindowing(windowCenter, this.windowWidth);
	}

	setWindowWidth(windowWidth: number): WindowingLUT {
		return this.setWindowing(this.windowCenter, windowWidth);
	}

	setWindowing(windowCenter: number, windowWidth: number): WindowingLUT {
		return new WindowingLUT(windowCenter, windowWidth, !this.invert);
	}
}
