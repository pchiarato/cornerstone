import { Component, Output, EventEmitter} from '@angular/core';

@Component({
	selector: 'cs-toolbar',
	template: `
		<button class="btn" (click)='scale.emit(1)'>256x256</button>
		<button class="btn" (click)='scale.emit(2)'>512x512</button>

		<button class="btn" (click)='invert.emit()'>Invert</button>

		<button class="btn" (click)='vflip.emit()'>Flip Horizontally</button>
		<button class="btn" (click)='hflip.emit()'>Flip Vertically</button>

		<button class="btn" (click)='rotate()'>Rotate 90</button>
	`
})

export class ToolbarComponent {

	@Output() scale = new EventEmitter();

	@Output() invert = new EventEmitter();

	@Output() hflip = new EventEmitter();

	@Output() vflip = new EventEmitter();

	@Output() rotation = new EventEmitter();

	rotate() {
		this.rotation.emit(Math.PI / 2);
	}
}
