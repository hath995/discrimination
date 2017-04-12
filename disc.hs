{-# LANGUAGE RankNTypes #-}
import Data.Array
type Disc k v = [(k, v)] -> [[v]]

discChar :: Disc Char v
discChar xs=[ vs | vs <- vss, not (null vs) ]
  where vss = elems (accumArray (\vs v -> v : vs) [] ('\000', '\255') xs)

discNat :: Int -> Disc Int v
discNat n xs=[ vs | vs <- vss, not (null vs) ]
  where vss = elems (accumArray (\vs v -> v : vs) [] (0, n-1) xs)

discUnit :: Disc () v
discUnit xs =[[v | (_,v) <- xs]]

discSum :: Disc k1 v -> Disc k2 v -> Disc (Either k1 k2) v
discSum d1 d2 xs = d1[(k,v) | (Left k,v) <- xs] ++ d2 [(k',v') | (Right k',v') <- xs]

discPair :: Disc k1 (k2, v) -> Disc k2 v -> Disc (k1, k2) v
discPair d1 d2 xs = [vs | ys <-d1 [(k1,(k2,v)) | ((k1,k2),v) <- xs], vs <- d2 ys ]

discFix :: (Disc k v -> Disc k v) -> Disc k v
discFix df = df (discFix df)

discMap :: (k1 -> k2) -> Disc k2 v -> Disc k1 v
discMap f d xs = d [(f k,v) | (k,v)<-xs]

discList :: Disc k ([k], v) -> Disc [k] v
discList d = discMap fromList (discSum discUnit (discPair d (discList d)))
  where fromList :: [t] -> Either () (t, [t])
        fromList [] = Left ()
        fromList (x : xs) = Right (x, xs)

discBag :: (forall v. Disc k v) -> Disc [k] v
discBag d xs = discMap (sort d) (discList d) xs

discSet :: (forall v. Disc k v) -> Disc [k] v
discSet d xs = discMap (usort d) (discList d) xs

discRefine :: Disc k (k, v) -> Disc k v -> Disc k v
discRefine d1 d2 xs = [ zs | ys<-d1 [(k,(k,v)) | (k,v)<-xs], zs <- d2 ys ]

discInv :: Disc k v -> Disc k v
discInv d xs = reverse (d xs)
-- Ordered partitioning from discriminator
part :: Disc t t -> [t] -> [[t]]
part d xs=d [(x,x) | x <- xs]
-- Sorting from ordered partitioning
sort :: Disc t t -> [t] -> [t]
sort d xs=[y | ys <- part d xs, y <- ys]
-- Unique sorting from ordered partitioning
usort :: Disc t t -> [t] -> [t]
usort d xs=[head ys | ys <- part d xs]
-- Boolean comparison function
-- from sorting discriminator
lte :: Disc t Bool -> t -> t -> Bool
lte d x y = head (concat (d [(x, True), (y, False)]))
-- Three-valued comparison function
-- from Boolean comparison function
comp :: Disc t Bool -> t -> t -> Ordering
comp d x y = if lte d x y
             then if lte (discInv d) x y then EQ else LT
             else GT
