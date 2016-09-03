import { NgModule }     from '@angular/core';

import { SafeSanitization } from './src/pipes/SafeSanitization';

import { CStoneComponent } from './src/CStone.component';
import { PreviewComponent } from './src/preview.component';


@NgModule({
	declarations: [
		CStoneComponent,
		PreviewComponent,

		SafeSanitization
	],
	exports:  [
		CStoneComponent,
		PreviewComponent
	]
})
export class CStoneModule {}

export * from './src/image';
export * from './src/lut';
export * from './src/matrix';
export * from './src/transform';
