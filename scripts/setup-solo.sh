#!/usr/bin/env bash
#
# Setup Solo local network for hiero-sdk-js development and integration testing
#
# This script:
# 1. Creates a Kind Kubernetes cluster
# 2. Initializes Solo
# 3. Deploys a 2-node consensus network
# 4. Deploys mirror node services
# 5. Sets up port forwarding
# 6. Creates a dedicated ECDSA test account
# 7. Generates .env file with account credentials
#

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
export SOLO_CLUSTER_NAME=solo-cluster
export SOLO_NAMESPACE=solo
export SOLO_CLUSTER_SETUP_NAMESPACE=solo-cluster-setup
export SOLO_DEPLOYMENT=solo-deployment
export CONSENSUS_NODE_VERSION=v0.69.1
export MIRROR_NODE_VERSION=v0.145.2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
HBAR_AMOUNT=10000000

# Check if running from project root or scripts directory
cd "${PROJECT_ROOT}"

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

# Check for required dependencies
check_dependencies() {
    echo_info "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v kind &> /dev/null; then
        missing_deps+=("kind")
    fi
    
    if ! command -v kubectl &> /dev/null; then
        missing_deps+=("kubectl")
    fi
    
    if ! command -v npx &> /dev/null; then
        missing_deps+=("npx")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo_error "Missing required dependencies: ${missing_deps[*]}"
        echo_info "Please install:"
        for dep in "${missing_deps[@]}"; do
            case $dep in
                kind)
                    echo "  - kind: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
                    ;;
                kubectl)
                    echo "  - kubectl: https://kubernetes.io/docs/tasks/tools/"
                    ;;
                npx)
                    echo "  - npx: comes with Node.js (npm install -g npx)"
                    ;;
            esac
        done
        exit 1
    fi
    
    # Check if Solo is installed
    echo_info "Checking if Solo is installed..."
    if ! npx solo --version &> /dev/null; then
        echo_error "Solo is not installed as a project dependency"
        echo_info "Please run 'task install' or 'pnpm install' first to install project dependencies including Solo"
        exit 1
    fi
    
    echo_success "All dependencies are installed"
}

# Clean up previous state
cleanup_previous() {
    echo_info "Cleaning up previous Solo state..."
    
    if kind get clusters 2>/dev/null | grep -q "^${SOLO_CLUSTER_NAME}$"; then
        echo_info "Deleting existing cluster: ${SOLO_CLUSTER_NAME}"
        kind delete cluster --name "${SOLO_CLUSTER_NAME}" || true
    fi
    
    if [ -d ~/.solo ]; then
        echo_info "Removing ~/.solo directory"
        rm -rf ~/.solo
    fi
    
    echo_success "Cleanup complete"
}

# Create Kind cluster and initialize Solo
initialize_solo() {
    echo_info "Creating Kind cluster: ${SOLO_CLUSTER_NAME}..."
    kind create cluster -n "${SOLO_CLUSTER_NAME}"
    echo_success "Cluster created"
    
    echo_info "Initializing Solo..."
    npx solo init
    echo_success "Solo initialized"
}

# Setup Solo deployment
setup_deployment() {
    echo_info "Setting up Solo deployment..."
    
    # Connect to cluster
    echo_info "Connecting to cluster..."
    npx solo cluster-ref config connect \
        --cluster-ref "${SOLO_CLUSTER_NAME}" \
        --context "kind-${SOLO_CLUSTER_NAME}" \
        --dev
    
    # Create deployment
    echo_info "Creating deployment: ${SOLO_DEPLOYMENT}..."
    npx solo deployment config create \
        --deployment "${SOLO_DEPLOYMENT}" \
        --namespace "${SOLO_NAMESPACE}" \
        --dev
    
    # Add cluster to deployment
    echo_info "Attaching cluster to deployment..."
    npx solo deployment cluster attach \
        --deployment "${SOLO_DEPLOYMENT}" \
        --cluster-ref "${SOLO_CLUSTER_NAME}" \
        --num-consensus-nodes 2 \
        --dev
    
    # Setup cluster
    echo_info "Setting up cluster..."
    npx solo cluster-ref config setup \
        --cluster-ref "${SOLO_CLUSTER_NAME}" \
        --dev
    
    echo_success "Deployment setup complete"
}

# Generate and deploy network
deploy_network() {
    echo_info "Generating consensus keys..."
    npx solo keys consensus generate \
        --gossip-keys \
        --tls-keys \
        --deployment "${SOLO_DEPLOYMENT}" \
        --dev
    
    echo_info "Deploying consensus network..."
    npx solo consensus network deploy \
        --deployment "${SOLO_DEPLOYMENT}" \
        -i node1,node2 \
        --dev
    
    echo_info "Setting up consensus nodes..."
    npx solo consensus node setup \
        --deployment "${SOLO_DEPLOYMENT}" \
        -i node1,node2 \
        --dev
    
    echo_info "Starting consensus nodes..."
    npx solo consensus node start \
        --deployment "${SOLO_DEPLOYMENT}" \
        -i node1,node2 \
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
    echo_info "Setting up port forwarding..."
    
    # Kill any existing port-forward processes
    pkill -f "kubectl port-forward.*${SOLO_NAMESPACE}" || true
    sleep 2
    
    # Node 1 - Consensus
    kubectl port-forward svc/haproxy-node1-svc -n "${SOLO_NAMESPACE}" 50211:50211 > /dev/null 2>&1 &
    echo_info "  - Node 1 (consensus): localhost:50211"
    
    # Node 2 - Consensus
    kubectl port-forward svc/haproxy-node2-svc -n "${SOLO_NAMESPACE}" 51211:50211 > /dev/null 2>&1 &
    echo_info "  - Node 2 (consensus): localhost:51211"
    
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

# Browser Test Configuration (for Vite)
VITE_OPERATOR_ID=${OPERATOR_ID}
VITE_OPERATOR_KEY=${OPERATOR_KEY}
VITE_HEDERA_NETWORK=local-node
EOF
    
    echo_success ".env file created at ${ENV_FILE}"
}

# Main execution
main() {
    echo_info "======================================"
    echo_info "Solo Setup for hiero-sdk-js"
    echo_info "======================================"
    echo ""
    
    check_dependencies
    cleanup_previous
    initialize_solo
    setup_deployment
    deploy_network
    deploy_mirror
    setup_port_forwarding
    create_test_account
    generate_env_file
    
    echo ""
    echo_success "======================================"
    echo_success "Solo cluster setup complete!"
    echo_success "======================================"
    echo ""
    echo_info "Your local Hiero network is now running with:"
    echo_info "  - 2 consensus nodes"
    echo_info "  - Mirror node services"
    echo_info "  - Dedicated ECDSA test account: ${OPERATOR_ID}"
    echo ""
    echo_info "Environment variables have been written to: ${ENV_FILE}"
    echo ""
    echo_info "To run integration tests:"
    echo_info "  npm run test:integration"
    echo ""
    echo_info "To tear down the cluster:"
    echo_info "  ./scripts/teardown-solo.sh"
    echo ""
}

# Run main function
main "$@"

