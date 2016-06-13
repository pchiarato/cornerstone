import { calculateTransform } from './calculateTransform';
import { Transform } from './transform';

export function getTransform(enabledElement: CStone.EnabledElement): Transform
{
    // For now we will calculate it every time it is requested.  In the future, we may want to cache
    // it in the enabled element to speed things up
    let transform = calculateTransform(enabledElement);
    return transform;
}