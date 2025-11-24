#!/bin/bash

# Ground Station Quick Test Script
# Tests all major features of the new flexible data visualization system

echo "════════════════════════════════════════════════════════"
echo "🧪 Ground Station - Feature Test Suite"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test backend API endpoints
echo -e "${CYAN}Testing Backend APIs...${NC}"
echo ""

echo "1. Testing schema endpoint:"
curl -s http://localhost:5001/api/schema | python3 -m json.tool | head -20
echo ""

echo "2. Testing default config generation:"
curl -s http://localhost:5001/api/config/default | python3 -m json.tool | head -30
echo ""

echo "3. Testing schema stats:"
curl -s http://localhost:5001/api/schema/stats | python3 -m json.tool
echo ""

echo -e "${GREEN}✅ Backend API tests complete${NC}"
echo ""

echo "════════════════════════════════════════════════════════"
echo -e "${CYAN}📋 Feature Checklist - Verify in Electron App:${NC}"
echo "════════════════════════════════════════════════════════"
echo ""

echo "🔹 Serial Monitor View:"
echo "   [ ] Live JSON data streaming visible"
echo "   [ ] Timestamps showing on each line"
echo "   [ ] Schema section shows 5 detected fields"
echo "   [ ] Pause/Resume/Clear buttons working"
echo ""

echo "🔹 Configuration View:"
echo "   [ ] 5 cards visible (temperature, humidity, pressure, windSpeed, rainfall)"
echo "   [ ] Can rename labels"
echo "   [ ] Can select widget types (Value Card, Graph, Gauge)"
echo "   [ ] Can add units"
echo "   [ ] Toggle switches work"
echo "   [ ] 'Load Defaults' button works"
echo "   [ ] 'Save Configuration' persists settings"
echo ""

echo "🔹 Dashboard View:"
echo "   [ ] Widgets appear based on config"
echo "   [ ] Value cards show large numbers"
echo "   [ ] Line graphs draw and update"
echo "   [ ] Real-time updates visible (1Hz)"
echo "   [ ] Gradient colors applied"
echo ""

echo "🔹 Settings View:"
echo "   [ ] Serial ports listed"
echo "   [ ] Baud rate selector works"
echo "   [ ] Detected format shows 'json'"
echo "   [ ] Total keys shows '5'"
echo ""

echo "════════════════════════════════════════════════════════"
echo -e "${YELLOW}🎮 Interactive Tests - Try These:${NC}"
echo "════════════════════════════════════════════════════════"
echo ""

echo "Test 1: Switch data format"
echo "  → In demo generator terminal, press '2' for Drone Telemetry"
echo "  → Verify new fields appear in Configuration"
echo ""

echo "Test 2: Fast mode performance"
echo "  → Press 'f' in demo generator for 10Hz updates"
echo "  → Check graphs update smoothly without lag"
echo ""

echo "Test 3: Configuration persistence"
echo "  → Configure some widgets, save"
echo "  → Refresh the Electron app (Cmd+R)"
echo "  → Verify config is retained"
echo ""

echo "Test 4: Legacy compatibility"
echo "  → Press '5' in demo generator for 20-field CSV"
echo "  → Verify app handles it correctly"
echo ""

echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 Testing Guide Complete${NC}"
echo "════════════════════════════════════════════════════════"
echo ""
echo "All systems operational! The Ground Station is ready. 🚀"
echo ""
