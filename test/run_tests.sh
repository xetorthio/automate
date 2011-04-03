#!/bin/sh

for test_file in $(ls *Test.js) 
do
  node runner.js $test_file

  if [ $? -ne 0 ]; then
    printf "%s \033[31mFAILED\033[0m\n" $test_file
    exit 1;
  fi
done
