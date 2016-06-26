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

export let IdentityLUT: LUT = {
	apply(v) {
		return v;
	}
};

export let PixInvertLUT: LUT = {
	apply(v) {
		return 255 - v;
	}
};

export class LinearLUT implements LUT {

	constructor(private slope: number, private intercept: number) {}

	apply(v) {
		return v * this.slope + this.intercept;
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
export class WindowingLUT implements LUT {
	a: number;
	b: number;

	private readonly invert: boolean;
	private readonly windowWidth: number;
	private readonly windowCenter: number;

	constructor(
		windowCenter: number,
		windowWidth: number,
		invert = false) {

		this.windowCenter = windowCenter;
		this.windowWidth = Math.max(0.000001, windowWidth);
		this.invert = !invert;

	 	this.a = (invert ? -1 : 1) * 255 / (windowWidth - 1);
        //this.b = (invert ? : 127.5) + ( (-255 * windowCenter) + 127.5) / (windowWidth - 1) + 127.5;
    }

	// TODO this isn't working
	apply(v) {
		return v * this.a + this.b;
	}

	toggleInvert(): WindowingLUT {
		// looks like it should be !this._invert but it's not because we'll invert it on the constructor
		return this.setInvert(this.invert);
	}

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

	// TODO set invert to voiLUT once it's created :)
	return opt.voiLUT || new WindowingLUT(opt.windowCenter, opt.windowWidth, opt.invert);
}
