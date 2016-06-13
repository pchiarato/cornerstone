/// <reference path="../typings/index.d.ts" />

declare namespace CStone{

	interface Image{
		imageId: string;

		rows: number;
		height: number;
		columns: number;
		width: number;

		sizeInBytes: number;

		rowPixelSpacing: number;
		columnPixelSpacing: number;

		minPixelValue: number;
		maxPixelValue: number;

		intercept: number;
		slope: number;

		windowWidth: number;
		windowCenter: number;

		invert: boolean;

		getPixelData?: () => number[];
		
		lut?: ImageLut;

		render: (enabledElement: EnabledElement, invalidated: boolean) => void;

		//ImageCache
		sharedCacheKey?: string;
		decache?: () => void;
	}

	interface ColorImage extends Image{
		getCanvas: () => HTMLCanvasElement;
	}

	interface WebImage extends Image{
		getImage: () => HTMLImageElement;
	}

	interface ImageLut extends Int16Array {
		windowWidth?: number;
		windowCenter?: number;
		invert?: boolean;

		modalityLUT?: LUT;
		voiLUT?: LUT;
	}

	type LutFunc = (modalityLutValue: number) => number;

	interface LUT{
		id: string;
		firstValueMapped: number;
		numBitsPerEntry: number;
		lut: number[];
	}

	interface Viewport{
		scale: 				number;
		translation: {
			x: 				number;
			y: 				number;
		};
		voi: {
			windowWidth: 	number;
			windowCenter: 	number;
		};
		invert: 			boolean;
		pixelReplication: 	boolean;
		rotation: 			number;
		hflip: 				boolean;
		vflip: 				boolean;
		modalityLUT?: 		LUT;
		voiLUT?: 			LUT;
	}

	interface EnabledElement {
	    id: number;

	    element: HTMLElement;
	    canvas: HTMLCanvasElement;

	    image?: Image;
	    invalid?: boolean;
	    
	    viewport?: Viewport;
	    initialViewport?: Viewport;

	    lastImageTimeStamp?: number;

	    data?: {};
	}

	interface Coord{
		x: number;
		y: number;
	}
}