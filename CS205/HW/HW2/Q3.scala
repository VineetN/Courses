object Q3
{

def sortInsert(x : Int, xs : List[Int]) : List[Int] = {

xs match{
    case Nil => List(x)
    case y :: xs1 =>
        if(y >= x) x :: xs
        else y :: sortInsert(x,  xs1)
 }

}
def main(args: Array[String])
{
    println(sortInsert(7, List(1, 6, 4, 12, 2)))
}
}