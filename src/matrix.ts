// Last updated November 2011
// By Simon Sarris
// www.simonsarris.com
// sarris@acm.org
//
// Free to use and distribute at will
// So long as you are nice to people, etc

// Simple class for keeping track of the current transformation matrix

export interface Coord {
	x: number;
	y: number;
}

export class Matrix {
	m: number[];

	constructor() {
		this.reset();
	}


	reset() {
		this.m = [1, 0, 0, 1, 0, 0];
	}

	clone(): Matrix {
		let transform = new Matrix();
		transform.m[0] = this.m[0];
		transform.m[1] = this.m[1];
		transform.m[2] = this.m[2];
		transform.m[3] = this.m[3];
		transform.m[4] = this.m[4];
		transform.m[5] = this.m[5];
		return transform;
	}


	multiply(matrix: Matrix): Matrix {
		let m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
		let m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

		let m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
		let m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

		let dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
		let dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

		this.m[0] = m11;
		this.m[1] = m12;
		this.m[2] = m21;
		this.m[3] = m22;
		this.m[4] = dx;
		this.m[5] = dy;

		return this;
	}

	invert(): Matrix {
		let d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
		let m0 = this.m[3] * d;
		let m1 = -this.m[1] * d;
		let m2 = -this.m[2] * d;
		let m3 = this.m[0] * d;
		let m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
		let m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
		this.m[0] = m0;
		this.m[1] = m1;
		this.m[2] = m2;
		this.m[3] = m3;
		this.m[4] = m4;
		this.m[5] = m5;

		return this;
	}

	rotate(rad: number): Matrix {
		let c = Math.cos(rad);
		let s = Math.sin(rad);
		let m11 = this.m[0] * c + this.m[2] * s;
		let m12 = this.m[1] * c + this.m[3] * s;
		let m21 = this.m[0] * -s + this.m[2] * c;
		let m22 = this.m[1] * -s + this.m[3] * c;
		this.m[0] = m11;
		this.m[1] = m12;
		this.m[2] = m21;
		this.m[3] = m22;

		return this;
	}

	translate(x: number, y: number): Matrix {
		this.m[4] += this.m[0] * x + this.m[2] * y;
		this.m[5] += this.m[1] * x + this.m[3] * y;

		return this;
	}

	scale(sx: number, sy: number): Matrix {
		this.m[0] *= sx;
		this.m[1] *= sx;
		this.m[2] *= sy;
		this.m[3] *= sy;

		return this;
	}

	transformPoint(x: number, y: number): Coord {
		return {
			x: x * this.m[0] + y * this.m[2] + this.m[4],
			y: x * this.m[1] + y * this.m[3] + this.m[5]
		};
	}
}
