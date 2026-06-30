#!/bin/bash
set -e

cd /home/truphile/Documents/DripWaves/stellar-wave-hub/contracts/wave_hub_registry

echo "Generating admin key for testnet..."
stellar keys generate admin --network testnet || echo "Admin key already exists."

echo "Funding admin key..."
stellar keys fund admin --network testnet || echo "Funded."

echo "Building contract..."
stellar contract build

echo "Optimizing contract..."
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/wave_hub_registry.wasm

echo "Installing contract on testnet..."
WASM_HASH=$(stellar contract install --network testnet --source admin --wasm target/wasm32-unknown-unknown/release/wave_hub_registry.wasm)
echo "WASM Hash: $WASM_HASH"

echo "Deploying contract on testnet..."
CONTRACT_ID=$(stellar contract deploy --network testnet --source admin --wasm-hash $WASM_HASH)
echo "Contract ID: $CONTRACT_ID"

echo "Initializing contract..."
XLM_SAC=$(stellar contract id asset --asset native --network testnet)
ADMIN_ADDRESS=$(stellar keys address admin)

stellar contract invoke --network testnet --source admin --id $CONTRACT_ID -- initialize --admin $ADMIN_ADDRESS --token $XLM_SAC --reg_fee 5000000 --rate_fee 1000000 --version "1.0.0"

echo "Deployment successful."
echo "Contract ID: $CONTRACT_ID"
echo "CONTRACT_ID=$CONTRACT_ID" > .deploy_result
