exts=$(ls | sed 's/^.*\.//' | sort -u)
for ext in $exts
do
  mkdir $exts
  mv -v *.$ext $ext/
done
