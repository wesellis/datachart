#!/bin/bash

# Fix more Heroicons v2 imports
echo "Fixing additional Heroicons v2 imports..."

# Fix icons that need renaming
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '
s/TrendingUpIcon/ArrowTrendingUpIcon/g
s/TrendingDownIcon/ArrowTrendingDownIcon/g
s/DatabaseIcon/CircleStackIcon/g
s/RefreshIcon/ArrowPathIcon/g
s/DownloadIcon/ArrowDownTrayIcon/g
s/FilterIcon/FunnelIcon/g
s/SearchIcon/MagnifyingGlassIcon/g
s/AdjustmentsIcon/AdjustmentsHorizontalIcon/g
s/ViewGridIcon/Squares2X2Icon/g
s/LightningBoltIcon/BoltIcon/g
s/AdjustmentsIcon/AdjustmentsHorizontalIcon/g
s/ViewGridIcon/Squares2X2Icon/g
s/ViewListIcon/ListBulletIcon/g
s/GridIcon/Squares2X2Icon/g
'

echo "Additional Heroicons imports fixed!"