export interface Image {

    width: number;
    height: number;

    components: number;

    pixelData: ArrayBufferView;

	rowPixelSpacing?: number;
	columnPixelSpacing?: number;
	minPixelValue?: number;
    maxPixelValue?: number;
}
