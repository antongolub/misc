#!/usr/bin/env bash
set -e

input='foobarbazqux'

# split
l=3
end=$(( (${#input} - $l)/$l + 1 ))
for i in $(seq 0 $end); do
  chunk=${input:$i*$l:$l}
  echo $chunk
done

# join
env | sort -f | while IFS= read -r line; do
  value=${line#*=}
  name=${line%%=*}
  echo $name $value
done

# https://stackoverflow.com/questions/7568112/split-large-string-into-substrings
# https://stackoverflow.com/questions/39529648/how-to-iterate-through-all-the-env-variables-printing-key-and-value
