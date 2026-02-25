#!/usr/bin/env bash
#
# Start Solo services for hiero-sdk-js
#
# This script:
# 1. Generates consensus keys (if needed)
# 2. Deploys and starts consensus network
# 3. Deploys mirror node services
# 4. Sets up port forwarding
# 5. Creates test account
# 6. Generates .env file
#
# Prerequisites:
#   Must run init-solo.sh first to create cluster and deployment
#
# Usage:
#   ./start-solo.sh [options]
#
# Options:
#   --consensus-node-version <version>   Consensus node version (default: v0.69.1)
#   --mirror-node-version <version>      Mirror node version (default: v0.145.2)
#   --local-build-path <path>            Path to local build (overrides consensus-node-version)
#   -h, --help                           Show this help message
#

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DEFAULT_CONSENSUS_NODE_VERSION=v0.69.1
DEFAULT_MIRROR_NODE_VERSION=v0.145.2

# Parse command line arguments
show_help() {
    echo "Usage: ./start-solo.sh [options]"
    echo ""
    echo "Options:"
    echo "  --consensus-node-version <version>   Consensus node version (default: ${DEFAULT_CONSENSUS_NODE_VERSION})"
    echo "  --mirror-node-version <version>      Mirror node version (default: ${DEFAULT_MIRROR_NODE_VERSION})"
    echo "  --local-build-path <path>            Path to local build (overrides consensus-node-version)"
    echo "  -h, --help                           Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./start-solo.sh"
    echo "  ./start-solo.sh --consensus-node-version v0.70.0"
    echo "  ./start-solo.sh --local-build-path ../hiero-consensus-node/hedera-node/data"
    exit 0
}

# Initialize with defaults
CONSENSUS_VERSION=${DEFAULT_CONSENSUS_NODE_VERSION}
MIRROR_VERSION=${DEFAULT_MIRROR_NODE_VERSION}
LOCAL_BUILD_PATH=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --consensus-node-version)
            CONSENSUS_VERSION="$2"
            shift 2
            ;;
        --mirror-node-version)
            MIRROR_VERSION="$2"
            shift 2
            ;;
        --local-build-path)
            LOCAL_BUILD_PATH="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run './start-solo.sh --help' for usage information"
            exit 1
            ;;
    esac
done

# Configuration
export SOLO_CLUSTER_NAME=solo-cluster
export SOLO_NAMESPACE=solo
export SOLO_DEPLOYMENT=solo-deployment

# Only set CONSENSUS_NODE_VERSION if not using local build
if [[ -z "${LOCAL_BUILD_PATH}" ]]; then
    export CONSENSUS_NODE_VERSION=${CONSENSUS_VERSION}
fi

export MIRROR_NODE_VERSION=${MIRROR_VERSION}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
HBAR_AMOUNT=10000000

echo_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo_info "Checking prerequisites..."
    
    # Check if cluster exists
    if ! kind get clusters 2>/dev/null | grep -q "^${SOLO_CLUSTER_NAME}$"; then
        echo_error "Kind cluster '${SOLO_CLUSTER_NAME}' not found"
        echo_info "Please run 'task solo:init' first to create the cluster and deployment"
        exit 1
    fi
    
    # Check if Solo is initialized
    if [ ! -d ~/.solo ]; then
        echo_error "Solo not initialized"
        echo_info "Please run 'task solo:init' first"
        exit 1
    fi
    
    # Check if cluster-ref exists in local-config.yaml
    # Note: deployment config may be removed by solo:stop, but cluster-ref persists
    if [ ! -f ~/.solo/local-config.yaml ] || ! grep -q "${SOLO_CLUSTER_NAME}:" ~/.solo/local-config.yaml 2>/dev/null; then
        echo_error "Cluster reference '${SOLO_CLUSTER_NAME}' not found"
        echo_info "Please run 'task solo:init' first"
        exit 1
    fi
    
    echo_success "Prerequisites met"
}

