#!/bin/sh

FAILED=0

rm test.log

for test_file in $(ls *Test.js) 
do
  node runner.js $test_file

  if [ $? -ne 0 ]; then
    printf "%s \033[31mFAILED\033[0m\n" $test_file
    let FAILED=FAILED+1
  else
    printf "%s \033[32mOK\033[0m\n" $test_file
  fi
done

exit $FAILED
