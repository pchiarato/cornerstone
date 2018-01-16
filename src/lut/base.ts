export interface BaseLut {
	type: LutTypes;
}

export const enum LutTypes {
	INVERSE,
	LINEAR,
	WINDOWING
}