# Get number of nodes from deployment config
get_num_nodes() {
    # Try to determine from existing deployment or default to 1
    # For now, we'll check the namespace for existing nodes
    local node_count=1
    if kubectl get pods -n "${SOLO_NAMESPACE}" 2>/dev/null | grep -q "network-node2"; then
        node_count=2
    fi
    echo "$node_count"
}

# Deploy network
deploy_network() {
    local NUM_NODES=$(get_num_nodes)
    
    # Generate node ID list (node1 or node1,node2)
    local node_ids=""
    for ((i=1; i<=NUM_NODES; i++)); do
        if [ $i -eq 1 ]; then
            node_ids="node${i}"
        else
            node_ids="${node_ids},node${i}"
        fi
    done
    
    # FIRST: Check if deployment configuration exists in Kubernetes
    # The namespace may exist but be empty after solo:stop
    # This MUST happen before any other operations
    if ! kubectl get configmap solo-remote-config -n "${SOLO_NAMESPACE}" &> /dev/null; then
        echo_warning "Deployment configuration missing, recreating..."
        
        # If deployment exists in local config but remote config is missing,
        # we need to delete it from local config first to avoid Solo trying to read the missing remote config
        if [ -f ~/.solo/local-config.yaml ] && grep -q "name: ${SOLO_DEPLOYMENT}" ~/.solo/local-config.yaml 2>/dev/null; then
            echo_info "Removing stale deployment from local config..."
            npx solo deployment config delete \
                --deployment "${SOLO_DEPLOYMENT}" \
                --dev 2>/dev/null || true
        fi
        
        # Reconnect to cluster
        echo_info "Reconnecting to cluster..."
        npx solo cluster-ref config connect \
            --cluster-ref "${SOLO_CLUSTER_NAME}" \
            --context "kind-${SOLO_CLUSTER_NAME}" \
            --dev
        
        # Recreate deployment config
        echo_info "Creating deployment: ${SOLO_DEPLOYMENT}..."
        npx solo deployment config create \
            --deployment "${SOLO_DEPLOYMENT}" \
            --namespace "${SOLO_NAMESPACE}" \
            --dev
        
        # Attach cluster to deployment (creates remote config)
        echo_info "Attaching cluster to deployment (${NUM_NODES} node(s))..."
        npx solo deployment cluster attach \
            --deployment "${SOLO_DEPLOYMENT}" \
            --cluster-ref "${SOLO_CLUSTER_NAME}" \
            --num-consensus-nodes "${NUM_NODES}" \
            --dev
        
        # Re-setup cluster
        echo_info "Setting up cluster..."
        npx solo cluster-ref config setup \
            --cluster-ref "${SOLO_CLUSTER_NAME}" \
            --dev
        
        echo_success "Deployment configuration recreated"
    fi
    
    # NOW: Check if consensus keys already exist (after namespace is guaranteed to exist)
    echo_info "Checking consensus keys..."
    if kubectl get secret -n "${SOLO_NAMESPACE}" 2>/dev/null | grep -q "node1-.*-key"; then
        echo_info "Consensus keys already exist, skipping key generation"
    else
        echo_info "Generating consensus keys..."
        npx solo keys consensus generate \
            --gossip-keys \
            --tls-keys \
            --deployment "${SOLO_DEPLOYMENT}" \
            --dev
    fi
    
    echo_info "Deploying consensus network (${NUM_NODES} node(s): ${node_ids})..."
    npx solo consensus network deploy \
        --deployment "${SOLO_DEPLOYMENT}" \
        -i "${node_ids}" \
        --dev
    
    echo_info "Setting up consensus nodes..."
    if [[ -n "${LOCAL_BUILD_PATH}" ]]; then
        echo_info "Using local build path: ${LOCAL_BUILD_PATH}"
        npx solo consensus node setup \
            --deployment "${SOLO_DEPLOYMENT}" \
            -i "${node_ids}" \
            --local-build-path "${LOCAL_BUILD_PATH}" \
            --dev
    else
        echo_info "Using consensus node version: ${CONSENSUS_NODE_VERSION}"
        npx solo consensus node setup \
            --deployment "${SOLO_DEPLOYMENT}" \
            -i "${node_ids}" \
            --dev
    fi
    
    echo_info "Starting consensus nodes..."
    npx solo consensus node start \
        --deployment "${SOLO_DEPLOYMENT}" \
        -i "${node_ids}" \
        --dev
    
    echo_success "Network deployed and started"
}

