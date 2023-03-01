#!/usr/bin/env bash

PASS=$(grep REDIS_PASS .env | cut -d=  -f2- | awk '{print $1}')
 
REDIS_KEY=mainnet01:confirmedEvents:marmalade.ledger 

redis-cli -a $PASS get $REDIS_KEY > marm

SECOND_HEIGHT=$(jq -r '.[]|.height' marm | uniq | head -n 2 | tail -n 1)

echo "set $REDIS_KEY '$(jq --arg height $SECOND_HEIGHT -rc '[.[]|select(.height < ($height|tonumber))]' marm)'" | redis-cli -a $PASS

rm marm
