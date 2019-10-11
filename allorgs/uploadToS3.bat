#!/bin/sh

aws s3 sync results s3://wims.coveodemo.com/ --exclude "*" --include "*.html" --include "*.png" 
