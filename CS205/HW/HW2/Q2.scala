object Q2
{

def split[A](n: Int, l: List[A]):(List[A], List[A]) = 
    {
    def _split[A](c: Int, res: List[A], rem: List[A]):(List[A],List[A]) = (c, rem) match 
        {
        case (_, Nil) => (res, Nil)
        case (0, rem) => (res, rem)
        case (c, h::tail) => _split(c - 1, res:::(List(h)), tail)
        }
    _split(n, List(), l)
    }
def main(args: Array[String])
    {
        val z = (1, 2, 3, 4, 5, 6)
        split(z)
    }
    
}