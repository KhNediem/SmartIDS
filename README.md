# Network Intrusion Detection System

A real-time network traffic analyzer that uses machine learning to detect intrusions and classify traffic sources. The system combines Python-based packet analysis with a Next.js dashboard for visualization.

## 🌟 Key Features (Solution Description)

- **Dual ML Models**: Neural Network (96.5% accuracy) and XGBoost (91.8% accuracy)
- **Dynamic Model Switching**: Change models in real-time without service interruption
- **Binary Classification**: Classify traffic as normal or malicious
- **Real-time Visualization**: Live dashboard with interactive charts and metrics
- **41-Feature Analysis**: Complete NSL-KDD dataset compatibility
- **Live Packet Capture**: Support for real-time network traffic monitoring

## 📋 Requirements

- **Python**: 3.10-3.11 (TensorFlow does not currently support Python 3.13)
- **Node.js**: 18.0 or higher
- **Operating System**: Windows, macOS, or Linux
- **Network Access**: Administrator/root privileges for packet capture


**Model Weights**: The neural network weights are available in the repository:
- [weight_statistics.csv](https://github.com/KhNediem/SmartIDS-The-Packet-Sniffers/blob/master/weight_statistics.csv)
- Weights are also included in the technical report in a more concise form

## 🚀 Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/KhNediem/SmartIDS-The-Packet-Sniffers
cd SmartIDS-The-Packet-Sniffers
```

### 2. Set Up the Dashboard

```bash
# Install Next.js dependencies
npm install

# Start the dashboard
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000)

### 3. Set Up the Python Environment

```bash
# Create and activate a virtual environment (optional but recommended)
python -m venv venv

# On Windows
source venv/Scripts/activate

# On macOS/Linux
source venv/bin/activate

# Install required packages
pip install scapy numpy joblib scikit-learn tensorflow requests

# Note: TensorFlow works best with Python versions 3.10-3.11
# If you need to download a compatible Python version: https://www.python.org/downloads/
# Make sure to tick "Add to PATH" during installation on Windows
```

### 4. Install Packet Capture Dependencies

**Windows**:
- Download and install [Npcap](https://npcap.com/)

**Linux**:
```bash
# Ubuntu/Debian
sudo apt-get install libpcap-dev

# CentOS/RHEL
sudo yum install libpcap-devel
```

**macOS**:
- No additional installation required

## 🔍 Running the System

### 1. Start the Dashboard

Ensure the Next.js dashboard is running:

```bash
npm run dev
```

### 2. List Available Network Interfaces (Open another bash window)

```bash
# Navigate to the python directory
cd python

# List available interfaces
python ids_data_collector.py --list-interfaces
```

### 3. Start the IDS Collector 

```bash
# Replace "Wi-Fi" with your network interface name
python ids_data_collector.py -i "Wi-Fi" --nextjs http://localhost:3000
#After successfully running the IDS collector, you can switch between ML models in the dashboard on the top of the page
```


**Note**: If you can't terminate the packet capture from the terminal with CTRL+C, you can terminate it by going to the task manager. Look for a Python process that uses around 270MB of memory.

### 4. Test the Connection

```bash
# Test the connection between Python and Next.js
python ids_nextjs_bridge.py
```

### 5. View the Dashboard

Open your browser and navigate to:

```
http://localhost:3000
```


## 📊 Dashboard Features

### Real-time Metrics
- Live traffic analysis and classification
- Binary intrusion detection (normal vs malicious)
- Model performance statistics
- Network interface monitoring

### Interactive Visualizations
- Traffic flow charts
- Threat detection timeline
- Classification breakdown
- Model accuracy comparisons

## 🛠️ Integration Details

- The Python IDS collector analyzes network traffic and extracts 41 features
- The `ids_nextjs_bridge.py` script sends data to the Next.js API endpoints
- The Next.js API routes receive and store the data
- The dashboard components fetch and display the data in real-time

## 🔧 Troubleshooting

### Common Issues

**Permission Denied (Packet Capture)**:
```bash
# Linux/macOS - Run with sudo
sudo python python/ids_data_collector.py -i eth0 --nextjs http://localhost:3000

# Windows - Run as Administrator
```

**Network Interface Not Found**:
```bash
# List all available interfaces
python python/ids_data_collector.py --list-interfaces
```

**Dashboard Not Loading**:
```bash
# Check if Node.js server is running
npm run dev

# Verify port 3000 is available
netstat -an | grep 3000
```

**Python Version Compatibility**:
- Ensure you're using Python 3.10-3.11 for TensorFlow compatibility
- Download compatible versions from [python.org/downloads](https://www.python.org/downloads/)

## 📝 Important Notes

- Network packet capture requires administrator/root privileges
- Make sure both the Next.js app and Python script are running simultaneously
- The default URL for the Next.js API is http://localhost:3000
- The system provides binary classification: normal vs malicious traffic
- All models are trained on the NSL-KDD dataset for network intrusion detection

## 🎯 Key Achievements

- Functional real-time ML pipeline for network traffic analysis
- Python-based packet inspection with live dashboard
- Binary classification using neural networks and XGBoost (normal || malicious)
- Support for live packet capture and real-time visualization
