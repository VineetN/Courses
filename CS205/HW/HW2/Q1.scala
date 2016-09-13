object Factorial
{
    def main(args: Array[String])
    {
        println("Enter the number")
        val n = Console.readInt()
        println (factorial(n))
    }
    def factorial(a: Int): Int =
    {
        if(a == 0)
            return 1
        else
            return a * factorial(a-1)
    }
}
