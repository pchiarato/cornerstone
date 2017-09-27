import { BaseLut } from '../lut';
import { Image } from '../image';

export interface Renderer {
    draw(image?: Image, lut?: BaseLut[]): void;
}
