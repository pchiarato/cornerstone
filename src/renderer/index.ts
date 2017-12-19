import { Observable } from 'rxjs/Observable';

import { Lut } from '../lut';
import { Image } from '../image';

export interface Renderer {

    output: Observable<Error | Image>;

    draw(image: Image, luts?: Lut[]): void;

    destroy(): void;
}

export interface RenderItem {
	image: Image;
	luts: Lut[];
}
