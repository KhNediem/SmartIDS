# Network Intrusion Detection System Dashboard

This project combines a Python-based network traffic analyzer with a Next.js dashboard for real-time visualization of network security threats.

Here is the csv file containing the weight for the neural networks model : [weight_statistics.csv](https://github.com/KhNediem/SmartIDS-The-Packet-Sniffers/blob/master/weight_statistics.csv)

The weights are also included in the technical report, in a shorter more concise form.


## Setup Instructions

### 1. Next.js Dashboard Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/KhNediem/SmartIDS-The-Packet-Sniffers
cd SmartIDS-The-Packet-Sniffers

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

python ids_data_collector.py -i "Wi-Fi" --nextjs http://localhost:3000 
\`\`\`

(If for some reason, you can't terminate the packet capture from the terminal with CTRL+C, you can terminate it by going to the task manager, it'll be a python process that uses around 270mb of memory)

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



## Description of the solution
A real-time intrusion detections system for network traffic, implemented through a combination of machine learning models and a simple web dashboard.
The Python backend captures live network traffic, processes the packets to extract features, and classify them using models trained on the NSL-KDD dataset.
The results and predictions are visualized in real time through a Node.js frontend.

## Key achievements 
- Functional real-time ML pipeline for network traffic analysis.
- Python based packet inspection with a live dashboard.
- Binary classification using neural networks and XGBooost ( normal || malicious ) .
- Support for live packet capture.
