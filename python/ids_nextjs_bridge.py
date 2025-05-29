#!/usr/bin/env python3
"""
Bridge script to send IDS data to Next.js dashboard
This script can be used to test the connection between Python and Next.js
"""

import requests
import json
import time
from datetime import datetime

class NextJSBridge:
    def __init__(self, nextjs_url="http://localhost:3000"):
        self.nextjs_url = nextjs_url
        self.connections_endpoint = f"{nextjs_url}/api/ids/connections"
        self.metrics_endpoint = f"{nextjs_url}/api/ids/metrics"
        
    def send_connection(self, connection_record):
        """Send a connection record to Next.js dashboard"""
        try:
            # Convert the IDS record format to our API format
            api_data = {
                "src_ip": getattr(connection_record, 'src_ip', '192.168.1.100'),
                "dst_ip": getattr(connection_record, 'dst_ip', '10.0.0.1'),
                "src_port": getattr(connection_record, 'src_port', 12345),
                "dst_port": getattr(connection_record, 'dst_port', 80),
                "protocol_type": connection_record.get('protocol_type', 'tcp'),
                "service": connection_record.get('service', 'http'),
                "duration": connection_record.get('duration', 0),
                "src_bytes": connection_record.get('src_bytes', 0),
                "dst_bytes": connection_record.get('dst_bytes', 0),
                "class": connection_record.get('class', 'normal'),
                "confidence": 0.95,  # You can calculate this based on your model
                "flag": connection_record.get('flag', 'SF'),
                # Include all 41 features
                **{k: v for k, v in connection_record.items() if k not in ['src_ip', 'dst_ip', 'src_port', 'dst_port']}
            }
            
            response = requests.post(
                self.connections_endpoint,
                json=api_data,
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✓ Sent connection to dashboard: {api_data.get('src_ip')} -> {api_data.get('dst_ip')}")
                return True
            else:
                print(f"⚠ Failed to send connection: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"⚠ Network error sending to dashboard: {e}")
            return False
        except Exception as e:
            print(f"⚠ Error sending connection: {e}")
            return False
    
    def send_stats(self, stats_data):
        """Send statistics update to Next.js dashboard"""
        try:
            api_data = {
                "type": "stats",
                "data": {
                    "totalPackets": stats_data.get('packet_count', 0),
                    "activeConnections": stats_data.get('active_connections', 0),
                    "completedConnections": stats_data.get('completed_connections', 0),
                    "errors": stats_data.get('error_count', 0),
                    "startTime": stats_data.get('start_time', datetime.now().isoformat()),
                    "modelName": stats_data.get('model_name', 'unknown')
                }
            }
            
            response = requests.post(
                self.metrics_endpoint,
                json=api_data,
                timeout=5
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"⚠ Error sending stats: {e}")
            return False
    
    def test_connection(self):
        """Test connection to Next.js dashboard"""
        try:
            response = requests.get(f"{self.nextjs_url}/api/ids/metrics", timeout=5)
            if response.status_code == 200:
                print("✓ Successfully connected to Next.js dashboard")
                return True
            else:
                print(f"⚠ Dashboard responded with status: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Cannot connect to Next.js dashboard: {e}")
            print("Make sure the Next.js app is running on http://localhost:3000")
            return False

# Example usage and testing
if __name__ == "__main__":
    bridge = NextJSBridge()
    
    print("🔗 Testing connection to Next.js dashboard...")
    if bridge.test_connection():
        print("\n🧪 Sending test data...")
        
        # Send some test connections
        test_connections = [
            {
                'protocol_type': 'tcp',
                'service': 'http',
                'duration': 1.5,
                'src_bytes': 1024,
                'dst_bytes': 2048,
                'class': 'normal',
                'flag': 'SF',
                'count': 1,
                'srv_count': 1,
                'serror_rate': 0.0,
                'srv_serror_rate': 0.0,
                'rerror_rate': 0.0,
                'srv_rerror_rate': 0.0,
                'same_srv_rate': 1.0,
                'diff_srv_rate': 0.0,
                'srv_diff_host_rate': 0.0,
                'dst_host_count': 1,
                'dst_host_srv_count': 1,
                'dst_host_same_srv_rate': 1.0,
                'dst_host_diff_srv_rate': 0.0,
                'dst_host_same_src_port_rate': 1.0,
                'dst_host_srv_diff_host_rate': 0.0,
                'dst_host_serror_rate': 0.0,
                'dst_host_srv_serror_rate': 0.0,
                'dst_host_rerror_rate': 0.0,
                'dst_host_srv_rerror_rate': 0.0,
                'land': 0,
                'wrong_fragment': 0,
                'urgent': 0,
                'hot': 0,
                'num_failed_logins': 0,
                'logged_in': 0,
                'num_compromised': 0,
                'root_shell': 0,
                'su_attempted': 0,
                'num_root': 0,
                'num_file_creations': 0,
                'num_shells': 0,
                'num_access_files': 0,
                'num_outbound_cmds': 0,
                'is_host_login': 0,
                'is_guest_login': 0
            },
            {
                'protocol_type': 'tcp',
                'service': 'ftp',
                'duration': 0.1,
                'src_bytes': 512,
                'dst_bytes': 0,
                'class': 'anomaly',
                'flag': 'S0',
                'count': 5,
                'srv_count': 1,
                'serror_rate': 0.8,
                'srv_serror_rate': 0.8,
                'rerror_rate': 0.0,
                'srv_rerror_rate': 0.0,
                'same_srv_rate': 0.2,
                'diff_srv_rate': 0.8,
                'srv_diff_host_rate': 0.0,
                'dst_host_count': 5,
                'dst_host_srv_count': 1,
                'dst_host_same_srv_rate': 0.2,
                'dst_host_diff_srv_rate': 0.8,
                'dst_host_same_src_port_rate': 0.2,
                'dst_host_srv_diff_host_rate': 0.0,
                'dst_host_serror_rate': 0.8,
                'dst_host_srv_serror_rate': 0.8,
                'dst_host_rerror_rate': 0.0,
                'dst_host_srv_rerror_rate': 0.0,
                'land': 0,
                'wrong_fragment': 0,
                'urgent': 0,
                'hot': 0,
                'num_failed_logins': 0,
                'logged_in': 0,
                'num_compromised': 0,
                'root_shell': 0,
                'su_attempted': 0,
                'num_root': 0,
                'num_file_creations': 0,
                'num_shells': 0,
                'num_access_files': 0,
                'num_outbound_cmds': 0,
                'is_host_login': 0,
                'is_guest_login': 0
            }
        ]
        
        for i, conn in enumerate(test_connections):
            bridge.send_connection(conn)
            time.sleep(2)  # Wait 2 seconds between connections
        
        # Send test stats
        test_stats = {
            'packet_count': 1500,
            'active_connections': 12,
            'completed_connections': len(test_connections),
            'error_count': 0,
            'start_time': datetime.now().isoformat(),
            'model_name': 'test_model.pkl'
        }
        
        bridge.send_stats(test_stats)
        print("\n✅ Test data sent successfully!")
        print("Check your Next.js dashboard to see the live data.")
        
    else:
        print("\n❌ Could not connect to dashboard. Please ensure:")
        print("1. Next.js app is running (npm run dev)")
        print("2. Dashboard is accessible at http://localhost:3000")
        print("3. No firewall is blocking the connection")
