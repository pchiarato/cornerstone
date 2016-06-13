import { getEnabledElement } from './enabledElements';

export function getElementData(el: HTMLElement, dataType: string): {} {
    var ee = getEnabledElement(el);
    if(ee.data.hasOwnProperty(dataType) === false)
    {
        ee.data[dataType] = {};
    }
    return ee.data[dataType];
}

export function removeElementData(el: HTMLElement, dataType: string) {
    var ee = getEnabledElement(el);
    delete ee.data[dataType];
}