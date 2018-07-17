
export type Discrim<K> = <V>(xs: Array<[K,V]>) => Array<Array<V>>;
export interface Left<T> {
    side: "left";
    value: T;
}
export interface Right<U> {
    side: "right";
    value: U;
}
export type Alternative<T,U> = Left<T> | Right<U>;


export function discChar<V>(xs: Array<[string, V]>): Array<Array<V>> {
    let asciibucket: Array<Array<V>> = [];
    for(let i = 0; i < 256; i++) {
        asciibucket[i] = [];
    }
    for(let x of xs) {
        asciibucket[x[0].charCodeAt(0)].push(x[1]);
    }
    return asciibucket.filter(x => x.length > 0)
}

export function discInverse<K>(disc1: Discrim<K>): Discrim<K> {
    return <V>(xs: Array<[K, V]>) => disc1(xs).reverse();
}

export function flatten<T>(xs: T[][]): T[] {
    let results: T[] = [];
    for(let x of xs) {
        results = results.concat(x);
    }
    return results;
}

export function flatMap<A,B>(xs: A[][], fn: (a:A) => B): B[] {
    let result: B[] = [];
    return xs.map((x: A[]): B[] => x.map(fn)).reduce((x: B[], y: B[]): B[] => x.concat(y), result);
}

export function discBoolean<V>(xs: Array<[boolean, V]>): Array<Array<V>> {
    const bools: Array<keyof BooleanBucket<V>> = ["false", "true"];
    interface BooleanBucket<V> {
        true: V[];
        false: V[];
    }
    let buckets: BooleanBucket<V> = {true: [], false: []},
        results: Array<Array<V>> = [];
    for(let x of xs) {
        buckets[<keyof BooleanBucket<V>>x[0].toString()].push(x[1])
    }
    for(let bool of bools){
        if(buckets[bool].length > 0) {
            results.push(buckets[bool]);
        }
    }
    return results
}

type NumberCont<R> = (cont: (x: number) => R) => R
function yourNumber(x: number): string {
    return ("your number is " + x);
}
const myNumber: NumberCont<string> = cont => cont(1);
let b = myNumber(yourNumber);
type GetModOps<S, A> = { get: (s: S) => A, modify: (a: A) => A };
type GetMod<S> = <R>(cont: <A>(t: GetModOps<S, A>) => R) => R;
//(_ => R) => R
//(xs: Array<[number, V]>) => Array<Array<V>>
export function discNat(n: number): Discrim<number> {
    return <V>(xs: Array<[number, V]>) => {
        let buckets = new Array(n);
        for(let i = 0; i < n; i++) {
            buckets[i] = [];
        }
        for(let x of xs) {
            if(!buckets[x[0]]) {
              console.log("WHAT", xs, x, buckets);
            }
            buckets[x[0]].push(x[1]);
        }
        return buckets;
    }
}

export function discMap<K,T>(f: (k:K) => T, disc1: Discrim<T>): Discrim<K> {
    return <V>(xs: Array<[K, V]>) => {
        return disc1(xs.map((vs: [K,V]):[T,V] => [f(vs[0]), vs[1]]));
    }
}

export function discSum<K,T>(disc1: Discrim<K>, disc2: Discrim<T>): Discrim<Alternative<K, T>> {
    return <V>(xs: Array<[Alternative<K, T>, V]>) => {
        let mylefts: [Left<K>, V][] = <[Left<K>, V][]>xs.filter((x) => x[0].side === "left")
        let lefts = disc1(mylefts.map((x: [Left<K>, V]):[K, V] => [x[0].value, x[1]]));
        let myrights: [Right<T>, V][] = <[Right<T>, V][]>xs.filter((x) => x[0].side === 'right')
        let rights= disc2(myrights.map((x: [Right<T>, V]):[T, V] => [x[0].value, x[1]]));
        return lefts.concat(rights);
    }
}

export function discUnit<K,V>(xs: Array<[K,V]>) {
    return [xs.map(x => x[1])];
}

export function discPair<K,T>(disc1: Discrim<K>, disc2: Discrim<T>): Discrim<[K, T]> {
    return <V>(xs:Array<[[K, T], V]>): Array<Array<V>> => {
        let ys: Array<Array<[T,V]>> = disc1(xs.map((x: [[K, T], V]): [K, [T, V]] => [x[0][0], [x[0][1], x[1]]]));
        let vs = disc2(flatten(ys));
        return vs;
    }
}

