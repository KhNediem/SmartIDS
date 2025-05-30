# Network Intrusion Detection System Dashboard

This project combines a Python-based network traffic analyzer with a Next.js dashboard for real-time visualization of network security threats.

## Project Structure

\`\`\`
cybersec-traffic-analyzer/
├── app/                           # Next.js app directory
│   ├── api/                       # API routes
│   │   └── ids/                   # IDS API endpoints
│   │       ├── connections/       # Connection data endpoint
│   │       ├── metrics/           # Metrics and stats endpoint
│   │       └── stream/            # SSE streaming endpoint
│   ├── dashboard/                 # Dashboard page
│   ├── setup/                     # Setup instructions page
│   └── page.tsx                   # Home/model selection page
├── components/                    # React components
│   ├── live-detection.tsx         # Live traffic detection component
│   ├── metrics-chart.tsx          # Performance metrics chart
│   └── ...                        # Other UI components
├── hooks/                         # React hooks
│   └── use-ids-data.ts            # Hook for IDS data
├── lib/                           # Shared utilities
│   └── ids-bridge.ts              # Bridge between Python and Next.js
├── python/                        # Python scripts
│   ├── ids_data_collector.py      # Main IDS collector script
│   └── ids_nextjs_bridge.py       # Bridge to send data to Next.js
└── public/                        # Static assets
\`\`\`

## Setup Instructions

### 1. Next.js Dashboard Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/KhNediem/SmartIDS.git
cd SmartIDS

# Install dependencies
npm install

# Start the development server
npm run dev
\`\`\`

The dashboard will be available at http://localhost:3000

### 2. Python Environment Setup

\`\`\`bash
# Create and activate a virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  | # On Windows: venv\Scripts\activate

# Install required packages
pip install scapy numpy joblib scikit-learn tensorflow requests

# TensorFlow works best with Python versions 3.10-3.11 and it currently does not support Python 3.13

If needed, here's the link to download one those versions : [python.org/downloads](https://www.python.org/downloads/), after selecting the version and running the installer, make sure to tick the option "Add to PATH" during installation.

# For Windows users, you may need to install Npcap:
# Download from https://npcap.com/
\`\`\`

### 3. Running the IDS Collector

\`\`\`bash
# Navigate to the python directory
cd python

# List available network interfaces
python ids_data_collector.py --list-interfaces

# Start the collector (replace "Wi-Fi" with your interface)
python ids_data_collector.py -i "Wi-Fi" -m complete_nn_ids_model.pkl
\`\`\`

(If for some reason, you can't terminate the packet capture from the terminal with CTRL+C, you can terminate it by going to the task manager, it'll be a python process that uses around 270mb of RAM)

### 4. Testing the Integration

\`\`\`bash
# Test the connection between Python and Next.js
python ids_nextjs_bridge.py
\`\`\`

## Integration Details

- The Python IDS collector analyzes network traffic and extracts 41 features
- The `ids_nextjs_bridge.py` script sends data to the Next.js API endpoints
- The Next.js API routes receive and store the data
- The dashboard components fetch and display the data in real-time

## Notes

- Network packet capture requires administrator/root privileges
- Make sure both the Next.js app and Python script are running simultaneously
- The default URL for the Next.js API is http://localhost:3000
\`\`\`

