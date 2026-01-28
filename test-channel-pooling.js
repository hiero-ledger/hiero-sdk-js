/**
 * Simple test script to verify channel pooling implementation
 *
 * This tests the basic functionality without requiring a live network connection
 */

import { Client } from "./src/index.js";

console.log("=== Channel Pooling POC Test ===\n");

// Test 1: Default configuration
console.log("Test 1: Default configuration (1 channel per node)");
try {
    const client1 = Client.forTestnet();
    console.log(`✅ channelsPerNode: ${client1.channelsPerNode}`);
    console.log(`   Expected: 1, Got: ${client1.channelsPerNode}`);
    if (client1.channelsPerNode !== 1) {
        throw new Error("Default value should be 1");
    }
    client1.close();
    console.log("   PASSED\n");
} catch (error) {
    console.error(`❌ FAILED: ${error.message}\n`);
}

// Test 2: Custom configuration in constructor
console.log("Test 2: Custom configuration via constructor");
try {
    const client2 = Client.forTestnet({ channelsPerNode: 5 });
    console.log(`✅ channelsPerNode: ${client2.channelsPerNode}`);
    console.log(`   Expected: 5, Got: ${client2.channelsPerNode}`);
    if (client2.channelsPerNode !== 5) {
        throw new Error("Should be set to 5");
    }
    client2.close();
    console.log("   PASSED\n");
} catch (error) {
    console.error(`❌ FAILED: ${error.message}\n`);
}

// Test 3: Setter method
console.log("Test 3: Configuration via setter");
try {
    const client3 = Client.forTestnet();
    client3.setChannelsPerNode(10);
    console.log(`✅ channelsPerNode: ${client3.channelsPerNode}`);
    console.log(`   Expected: 10, Got: ${client3.channelsPerNode}`);
    if (client3.channelsPerNode !== 10) {
        throw new Error("Should be set to 10");
    }
    client3.close();
    console.log("   PASSED\n");
} catch (error) {
    console.error(`❌ FAILED: ${error.message}\n`);
}

// Test 4: Validation - zero value
console.log("Test 4: Validation - zero value should throw error");
try {
    const client4 = Client.forTestnet();
    client4.setChannelsPerNode(0);
    console.error("❌ FAILED: Should have thrown an error for 0\n");
    client4.close();
} catch (error) {
    if (error.message.includes("positive number")) {
        console.log("✅ Correctly rejected 0");
        console.log(`   Error: ${error.message}`);
        console.log("   PASSED\n");
    } else {
        console.error(`❌ FAILED: Wrong error: ${error.message}\n`);
    }
}

// Test 5: Validation - negative value
console.log("Test 5: Validation - negative value should throw error");
try {
    const client5 = Client.forTestnet();
    client5.setChannelsPerNode(-1);
    console.error("❌ FAILED: Should have thrown an error for -1\n");
    client5.close();
} catch (error) {
    if (error.message.includes("positive number")) {
        console.log("✅ Correctly rejected -1");
        console.log(`   Error: ${error.message}`);
        console.log("   PASSED\n");
    } else {
        console.error(`❌ FAILED: Wrong error: ${error.message}\n`);
    }
}

// Test 6: Warning for high values
console.log("Test 6: Warning for high values (should warn but not error)");
try {
    const client6 = Client.forTestnet();
    console.log("   (Should see a warning message below)");
    client6.setChannelsPerNode(25);
    console.log(`✅ channelsPerNode: ${client6.channelsPerNode}`);
    console.log(`   Expected: 25, Got: ${client6.channelsPerNode}`);
    if (client6.channelsPerNode !== 25) {
        throw new Error("Should be set to 25 despite warning");
    }
    client6.close();
    console.log("   PASSED\n");
} catch (error) {
    console.error(`❌ FAILED: ${error.message}\n`);
}

// Test 7: Decimal values should be floored
console.log("Test 7: Decimal values should be floored to integers");
try {
    const client7 = Client.forTestnet();
    client7.setChannelsPerNode(5.7);
    console.log(`✅ channelsPerNode: ${client7.channelsPerNode}`);
    console.log(`   Expected: 5, Got: ${client7.channelsPerNode}`);
    if (client7.channelsPerNode !== 5) {
        throw new Error("Should be floored to 5");
    }
    client7.close();
    console.log("   PASSED\n");
} catch (error) {
    console.error(`❌ FAILED: ${error.message}\n`);
}

console.log("=== Test Summary ===");
console.log("✅ All basic configuration tests completed");
console.log("\nNote: This tests configuration only.");
console.log("For full testing, run integration tests with actual network requests.");
console.log("\nTo test with real requests:");
console.log("  node examples/high-concurrency-with-pooling.js");

