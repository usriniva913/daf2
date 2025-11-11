function fib(n: nat): nat
{
  if n==0 then 0
  else if n==1 then 1
  else fib(n-1)+fib(n-2)
}

lemma ToBeProven() 
ensures forall n:nat :: n>=6 ==> fib(n-0)==5*fib(n-4)+3*fib(n-5)
{
  forall n:nat
    ensures n>=6 ==> fib(n-0)==5*fib(n-4)+3*fib(n-5)
  {
    if n>=6 {  //deduction, introduce hypothesis    
      // fill in your own logic below to prove fib(n-0)==5*fib(n-4)+3*fib(n-5)
      //var a:=fib(n-0);
      //var b:=fib(n-4);
      //var c:=...
      //assert a+b==c+d+e; ...
      // Expand fib(n) using the recursive definition
      assert fib(n) == fib(n-1) + fib(n-2);
      
      // Expand fib(n-1) and fib(n-2)
      assert fib(n-1) == fib(n-2) + fib(n-3);
      assert fib(n-2) == fib(n-3) + fib(n-4);
      
      // Substitute back: fib(n) = [fib(n-2) + fib(n-3)] + [fib(n-3) + fib(n-4)]
      assert fib(n) == fib(n-2) + 2*fib(n-3) + fib(n-4);
      
      // Expand fib(n-2) again
      assert fib(n-2) == fib(n-3) + fib(n-4);
      
      // Substitute: fib(n) = [fib(n-3) + fib(n-4)] + 2*fib(n-3) + fib(n-4)
      assert fib(n) == 3*fib(n-3) + 2*fib(n-4);
      
      // Expand fib(n-3)
      assert fib(n-3) == fib(n-4) + fib(n-5);
      
      // Substitute: fib(n) = 3*[fib(n-4) + fib(n-5)] + 2*fib(n-4)
      assert fib(n) == 3*fib(n-4) + 3*fib(n-5) + 2*fib(n-4);
      
      // Combine like terms
      assert fib(n) == 5*fib(n-4) + 3*fib(n-5);
    }
  }
}
