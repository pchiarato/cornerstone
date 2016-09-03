// Temporary fix until next angular 2 version. (master already fixed just waiting an official version)
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Pipe({ name: 'safesan' })
export class SafeSanitization implements PipeTransform {
	constructor(private sanitizer: DomSanitizer) {
		this.sanitizer = sanitizer;
	}

	transform(style: string): string {
		return <string>this.sanitizer.bypassSecurityTrustStyle(style);
	}
}
