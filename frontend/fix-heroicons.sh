#!/bin/bash

# Fix Heroicons v2 imports
echo "Fixing Heroicons v2 imports..."

# Fix icons that need renaming
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '
s/BellAlertIcon/BellIcon/g
s/ChevronDoubleRightIcon/ChevronRightIcon/g
s/StatusOnlineIcon/SignalIcon/g
s/SupportIcon/QuestionMarkCircleIcon/g
s/ChipIcon/CpuChipIcon/g
s/DocumentReportIcon/DocumentTextIcon/g
s/CogSolidIcon/CogIcon/g
s/ChatAlt2Icon/ChatBubbleBottomCenterTextIcon/g
s/TerminalIcon/CommandLineIcon/g
'

echo "Heroicons imports fixed!"