# Deploy mirror node
deploy_mirror() {
    echo_info "Deploying mirror node services..."
    npx solo mirror node add \
        --deployment "${SOLO_DEPLOYMENT}" \
        --cluster-ref "${SOLO_CLUSTER_NAME}" \
        --pinger \
        --dev
    
    echo_success "Mirror node deployed"
}

# Setup port forwarding
setup_port_forwarding() {
    local NUM_NODES=$(get_num_nodes)
    
    echo_info "Setting up port forwarding..."
    
    # Kill any existing port-forward processes
    pkill -f "kubectl port-forward.*${SOLO_NAMESPACE}" || true
    sleep 2
    
    # Node 1 - Consensus
    kubectl port-forward svc/haproxy-node1-svc -n "${SOLO_NAMESPACE}" 50211:50211 > /dev/null 2>&1 &
    echo_info "  - Node 1 (consensus): localhost:50211"
    
    # Node 2 - Consensus (only for multi-node setups)
    if [ "${NUM_NODES}" -ge 2 ]; then
        kubectl port-forward svc/haproxy-node2-svc -n "${SOLO_NAMESPACE}" 51211:50211 > /dev/null 2>&1 &
        echo_info "  - Node 2 (consensus): localhost:51211"
    fi
    
    # Mirror REST API
    kubectl port-forward svc/mirror-1-rest -n "${SOLO_NAMESPACE}" 5551:80 > /dev/null 2>&1 &
    echo_info "  - Mirror REST API: localhost:5551"
    
    # gRPC Web Proxy for Node 1
    kubectl port-forward svc/envoy-proxy-node1-svc -n "${SOLO_NAMESPACE}" 8080:8080 > /dev/null 2>&1 &
    echo_info "  - gRPC Web Proxy (node1): localhost:8080"
    
    # gRPC Web Proxy for Node 2 (if exists)
    if kubectl get svc envoy-proxy-node2-svc -n "${SOLO_NAMESPACE}" &> /dev/null; then
        kubectl port-forward svc/envoy-proxy-node2-svc -n "${SOLO_NAMESPACE}" 8081:8080 > /dev/null 2>&1 &
        echo_info "  - gRPC Web Proxy (node2): localhost:8081"
    fi
    
    # Mirror Web3
    kubectl port-forward svc/mirror-1-web3 -n "${SOLO_NAMESPACE}" 8545:80 > /dev/null 2>&1 &
    echo_info "  - Mirror Web3: localhost:8545"
    
    # Mirror REST Java
    kubectl port-forward svc/mirror-1-restjava -n "${SOLO_NAMESPACE}" 8084:80 > /dev/null 2>&1 &
    echo_info "  - Mirror REST Java: localhost:8084"
    
    # Mirror gRPC
    kubectl port-forward svc/mirror-1-grpc -n "${SOLO_NAMESPACE}" 5600:5600 > /dev/null 2>&1 &
    echo_info "  - Mirror gRPC: localhost:5600"
    
    sleep 3
    echo_success "Port forwarding established"
}

