#!/bin/bash

# Fix all hardcoded localhost:8000 references in the frontend
API_VAR="\${process.env.REACT_APP_API_URL || 'http://localhost:8000'}"

# Fix HubbellDashboard.tsx
sed -i "s|http://localhost:8000|${API_VAR}|g" frontend/src/components/dashboard/HubbellDashboard.tsx

# Fix DashboardPreviewLive.tsx
sed -i "s|'http://localhost:8000|'\`${API_VAR}|g" frontend/src/components/dashboard/DashboardPreviewLive.tsx

# Fix SharePanel.tsx
sed -i "s|'http://localhost:8000|'\`${API_VAR}|g" frontend/src/components/dashboard/SharePanel.tsx

# Fix DashboardBuilderEnhanced.tsx
sed -i "s|'http://localhost:8000|'\`${API_VAR}|g" frontend/src/components/dashboard/DashboardBuilderEnhanced.tsx

# Fix HubbellEnhanced.tsx
sed -i "s|http://localhost:8000|${API_VAR}|g" frontend/src/components/dashboard/HubbellEnhanced.tsx

# Fix DashboardBuilderFixed.tsx
sed -i "s|'http://localhost:8000|'\`${API_VAR}|g" frontend/src/components/dashboard/DashboardBuilderFixed.tsx

# Fix HubbellResponsive.tsx
sed -i "s|http://localhost:8000|${API_VAR}|g" frontend/src/components/dashboard/HubbellResponsive.tsx

# Fix TenantDashboard.tsx
sed -i "s|http://localhost:8000|${API_VAR}|g" frontend/src/components/dashboard/TenantDashboard.tsx

echo "Fixed all hardcoded API URLs"