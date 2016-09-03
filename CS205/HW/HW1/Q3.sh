cat $1 | tr " " "\n" | sort | uniq | wc -l
