#!/usr/bin/env bash
#
# Teardown Solo local network for hiero-sdk-js
#
# This script:
# 1. Stops all port forwarding processes
# 2. Deletes the Kind Kubernetes cluster
# 3. Cleans up Solo configuration
#

set -e  # Exit on any error

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SOLO_CLUSTER_NAME=solo-cluster
SOLO_NAMESPACE=solo-e2e

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

# Kill port forwarding processes
cleanup_port_forwarding() {
    echo_info "Stopping port forwarding processes..."
    
    # Find and kill kubectl port-forward processes for our namespace
    if pgrep -f "kubectl port-forward.*${SOLO_NAMESPACE}" > /dev/null; then
        pkill -f "kubectl port-forward.*${SOLO_NAMESPACE}" || true
        echo_success "Port forwarding processes stopped"
    else
        echo_info "No port forwarding processes found"
    fi
}

# Delete Kind cluster
delete_cluster() {
    echo_info "Checking for Kind cluster: ${SOLO_CLUSTER_NAME}..."
    
    if command -v kind &> /dev/null; then
        if kind get clusters 2>/dev/null | grep -q "^${SOLO_CLUSTER_NAME}$"; then
            echo_info "Deleting cluster: ${SOLO_CLUSTER_NAME}..."
            kind delete cluster --name "${SOLO_CLUSTER_NAME}"
            echo_success "Cluster deleted"
        else
            echo_info "Cluster not found, nothing to delete"
        fi
    else
        echo_warning "kind command not found, skipping cluster deletion"
    fi
}

# Clean up Solo directory
cleanup_solo_dir() {
    echo_info "Cleaning up Solo configuration..."
    
    if [ -d ~/.solo ]; then
        echo_info "Removing ~/.solo directory..."
        rm -rf ~/.solo
        echo_success "Solo directory removed"
    else
        echo_info "Solo directory not found"
    fi
}

# Optional: Remove .env file
cleanup_env_file() {
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
    ENV_FILE="${PROJECT_ROOT}/.env"
    
    if [ -f "${ENV_FILE}" ]; then
        echo ""
        echo_warning "Found .env file at ${ENV_FILE}"
        read -p "Do you want to remove it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm "${ENV_FILE}"
            echo_success ".env file removed"
        else
            echo_info "Keeping .env file"
        fi
    fi
}

# Main execution
main() {
    echo_info "======================================"
    echo_info "Solo Teardown for hiero-sdk-js"
    echo_info "======================================"
    echo ""
    
    cleanup_port_forwarding
    delete_cluster
    cleanup_solo_dir
    
    # Only ask about .env if not running in CI/automated mode
    if [ -t 0 ]; then
        cleanup_env_file
    fi
    
    echo ""
    echo_success "======================================"
    echo_success "Solo cluster teardown complete!"
    echo_success "======================================"
    echo ""
    echo_info "To set up a new cluster, run:"
    echo_info "  ./scripts/setup-solo.sh"
    echo ""
}

# Run main function
main "$@"

