object Q2{

    def main(args: Array[String]): Unit = {
        
        def split(list: List[Int]): (List[Int], List[Int]) = {
            var list1: List[Int] = Nil
            var list2: List[Int] = Nil
            var list3: List[Int] = list // copying the input list for usage

            while (list3 != Nil) {
                list1 = list1:+(list3.head) // adds the first element of the original list to list1
                list3 = list3.tail // removes the first element from the original list

                if (list3 != Nil) {
                    list2 = list3.last::list2 // adds the last element of the original list to list2
                    list3 = list3.init // removes the last element from the original list
                }
            } // the list keeps getting smaller, the while loop ends when the list becomes nil. List1 has the first half of the original list and list2 has the second half.
            return (list1, list2)
        }
        Console.println(split(List(1,2,3,4,5)))
    }
}