function* ints() {
    let i = 0;
    while(true) {
        yield i++;
    }
}


export function zip<K,T>(xs: Array<K>, ys: Array<T>): Array<[K,T]> {
    let result: Array<[K,T]> = [];
    let min_length = Math.min(xs.length, ys.length);
    for(let i = 0; i < min_length; i++) {
        result.push([xs[i], ys[i]]);
    }
    return result
}

export function zipInt<T>(xs: Array<T>): Array<[number, T]> {
    let results: Array<[number, T]> = [];
    for(let i = 0; i < xs.length; i++) {
        results.push([i, xs[i]]);
    }
    return results;
}

export function report<T>(x: T): T {
    console.log(x);
    return x
}

export function discLexPair<K,T>(disc1: Discrim<K>, disc2: Discrim<T>): Discrim<[K, T]> {
    return <V>(xs: Array<[[K,T], V]>): Array<Array<V>> => {
        let yss: Array<Array<[T,V]>> = disc1(
            xs.map(
                (x: [[K, T], V]): [K, [T, V]] => [x[0][0], [x[0][1], x[1]]])
        )

        let i = 0;
        let zss: Array<[T, [number, V]]> = flatMap<[T,V], [T, [number, V]]>(yss, (ys: [T,V]):[T, [number, V]] => [ys[0],[i++, ys[1]]]);
        return discNat(yss.length)(report(flatten(report(disc2(zss)))))
    }
}

export function discList<K>(disc1: Discrim<K>): Discrim<Array<K>> {
    return <V>(cs: Array<[Array<K>, V]>): V[][] => {
        if(cs.length == 0) {
            return []
        }else{ 
            // type Alternative<T,U> = Left<T> | Right<U>;
            //discPair<K,T,V>(disc1: Discrim<K, [T, V]>, disc2: Discrim<T, V>): Discrim<[K, T], V>
            // discSum<K,T,V>(disc1: Discrim<K,V>, disc2: Discrim<T,V>): Discrim<Alternative<K, T>, V>
            // discMap<K,T,V>(f: (k:K) => T, disc1: Discrim<T,V>): Discrim<K, V>
            let pair: Discrim<[K, K[]]> = discPair(disc1, discList(disc1));
            let sum: Discrim<Alternative<K, [K, K[]]>> = discSum<K, [K, K[]]>(discUnit, pair);

            return discMap(<(k: Array<K>) => Alternative<K, [K, K[]]>>fromList, sum)(cs)
        }
    }
    function fromList<T>(xs: Array<T>): Alternative<T[], [T, T[]]> {
        if(xs.length == 0) {
            return {side: "left", value: []};
        }else{
            return {side: "right", value: [xs[0], xs.slice(1)]};
        }
    }
}

export function part<T>(disc: Discrim<T>): (xs: Array<T>) => Array<Array<T>> {
    return (xs: Array<T>) => {
        return disc(xs.map((x: T):[T,T] => [x,x]))
    }
}

export function sort<T>(disc: Discrim<T>): (xs: Array<T>) => Array<T> {
    return (xs: Array<T>) => {
        return flatten(part(disc)(xs));
    }
}

let eightbits = discNat(8);
let el: [[number, number], string][] = [
    [[1, 2], 'b'], 
    [[3, 1], 'd'], 
    [[3, 1], 'f'], 
    [[7, 3], 'x'], 

    [[3, 2], 'e'], 
    [[3, 2], 't'],
    [[7, 2], 'y'],

    [[2, 7], 'c'], 
];
let us = [[[1,2], 1], [[1,1],2],[[3,1],3],[[2,4],4]] //2 1 4 3 // 2 3 1 4
let strings: Array<[string[], string]> = [[['x','y','c'],'xyc'], [['x','x'],'xx'],[['a','b','c'],'abc']]
let strings2 = [['x','y','c'], ['x','x','z','w'],['a','b','c']]
let letterpairs = [[['x','y'],'xy'], [['x','x'],'xx'],[['a','b'],'ab']]
let test  = discLexPair(discNat(8), discNat(8));
console.log(test(el));
let discString = discList(discChar);
let cel = [
    ['b', 'b'], 
    ['d', 'd'], 
    ['f', 'f'], 
    ['b', 'b'], 
        
    ['e', 'e'], 
    ['t', 't'],
    ['a', 'a'],

    ['c', 'c'], 
    ];
console.log(sort(discString)([["xx"],["abc"],["xyc"],["a"]]));
