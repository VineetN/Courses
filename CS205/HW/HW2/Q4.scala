object Q4
{
def sortInsert(x : Int, xs : List[Int]) : List[Int] = {

xs match{
    case Nil => List(x)
    case y :: xs1 =>
        if(y >= x) x :: xs
        else y :: sortInsert(x,  xs1)
 }

}
def InsertionSort(xs : List[Int]) : List[Int] = {
  xs match{
    case Nil => Nil
    case x :: xs1 => sortInsert(x, InsertionSort(xs1))

   }

 }
def main(args: Array[String])
{
    println(InsertionSort(List(1, 6, 4, 12, 2)))
}
}