// Temporary fix until next angular 2 version. (master already fixed just waiting an official version)
import { Pipe, PipeTransform } from '@angular/core';
import {DomSanitizationService} from '@angular/platform-browser';

@Pipe({ name: 'safesan' })
export class SafeSanitization implements PipeTransform {
	constructor(private sanitizer: DomSanitizationService) {
		this.sanitizer = sanitizer;
	}

	transform(style: string): string {
		return <string>this.sanitizer.bypassSecurityTrustStyle(style);
	}
}
