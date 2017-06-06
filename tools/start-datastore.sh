#!/usr/bin/env bash

WHEREAMI=`dirname "${0}"`
PROJECT_ROOT=`cd "${WHEREAMI}/../" && pwd`

gcloud beta emulators datastore start --project=netocny-sk --data-dir=$PROJECT_ROOT/tmp/datastore