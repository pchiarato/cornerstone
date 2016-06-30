// WindowingLUT using an array buffer, used by rendering 2 (pixel representation per position)

export class WindowingLUT extends ArrayLUT implements LUT {

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
}

// Dunno if I'll keep it so here is a backup of ArrayLut needed by this WindowingLUT
export abstract class ArrayLUT extends AbstractLUT {

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
