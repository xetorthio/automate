#!/bin/sh

for i in $*
do
  node create.js $i > $i.template
done
