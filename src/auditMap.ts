import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { empty } from 'rxjs/observable/empty';
import { mergeMap } from 'rxjs/operator/mergeMap';

// project signature should be (value: T, index: number) => ObservableInput<I>
// ObservableInput instead of Observable but I don't care about handling promise and array like.

export function auditMap<T, I>(
  this: Observable<T>,
  project: (value: T, index: number) => Observable<I>): Observable<I>;
export function auditMap<T, I, R>(
    this: Observable<T>,
    project: (value: T, index: number) => Observable<I>,
    resultSelector: ((outerValue: T, innerValue: I, outerIndex: number, innerIndex: number) => R)): Observable<I | R>
export function auditMap<T, I, R>(
  this: Observable<T>,
  project: (value: T, index: number) => Observable<I>,
  resultSelector?: ((outerValue: T, innerValue: I, outerIndex: number, innerIndex: number) => R)): Observable<I | R> {
    let nextArgs: [T, number] | undefined;
    let isRunning = false;

    const subscriberFact = (ob: Observer<I>): Observer<I> => ({
      next: (v: I) => { ob.next(v); },
      error: (e: any) => { ob.error(e); },
      complete: () => {
        if (nextArgs !== undefined) {
          const [nextE, nextI] = nextArgs;
          nextArgs = undefined;

          project(nextE, nextI).subscribe(subscriberFact(ob));
        }
        else {
          isRunning = false;
          ob.complete();
        }
      }
    });

    return mergeMap.call(this,
      (e: T, i: number) => {
           if (!isRunning) {
            isRunning = true;
            return Observable.create( (observer: Observer<I>) => { project(e, i).subscribe(subscriberFact(observer)); });
          }
          else {
            nextArgs = [e, i];
            return empty();
          }
     },
     resultSelector
    );
};