# Create ECDSA test account
create_test_account() {
    echo_info "Creating ECDSA test account..."
    
    # Create account
    npx solo ledger account create \
        --generate-ecdsa-key \
        --deployment "${SOLO_DEPLOYMENT}" \
        --dev > "${PROJECT_ROOT}/account_create_output_ecdsa.txt"
    
    cat "${PROJECT_ROOT}/account_create_output_ecdsa.txt"
    
    # Parse account info
    echo_info "Parsing account information..."
    JSON=$(cat "${PROJECT_ROOT}/account_create_output_ecdsa.txt" | node "${SCRIPT_DIR}/extractAccountAsJson.js") || {
        echo_error "Failed to parse account information"
        exit 1
    }
    
    ACCOUNT_ID=$(echo "${JSON}" | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.accountId);")
    ACCOUNT_PUBLIC_KEY=$(echo "${JSON}" | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.publicKey);")
    
    echo_info "Account ID: ${ACCOUNT_ID}"
    echo_info "Public Key: ${ACCOUNT_PUBLIC_KEY}"
    
    # Retrieve private key from Kubernetes secret
    echo_info "Retrieving private key from Kubernetes..."
    ACCOUNT_PRIVATE_KEY=$(kubectl get secret "account-key-${ACCOUNT_ID}" -n "${SOLO_NAMESPACE}" -o jsonpath='{.data.privateKey}' | base64 -d | xargs)
    
    # Fund the account
    echo_info "Funding account with ${HBAR_AMOUNT} HBAR..."
    npx solo ledger account update \
        --account-id "${ACCOUNT_ID}" \
        --hbar-amount "${HBAR_AMOUNT}" \
        --deployment "${SOLO_DEPLOYMENT}" \
        --dev
    
    echo_success "Test account created and funded"
    
    # Store account info for .env generation
    export OPERATOR_ID="${ACCOUNT_ID}"
    export OPERATOR_KEY="${ACCOUNT_PRIVATE_KEY}"
    
    # Clean up temporary file
    rm -f "${PROJECT_ROOT}/account_create_output_ecdsa.txt"
}

# Generate .env file
generate_env_file() {
    echo_info "Generating .env file..."
    
    # Backup existing .env if it exists
    if [ -f "${ENV_FILE}" ]; then
        echo_warning ".env file already exists, backing up to .env.backup"
        cp "${ENV_FILE}" "${ENV_FILE}.backup"
    fi
    
    # Genesis account credentials (default Solo genesis account)
    GENESIS_OPERATOR_ID="0.0.2"
    GENESIS_OPERATOR_KEY="302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137"
    
    # Create .env file
    cat > "${ENV_FILE}" << EOF
# Hiero SDK JS - Local Development Environment Configuration
# Generated on $(date)

# Network Configuration
HEDERA_NETWORK=local-node
CONFIG_FILE=

# Standard Test Account (ECDSA) - Use this for most integration tests
OPERATOR_ID=${OPERATOR_ID}
OPERATOR_KEY=${OPERATOR_KEY}

# Genesis Account - Only use for genesis-specific tests
GENESIS_OPERATOR_ID=${GENESIS_OPERATOR_ID}
GENESIS_OPERATOR_KEY=${GENESIS_OPERATOR_KEY}

# Node Endpoints
NODE1_ENDPOINT=127.0.0.1:50211
NODE2_ENDPOINT=127.0.0.1:51211

# Mirror Node Endpoints
MIRROR_REST_ENDPOINT=http://localhost:5551
MIRROR_WEB3_ENDPOINT=http://localhost:8545
MIRROR_GRPC_ENDPOINT=localhost:5600
EOF
    
    echo_success ".env file created at ${ENV_FILE}"
}

# Main execution
main() {
    echo_info "======================================"
    echo_info "Solo Services Start"
    echo_info "======================================"
    echo ""
    echo_info "Configuration:"
    if [[ -n "${LOCAL_BUILD_PATH}" ]]; then
        echo_info "  - Using local build: ${LOCAL_BUILD_PATH}"
    else
        echo_info "  - Consensus Node Version: ${CONSENSUS_NODE_VERSION}"
    fi
    echo_info "  - Mirror Node Version: ${MIRROR_NODE_VERSION}"
    echo ""
    
    check_prerequisites
    deploy_network
    deploy_mirror
    setup_port_forwarding
    create_test_account
    generate_env_file
    
    echo ""
    echo_success "======================================"
    echo_success "Solo services started!"
    echo_success "======================================"
    echo ""
    echo_info "Your local Hiero network is now running"
    echo_info "Test account: ${OPERATOR_ID}"
    echo ""
    echo_info "To stop services: task solo:stop"
    echo_info "To restart:       task solo:start"
    echo_info "To teardown:      task solo:teardown"
    echo ""
}

# Run main function
main "$@"
