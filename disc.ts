
type Disc<K,V> = (xs: Array<[K,V]>) => Array<Array<V>>;
interface Left<T> {
    side: "left";
    value: T;
}
interface Right<U> {
    side: "right";
    value: U;
}
type Either<T,U> = Left<T> | Right<U>;

function discChar<V>(xs: Array<[string, V]>) {
    let asciibucket = [];
    for(let i = 0; i < 256; i++) {
        asciibucket[i] = [];
    }
    for(let x of xs) {
        asciibucket[x[0].charCodeAt(0)].push(x[1]);
    }
    return asciibucket.filter(x => x.length > 0)
}

function discInverse<K,V>(disc1: Disc<K,V>): Disc<K,V> {
    return (xs: Array<[K, V]>) => disc1(xs).reverse();
}

function flatten<T>(xs: T[][]): T[] {
    let results: T[] = [];
    for(let x of xs) {
        results = results.concat(x);
    }
    return results;
}

function flatMap<A,B>(xs: A[][], fn: (a:A) => B): B[] {
    let result: B[] = [];
    return xs.map((x: A[]): B[] => x.map(fn)).reduce((x: B[], y: B[]): B[] => x.concat(y), result);
}

function discBoolean<V>(xs: Array<[boolean, V]>): Array<Array<V>> {
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

function discNat<V>(n: number): (xs: Array<[number, V]>) => Array<Array<V>> {
    return (xs: Array<[number, V]>) => {
        let buckets = new Array(n);
        for(let i = 0; i < n; i++) {
            buckets[i] = [];
        }
        for(let x of xs) {
            buckets[x[0]].push(x[1]);
        }
        return buckets.filter(x => x.length > 0);
    }
}

function discMap<K,T,V>(f: (k:K) => T, disc1: Disc<T,V>): Disc<K, V> {
    return (xs: Array<[K, V]>) => {
        return disc1(xs.map((vs: [K,V]):[T,V] => [f(vs[0]), vs[1]]));
    }
}

function discSum<K,T,V>(disc1: Disc<K,V>, disc2: Disc<T,V>): Disc<Either<K, T>, V> {
    return (xs: Array<[Either<K, T>, V]>) => {
        let mylefts: [Left<K>, V][] = <[Left<K>, V][]>xs.filter((x) => x[0].side === "left")
        let lefts = disc1(mylefts.map((x: [Left<K>, V]):[K, V] => [x[0].value, x[1]]));
        let myrights: [Right<T>, V][] = <[Right<T>, V][]>xs.filter((x) => x[0].side === 'right')
        let rights= disc2(myrights.map((x: [Right<T>, V]):[T, V] => [x[0].value, x[1]]));
        return lefts.concat(rights);
    }
}

function discUnit<K,V>(xs: Array<[K,V]>) {
    return [xs.map(x => x[1])];
}

function discPair<K,T,V>(disc1: Disc<K, [T, V]>, disc2: Disc<T, V>): Disc<[K, T], V> {
    return (xs:Array<[[K, T], V]>): Array<Array<V>> => {
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


function zip<K,T>(xs: Array<K>, ys: Array<T>): Array<[K,T]> {
    let result: Array<[K,T]> = [];
    let min_length = Math.min(xs.length, ys.length);
    for(let i = 0; i < min_length; i++) {
        result.push([xs[i], ys[i]]);
    }
    return result
}

function zipInt<T>(xs: Array<T>): Array<[number, T]> {
    let results: Array<[number, T]> = [];
    for(let i = 0; i < xs.length; i++) {
        results.push([i, xs[i]]);
    }
    return results;
}
function report<T>(x: T): T {
    console.log(x);
    return x
}
function discLexPair<K,T,V>(disc1: Disc<K, [T, V]>, disc2: Disc<T, [number, V]>): Disc<[K, T], V> {
    return (xs: Array<[[K,T], V]>): Array<Array<V>> => {
        let yss: Array<Array<[T,V]>> = disc1(
            xs.map(
                (x: [[K, T], V]): [K, [T, V]] => [x[0][0], [x[0][1], x[1]]])
        )

        let i = 0;
        let zss: Array<[T, [number, V]]> = flatMap<[T,V], [T, [number, V]]>(yss, (ys: [T,V]):[T, [number, V]] => [ys[0],[i++, ys[1]]]);
        return discNat<V>(yss.length)(report(flatten(report(disc2(zss)))))
    }
}

function discList<K,V>(disc1: Disc<K, [Array<K>, V]>): Disc<Array<K>, V> {
    return (cs: Array<[Array<K>, V]>): V[][] => {
        if(cs.length == 0) {
            return []
        }else{ 
            // type Either<T,U> = Left<T> | Right<U>;
            //discPair<K,T,V>(disc1: Disc<K, [T, V]>, disc2: Disc<T, V>): Disc<[K, T], V>
            // discSum<K,T,V>(disc1: Disc<K,V>, disc2: Disc<T,V>): Disc<Either<K, T>, V>
            // discMap<K,T,V>(f: (k:K) => T, disc1: Disc<T,V>): Disc<K, V>
            let pair: Disc<[K, K[]], V> = discPair(disc1, discList(disc1) );
            let sum: Disc<Either<K, [K, K[]]>, V> = discSum<K, [K, K[]], V>(discUnit, (pair) );

            return discMap(<(k: Array<K>) => Either<K, [K, K[]]>>fromList, sum)(cs)
        }
    }
    function fromList<T>(xs: Array<T>): Either<T[], [T, T[]]> {
        if(xs.length == 0) {
            return {side: "left", value: []};
        }else{
            return {side: "right", value: [xs[0], xs.slice(1)]};
        }
    }
}

function part<T>(disc: Disc<T,T>): (xs: Array<T>) => Array<Array<T>> {
    return (xs: Array<T>) => {
        return disc(xs.map((x: T):[T,T] => [x,x]))
    }
}

function sort<T>(disc: Disc<T,T>): (xs: Array<T>) => Array<T> {
    return (xs: Array<T>) => {
        return flatten(part(disc)(xs));
    }
}

let eightbits = discNat(8);
//console.log(sort(discNat(4))([0, 1, 2, 1, 2, 3, 3, 2, 2, 1]));
//console.log(sort(discBoolean)([true, false, true, false, false, true]));
//console.log(sort(discBoolean)([]));
let el = [
    [[1, 2], 'b'], 
    [[3, 1], 'd'], 
    [[3, 1], 'f'], 
    [[7, 1], 'b'], 

    [[3, 2], 'e'], 
    [[3, 2], 't'],
    [[7, 2], 'a'],

    [[2, 7], 'c'], 
    ];
//let eightlistdisc = discList(eightbits);
//let pairsort = discPair(eightbits, eightbits);
//console.log("pairsort", flatten(pairsort(el)));
//test = el.map(x => [x[0][0], [x[0][1], x[1]]]);
//console.log("test",test);
//console.log("eighbits", eightbits(test));
//# sourceMappingURL=disc.js.map
//let es = [(["c","f"], 1), (["b","g"],2),(["a","h"],3),(["a","b"],4)]
let us = [[[1,2], 1], [[1,1],2],[[3,1],3],[[2,4],4]] //2 1 4 3 // 2 3 1 4
//let us = [, [[1,1],2],[[3,1],3],[[1,2], 1],[[2,4],4]]
//let us = [[[1,1,4], 1], [[1,2,4],2],[[1,3,2],3],[[1,2,1],4]]
let strings = [[['x','y','c'],'xyc'], [['x','x'],'xx'],[['a','b','c'],'abc']]
let strings2 = [['x','y','c'], ['x','x','z','w'],['a','b','c']]
let letterpairs = [[['x','y'],'xy'], [['x','x'],'xx'],[['a','b'],'ab']]
//let lexints = discList(discNat(5))
//let discString = discList(discChar);
//console.log(lexints(us))
let test = discLexPair(discNat(5), discNat(5));
console.log(test(<[[number,number], number][]>us));

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

//console.log(discChar(cel))
//console.log(discString(strings))
//console.log(discString(strings2))
