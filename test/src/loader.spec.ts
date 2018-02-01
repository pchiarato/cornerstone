import { loadImage } from './loader';

describe('loader utility for test', () => {
	describe('image loader', () => {
		it('image should be monochrome and 256x256', () => loadImage('MR')
			.then(img => {
				expect(img.width).toBe(256);
				expect(img.height).toBe(256);
				expect(img.components).toBe(1);
			})
		);
	});
});
