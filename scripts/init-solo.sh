#!/usr/bin/env bash
#
# Initialize Solo local network infrastructure for hiero-sdk-js
#
# This script performs ONE-TIME setup:
# 1. Creates Kind Kubernetes cluster
# 2. Initializes Solo
# 3. Sets up deployment configuration
#
# After running this, use start-solo.sh to deploy services
#
# Usage:
#   ./init-solo.sh [options]
#
# Options:
#   --num-nodes <number>    Number of consensus nodes (default: 1)
#   -h, --help             Show this help message
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
DEFAULT_NUM_NODES=1

# Parse command line arguments
show_help() {
    echo "Usage: ./init-solo.sh [options]"
    echo ""
    echo "Options:"
    echo "  --num-nodes <number>    Number of consensus nodes (default: ${DEFAULT_NUM_NODES})"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./init-solo.sh                # Single node (default)"
    echo "  ./init-solo.sh --num-nodes 2  # Two nodes (for DAB tests)"
    exit 0
}

# Initialize with defaults
NUM_NODES=${DEFAULT_NUM_NODES}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --num-nodes)
            NUM_NODES="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            ;;
        *)
            echo "Unknown option: $1"
            echo "Run './init-solo.sh --help' for usage information"
            exit 1
            ;;
    esac
done

# Configuration
export SOLO_CLUSTER_NAME=solo-cluster
export SOLO_NAMESPACE=solo
export SOLO_CLUSTER_SETUP_NAMESPACE=solo-cluster-setup
export SOLO_DEPLOYMENT=solo-deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

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
        echo_info "Please run 'task install' or 'pnpm install' first"
        exit 1
    fi
    
    echo_success "All dependencies are installed"
}

# Create Kind cluster
create_cluster() {
    if kind get clusters 2>/dev/null | grep -q "^${SOLO_CLUSTER_NAME}$"; then
        echo_info "Kind cluster '${SOLO_CLUSTER_NAME}' already exists"
        return 0
    fi
    
    echo_info "Creating Kind cluster: ${SOLO_CLUSTER_NAME}..."
    kind create cluster -n "${SOLO_CLUSTER_NAME}"
    echo_success "Cluster created"
}

# Initialize Solo
initialize_solo() {
    if [ -d ~/.solo ]; then
        echo_info "Solo already initialized"
        return 0
    fi
    
    echo_info "Initializing Solo..."
    npx solo init
    echo_success "Solo initialized"
}

# Setup Solo deployment
setup_deployment() {
    echo_info "Setting up Solo deployment configuration..."
    
    # Check if deployment exists in local-config.yaml
    if [ -f ~/.solo/local-config.yaml ] && grep -q "name: ${SOLO_DEPLOYMENT}" ~/.solo/local-config.yaml 2>/dev/null; then
        echo_info "Deployment '${SOLO_DEPLOYMENT}' already configured"
        return 0
    fi
    
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
    echo_info "Attaching cluster to deployment (${NUM_NODES} node(s))..."
    npx solo deployment cluster attach \
        --deployment "${SOLO_DEPLOYMENT}" \
        --cluster-ref "${SOLO_CLUSTER_NAME}" \
        --num-consensus-nodes "${NUM_NODES}" \
        --dev
    
    # Setup cluster
    echo_info "Setting up cluster..."
    npx solo cluster-ref config setup \
        --cluster-ref "${SOLO_CLUSTER_NAME}" \
        --dev
    
    echo_success "Deployment configured"
}

# Main execution
main() {
    echo_info "======================================"
    echo_info "Solo Infrastructure Init"
    echo_info "======================================"
    echo ""
    echo_info "Configuration:"
    echo_info "  - Number of nodes: ${NUM_NODES}"
    echo ""
    
    check_dependencies
    create_cluster
    initialize_solo
    setup_deployment
    
    echo ""
    echo_success "======================================"
    echo_success "Solo infrastructure initialized!"
    echo_success "======================================"
    echo ""
    echo_info "Next steps:"
    echo_info "  1. Start services: task solo:start"
    echo_info "  2. Stop services:  task solo:stop"
    echo_info "  3. Full teardown:  task solo:teardown"
    echo ""
}

# Run main function
main "$@"
