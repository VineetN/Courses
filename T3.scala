case class Node(left: Tree, right: Tree) extends Tree
{
    def sum(t : Tree) : Int = {
def sumAcc(trees : List[Tree], acc : Int) : Int = trees match {
case Nil => acc
case Leaf(x) :: rs => sumAcc(rs, x + acc)
case Node(l, r) :: rs => sumAcc(l :: r :: rs, acc)
}
sumAcc(List(t), 0)
}
}   