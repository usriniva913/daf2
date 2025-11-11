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
    }
  }
}