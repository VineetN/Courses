object Q5
{
def sortInsert(x : Int, xs : List[Int]) : List[Int] = {

xs match{
    case Nil => List(x)
    case y :: xs1 =>
        if(y <= x) x :: xs
        else y :: sortInsert(x,  xs1)
 }

}
def Sort(xs : List[Int]) : List[Int] = {
  xs match{
    case Nil => Nil
    case x :: xs1 => sortInsert(x, Sort(xs1))

   }
}
def pivotSort(w : Int, xw : List[Int]): List[Int]=
    {
        
        Sort(w :: xw)
    }
 
def main(args: Array[String])
{
    println(pivotSort(9, List(1, 6, 4, 12, 2)))
}
}