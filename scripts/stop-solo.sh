#!/usr/bin/env bash
#
# Stop Solo services for hiero-sdk-js
#
# This script:
# 1. Stops all port forwarding processes
# 2. Destroys mirror node services
# 3. Destroys consensus network
#
# This KEEPS:
# - Kind Kubernetes cluster
# - Solo configuration
# - Deployment configuration
# - Container images
#
# Use start-solo.sh to restart services
# Use teardown-solo.sh for complete removal
#
# Usage:
#   ./stop-solo.sh
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
SOLO_NAMESPACE=solo
SOLO_DEPLOYMENT=solo-deployment

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

# Destroy services without removing cluster
destroy_services() {
    echo_info "Destroying Solo services..."
    
    # Check if cluster exists
    if ! command -v kind &> /dev/null || ! kind get clusters 2>/dev/null | grep -q "^${SOLO_CLUSTER_NAME}$"; then
        echo_warning "Kind cluster not found, nothing to destroy"
        return
    fi
    
    # Check if npx is available
    if ! command -v npx &> /dev/null; then
        echo_error "npx not found. Please install Node.js and try again."
        exit 1
    fi
    
    # Destroy mirror node
    echo_info "Destroying mirror node..."
    if npx solo mirror node destroy --deployment "${SOLO_DEPLOYMENT}" --force --dev 2>/dev/null; then
        echo_success "Mirror node destroyed"
    else
        echo_warning "Failed to destroy mirror node (may not exist)"
    fi
    
    # Destroy the consensus network
    echo_info "Destroying consensus network..."
    if npx solo consensus network destroy --deployment "${SOLO_DEPLOYMENT}" --force --dev 2>/dev/null; then
        echo_success "Consensus network destroyed"
    else
        echo_warning "Failed to destroy consensus network (may not exist)"
    fi
}

# Main execution
main() {
    echo_info "======================================"
    echo_info "Solo Services Stop"
    echo_info "======================================"
    echo ""
    
    cleanup_port_forwarding
    destroy_services
    
    echo ""
    echo_success "======================================"
    echo_success "Solo services stopped!"
    echo_success "======================================"
    echo ""
    echo_info "Infrastructure preserved (cluster, config, images)"
    echo ""
    echo_info "To restart services: task solo:start"
    echo_info "To teardown all:     task solo:teardown"
    echo ""
}

# Run main function
main "$@"

