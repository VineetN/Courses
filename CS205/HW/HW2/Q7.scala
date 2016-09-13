object Q7{

def fastPower(x: Int, n: Int) : Int= {
    n match {
            case 0 => 1 // x^0 = 1
            case 1 => x // x^1 = x
            case even if n % 2 == 0 => fastPower(x,n/2) * fastPower(x,n/2) 
            case odd if n % 2 == 1 => x * fastPower(x,n/2) * fastPower(x,n/2)
            }
        }
 def main (args: Array[String]) : Unit = {
    println(fastPower(3,2))
    }
    }