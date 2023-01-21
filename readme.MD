# NEAR Monitoring

This repository contains multiple scripts useful to monitor a NEAR node.

## Validator status
This script test the status of a NEAR node by connecting to the RPC port.
It checks if:

- Node is synching
- Node is not up to date
- Node version (Nearcore) needs to be updated
- Rust version needs to be updated

## Account balance
This script validate the available balance for a given account and triggers an alerts if the available balance is lower than the defined threshold.
