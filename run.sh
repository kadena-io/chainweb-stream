#!/usr/bin/env bash

while true; do
  npm run start
  echo $(date) EXITED >&2
  sleep 2
done
