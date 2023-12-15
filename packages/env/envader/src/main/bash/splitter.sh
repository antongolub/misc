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
