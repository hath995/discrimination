
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
    return [[xs[1]]]
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

//function discList<K,V>(disc1: Disc<K, [Array<K>, V]>): Disc<Array<K>, V> {
    //return (xs: Array<[Array<K>, V]>) => {
        //return discMap(fromList,discSum(discUnit, (discPair(disc1, (discList(disc1))))))
    //}
    //function fromList<T>(xs: Array<T>): Either<T[], [T, T[]]> {
        //if(xs.length == 0) {
            //return {side: "left", value: []};
        //}else{
            //return {side: "right", value: [xs[0], xs.slice(1)]};
        //}
    //}
//}

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
console.log(sort(discNat(4))([0, 1, 2, 1, 2, 3, 3, 2, 2, 1]));
console.log(sort(discBoolean)([true, false, true, false, false, true]));
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
let pairsort = discPair(eightbits, eightbits);
console.log("pairsort", flatten(pairsort(el)));
//test = el.map(x => [x[0][0], [x[0][1], x[1]]]);
//console.log("test",test);
//console.log("eighbits", eightbits(test));
//# sourceMappingURL=disc.js.map
