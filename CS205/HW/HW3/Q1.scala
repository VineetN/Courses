class Queue(){
	var queue: List[Any]=Nil     //variable list to implement a queue
	def equals(that: Queue): Boolean={  //overriding defn of equals methods
		(this.queue, that.queue) match{
			case (Nil, Nil) => true       //both the queues are empty
			case (x::y, a::b) => (x.equals(a)) && (y.equals(b))  //none of the queues are empty
			                                          //compare their heads and bodies
			case _ => false          //queues would not be equal in other cases                     
		}
	}
	override def hashCode(): Int={  //overriding defn of hashCode
		var sum: Int=0            //adding the hashcodes of all the elements in the current queue
		this.queue.foreach{
			sum+=_.hashCode()
		}
		sum
	}
	
	def Dequeue(): Unit={     //removes an element from the queue
		this.queue match{       //matching the current queue
			case Nil => this.queue=Nil   //queue is empty 
			case head::tail => this.queue=tail //queue is non-empty
			                                 //remove the first element
		}
	}
	
	def Enqueue(a: Any): Unit={  //add an element to the queue
		this.queue=this.queue:::List(a)  //adding an element to the end of the queue
	}
}