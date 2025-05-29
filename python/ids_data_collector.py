#!/usr/bin/env python3
import argparse
import time
import csv
import os
import sys
import traceback
from collections import defaultdict, deque
from datetime import datetime
import threading
import warnings
import glob
import requests  # Added for Next.js integration

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", category=FutureWarning)

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, Raw, get_if_list
    import numpy as np
    from joblib import load
    DEPENDENCIES_AVAILABLE = True
except ImportError as e:
    print(f"Missing dependencies: {e}")
    print("Please install required packages: pip install scapy numpy joblib scikit-learn")
    DEPENDENCIES_AVAILABLE = False

try:
    import tensorflow as tf
    from tensorflow.keras.models import model_from_json
    from tensorflow.keras.optimizers import Adam
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False

class ConnectionKey:
    """Class to uniquely identify a connection"""
    def __init__(self, src_ip, dst_ip, src_port, dst_port, protocol):
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port if src_port is not None else 0
        self.dst_port = dst_port if dst_port is not None else 0
        self.protocol = protocol
        
    def __hash__(self):
        return hash((self.src_ip, self.dst_ip, self.src_port, self.dst_port, self.protocol))
    
    def __eq__(self, other):
        return (self.src_ip == other.src_ip and
                self.dst_ip == other.dst_ip and
                self.src_port == other.src_port and
                self.dst_port == other.dst_port and
                self.protocol == other.protocol)
    
    def __str__(self):
        return f"{self.src_ip}:{self.src_port} -> {self.dst_ip}:{self.dst_port} ({self.protocol})"

class IDSDataCollector:
    def __init__(self, interface=None, output_file="ids_data.csv", timeout=None, window_size=2, use_ml=True, model_name="hids_model.pkl", nextjs_url=None):
        self.interface = interface
        self.output_file = output_file
        self.timeout = timeout
        self.window_size = window_size
        self.use_ml = use_ml
        self.model_name = model_name
        
        # Next.js integration
        self.nextjs_url = nextjs_url
        self.nextjs_enabled = nextjs_url is not None
        if self.nextjs_enabled:
            print(f"✓ Next.js integration enabled: {self.nextjs_url}")
        
        # Connection tracking
        self.active_connections = {}
        self.completed_connections = []
        self.connection_history = deque(maxlen=10000)
        
        # Host tracking for host-based features
        self.host_connections = defaultdict(list)
        self.service_connections = defaultdict(list)
        
        # TCP flag definitions
        self.tcp_flags = {
            'S': 0x02,  # SYN
            'A': 0x10,  # ACK
            'F': 0x01,  # FIN
            'R': 0x04,  # RST
            'P': 0x08,  # PSH
            'U': 0x20,  # URG
        }
        
        # Service mapping
        self.service_map = self._initialize_service_map()
        
        # ML components
        self.model = None
        self.label_encoders = None
        self.scaler = None
        self.ml_loaded = False
        self.feature_names = None
        self.is_neural_network = False
        
        # Load ML components if available and requested
        if self.use_ml:
            self._load_ml_components()
        
        # Start time
        self.start_time = datetime.now()
        
        # CSV header
        self.csv_header = [
            'duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes',
            'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in',
            'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations',
            'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login',
            'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate',
            'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate',
            'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count',
            'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
            'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate',
            'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 'class'
        ]
        
        # Statistics
        self.packet_count = 0
        self.error_count = 0
        
        # Send initial stats to Next.js if enabled
        if self.nextjs_enabled:
            self._send_stats_to_nextjs()
    
    def _send_stats_to_nextjs(self):
        """Send current stats to Next.js dashboard"""
        if not self.nextjs_enabled:
            return
            
        try:
            stats_data = {
                "type": "stats",
                "data": {
                    "totalPackets": self.packet_count,
                    "activeConnections": len(self.active_connections),
                    "completedConnections": len(self.completed_connections),
                    "errors": self.error_count,
                    "startTime": self.start_time.isoformat(),
                    "modelName": self.model_name
                }
            }
            
            response = requests.post(
                f"{self.nextjs_url}/api/ids/metrics",
                json=stats_data,
                timeout=5
            )
            
            if response.status_code == 200:
                print("✓ Sent stats to Next.js dashboard")
            else:
                print(f"⚠ Failed to send stats: {response.status_code}")
                
        except Exception as e:
            print(f"⚠ Error sending stats to Next.js: {e}")
    
    def _send_connection_to_nextjs(self, connection_record, conn_key):
        """Send a connection record to Next.js dashboard"""
        if not self.nextjs_enabled:
            return
            
        try:
            # Add connection key information
            api_data = connection_record.copy()
            api_data["src_ip"] = conn_key.src_ip
            api_data["dst_ip"] = conn_key.dst_ip
            api_data["src_port"] = conn_key.src_port
            api_data["dst_port"] = conn_key.dst_port
            api_data["protocol"] = conn_key.protocol
            
            response = requests.post(
                f"{self.nextjs_url}/api/ids/connections",
                json=api_data,
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"\n✓ Sent connection to dashboard: {conn_key}")
            else:
                print(f"\n⚠ Failed to send connection: {response.status_code}")
                
        except Exception as e:
            print(f"\n⚠ Error sending connection to Next.js: {e}")
    
    @staticmethod
    def list_available_models():
        """List all available model files in the current directory"""
        model_files = glob.glob("*.pkl")
        # Filter out label encoders and scalers
        model_files = [f for f in model_files if f not in ["label_encoders.pkl", "scaler.pkl"]]
        return model_files
    
    def _load_ml_components(self):
        """Load machine learning components with error handling"""
        try:
            if os.path.exists(self.model_name):
                # Load the model file
                model_data = load(self.model_name)
                
                # Check if it's a neural network package (dictionary) or regular model
                if isinstance(model_data, dict) and 'model_architecture' in model_data:
                    # This is a neural network package
                    if not TENSORFLOW_AVAILABLE:
                        print("⚠ TensorFlow not available, cannot load neural network model")
                        self.use_ml = False
                        return
                    
                    print(f"✓ Loading Neural Network package: {self.model_name}")
                    self.is_neural_network = True
                    
                    # Reconstruct the neural network model
                    model = model_from_json(model_data['model_architecture'])
                    model.set_weights(model_data['model_weights'])
                    
                    # Compile the model
                    model.compile(
                        optimizer=Adam(learning_rate=model_data['model_config']['learning_rate']),
                        loss=model_data['model_config']['loss'],
                        metrics=model_data['model_config']['metrics']
                    )
                    
                    self.model = model
                    self.scaler = model_data['scaler']
                    
                    # Store feature names if available
                    if 'feature_names' in model_data:
                        self.feature_names = model_data['feature_names']
                        print(f"✓ Loaded feature names: {len(self.feature_names)} features")
                    
                    # For neural networks, we need to handle label encoders differently
                    # Create dummy label encoders if not provided
                    if 'label_encoders' in model_data:
                        self.label_encoders = model_data['label_encoders']
                        print("✓ Loaded label encoders from model package")
                    else:
                        # Load separate label encoders file
                        if os.path.exists('label_encoders.pkl'):
                            self.label_encoders = load('label_encoders.pkl')
                            print("✓ Loaded separate label encoders")
                        else:
                            print("⚠ No label encoders found, creating dummy encoders")
                            # Create basic label encoders for the categorical fields
                            from sklearn.preprocessing import LabelEncoder
                            self.label_encoders = {}
                            for field in ['protocol_type', 'service', 'flag']:
                                le = LabelEncoder()
                                # Fit with common values
                                if field == 'protocol_type':
                                    le.fit(['tcp', 'udp', 'icmp'])
                                elif field == 'service':
                                    le.fit(['http', 'ftp', 'smtp', 'other'])
                                elif field == 'flag':
                                    le.fit(['SF', 'S0', 'REJ', 'RSTO', 'S1', 'OTH'])
                                self.label_encoders[field] = le
                    
                    print("✓ Neural Network model loaded and compiled successfully")
                    
                else:
                    # Regular scikit-learn model
                    self.model = model_data
                    print(f"✓ Loaded ML model: {self.model_name}")
                    
                    # Load scaler and label encoders separately
                    if os.path.exists('scaler.pkl'):
                        self.scaler = load('scaler.pkl')
                        print("✓ Loaded feature scaler")
                    else:
                        print("⚠ Scaler file not found")
                        self.use_ml = False
                        return
                        
                    if os.path.exists('label_encoders.pkl'):
                        self.label_encoders = load('label_encoders.pkl')
                        print("✓ Loaded label encoders")
                    else:
                        print("⚠ Label encoders file not found")
                        self.use_ml = False
                        return
                
                self.ml_loaded = True
                print("✓ All ML components loaded successfully")
                
            else:
                print(f"⚠ ML model file '{self.model_name}' not found, running without predictions")
                self.use_ml = False
                return
                
        except Exception as e:
            print(f"⚠ Error loading ML components: {e}")
            print("Running without ML predictions")
            self.use_ml = False
            self.ml_loaded = False
    
    def predict_record(self, record):
        """Predict if a connection record is anomalous"""
        if not self.use_ml or not self.ml_loaded:
            return 0  # Default to normal
        
        try:
            record_input = record.copy()
            record_input.pop('class', None)
        
            # Handle categorical features
            categorical_fields = ['protocol_type', 'service', 'flag']
            for field in categorical_fields:
                if field in record_input and field in self.label_encoders:
                    try:
                        # Convert to string and encode
                        value_str = str(record_input[field])
                        # Handle unknown categories
                        try:
                            encoded_value = self.label_encoders[field].transform([value_str])[0]
                            record_input[field] = encoded_value
                        except ValueError:
                            # Unknown category, use a default value (0)
                            record_input[field] = 0
                    except Exception as e:
                        print(f"Warning: Error encoding {field}: {e}")
                        record_input[field] = 0
        
            # Convert all values to numeric
            numeric_values = []
            
            # If we have feature names from the model, use those
            if self.feature_names:
                for feature in self.feature_names:
                    if feature in record_input:
                        try:
                            value = float(record_input[feature])
                            numeric_values.append(value)
                        except (ValueError, TypeError):
                            numeric_values.append(0.0)
                    else:
                        numeric_values.append(0.0)
            else:
                # Otherwise use the CSV header (excluding 'class')
                for key in self.csv_header[:-1]:  # Exclude 'class' column
                    if key in record_input:
                        try:
                            value = float(record_input[key])
                            numeric_values.append(value)
                        except (ValueError, TypeError):
                            numeric_values.append(0.0)
                    else:
                        numeric_values.append(0.0)
        
            # Create feature array
            features = np.array([numeric_values])
            
            # Debug info
            if len(numeric_values) != 41:
                print(f"Warning: Feature count mismatch. Expected 41, got {len(numeric_values)}")
        
            # Scale features
            if self.scaler:
                try:
                    scaled_features = self.scaler.transform(features)
                except Exception as e:
                    print(f"Error scaling features: {e}")
                    print(f"Feature count: {len(numeric_values)}")
                    return 0  # Default to normal
            else:
                scaled_features = features
        
            # Make prediction - handle both scikit-learn and TensorFlow models
            if self.is_neural_network:
                # TensorFlow/Keras model
                prediction_prob = self.model.predict(scaled_features, verbose=0)[0][0]
                prediction = 1 if prediction_prob > 0.5 else 0
            else:
                # Scikit-learn model
                prediction = self.model.predict(scaled_features)[0]
        
            return prediction
        
        except Exception as e:
            print(f"Warning: Error in prediction: {e}")
            return 0  # Default to normal
    
    def _initialize_service_map(self):
        """Initialize port to service mapping"""
        return {
            21: 'ftp', 20: 'ftp_data', 22: 'ssh', 23: 'telnet', 25: 'smtp',
            53: 'domain', 67: 'domain_u', 68: 'domain_u', 69: 'tftp_u',
            70: 'gopher', 79: 'finger', 80: 'http', 88: 'kerberos',
            109: 'pop_2', 110: 'pop_3', 113: 'auth', 119: 'nntp',
            123: 'ntp_u', 137: 'netbios_ns', 138: 'netbios_dgm',
            139: 'netbios_ssn', 143: 'imap4', 161: 'snmp', 162: 'snmp',
            179: 'bgp', 389: 'ldap', 443: 'http_443', 445: 'microsoft-ds',
            465: 'smtps', 514: 'shell', 520: 'efs', 543: 'klogin',
            544: 'kshell', 993: 'imaps', 995: 'pop3s', 1433: 'sql_net',
            3306: 'mysql', 5432: 'postgresql', 8001: 'http_8001',
            8080: 'http_proxy', 8443: 'https_proxy', 6667: 'IRC'
        }
    
    def packet_callback(self, packet):
        """Process each captured packet with improved error handling"""
        try:
            self.packet_count += 1
            
            if IP not in packet:
                return
                
            # Extract packet information
            src_ip = packet[IP].src
            dst_ip = packet[IP].dst
            protocol = None
            src_port = None
            dst_port = None
            flags = None
            
            # Protocol-specific extraction
            if TCP in packet:
                protocol = 'tcp'
                src_port = packet[TCP].sport
                dst_port = packet[TCP].dport
                flags = packet[TCP].flags
            elif UDP in packet:
                protocol = 'udp'
                src_port = packet[UDP].sport
                dst_port = packet[UDP].dport
            elif ICMP in packet:
                protocol = 'icmp'
            else:
                return
            
            # Create connection key
            conn_key = ConnectionKey(src_ip, dst_ip, src_port, dst_port, protocol)
            
            # Initialize new connection
            if conn_key not in self.active_connections:
                self.active_connections[conn_key] = {
                    'start_time': datetime.now(),
                    'src_bytes': 0,
                    'dst_bytes': 0,
                    'src_packets': 0,
                    'dst_packets': 0,
                    'flags': set(),
                    'urgent': 0,
                    'wrong_fragment': 0,
                    'land': 1 if src_ip == dst_ip and src_port == dst_port and src_port != 0 else 0,
                    'service': self._get_service(dst_port)
                }
            
            # Update connection data
            conn_data = self.active_connections[conn_key]
            packet_len = len(packet)
            
            conn_data['src_bytes'] += packet_len
            conn_data['src_packets'] += 1
            
            # Handle TCP flags
            if protocol == 'tcp' and flags:
                for flag_name, flag_value in self.tcp_flags.items():
                    if flags & flag_value:
                        conn_data['flags'].add(flag_name)
                        
                if flags & self.tcp_flags['U']:
                    conn_data['urgent'] += 1
            
            # Check for fragmentation
            if packet[IP].flags == 1 or packet[IP].frag != 0:
                conn_data['wrong_fragment'] += 1
            
            # Check if TCP connection is complete
            if protocol == 'tcp' and ('F' in conn_data['flags'] or 'R' in conn_data['flags']):
                self._complete_connection(conn_key)
            
            # Print progress every 100 packets
            if self.packet_count % 100 == 0:
                print(f"\rPackets: {self.packet_count}, Active: {len(self.active_connections)}, "
                      f"Completed: {len(self.completed_connections)}, Errors: {self.error_count}", end="")
                
                # Send stats to Next.js if enabled
                if self.nextjs_enabled and self.packet_count % 500 == 0:
                    self._send_stats_to_nextjs()
                
        except Exception as e:
            self.error_count += 1
            if self.error_count <= 5:  # Only print first few errors
                print(f"\nError processing packet: {e}")
                if self.error_count == 5:
                    print("Suppressing further error messages...")
    
    def _get_service(self, port):
        """Map port to service name"""
        if port is None:
            return 'other'
        return self.service_map.get(port, 'other')
    
    def _get_connection_flag(self, conn_data):
        """Determine connection flag based on TCP flags"""
        flags = conn_data['flags']
        
        if 'S' in flags and 'F' in flags:
            return 'SF'
        elif 'S' in flags and not ('F' in flags or 'R' in flags):
            return 'S0'
        elif 'R' in flags:
            return 'REJ'
        elif 'R' in flags and 'S' in flags:
            return 'RSTO'
        elif 'S' in flags and 'A' in flags:
            return 'S1'
        else:
            return 'OTH'
    
    def _complete_connection(self, conn_key):
        """Complete a connection and create record"""
        try:
            if conn_key not in self.active_connections:
                return
                
            conn_data = self.active_connections[conn_key]
            duration = (datetime.now() - conn_data['start_time']).total_seconds()
            
            # Get recent connections for features
            recent_conns = self._get_recent_connections(conn_key.dst_ip, conn_key.dst_port, conn_key.protocol)
            
            # Create basic record
            record = {
                'duration': duration,
                'protocol_type': conn_key.protocol,
                'service': conn_data['service'],
                'flag': self._get_connection_flag(conn_data),
                'src_bytes': conn_data['src_bytes'],
                'dst_bytes': conn_data.get('dst_bytes', 0),
                'land': conn_data['land'],
                'wrong_fragment': conn_data['wrong_fragment'],
                'urgent': conn_data['urgent'],
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
                'is_guest_login': 0,
                'count': len(recent_conns['same_host']),
                'srv_count': len(recent_conns['same_service']),
            }
            
            # Calculate rates
            same_host_count = len(recent_conns['same_host'])
            same_service_count = len(recent_conns['same_service'])
            
            if same_host_count > 0:
                record['serror_rate'] = sum(1 for c in recent_conns['same_host'] 
                                          if 'S' in c['flags'] and 'A' not in c['flags']) / same_host_count
                record['rerror_rate'] = sum(1 for c in recent_conns['same_host'] 
                                          if 'R' in c['flags']) / same_host_count
                record['same_srv_rate'] = sum(1 for c in recent_conns['same_host'] 
                                            if c['service'] == conn_data['service']) / same_host_count
                record['diff_srv_rate'] = 1.0 - record['same_srv_rate']
            else:
                record['serror_rate'] = 0.0
                record['rerror_rate'] = 0.0
                record['same_srv_rate'] = 0.0
                record['diff_srv_rate'] = 0.0
            
            if same_service_count > 0:
                record['srv_serror_rate'] = sum(1 for c in recent_conns['same_service'] 
                                              if 'S' in c['flags'] and 'A' not in c['flags']) / same_service_count
                record['srv_rerror_rate'] = sum(1 for c in recent_conns['same_service'] 
                                              if 'R' in c['flags']) / same_service_count
                record['srv_diff_host_rate'] = sum(1 for c in recent_conns['same_service'] 
                                                 if c['dst_ip'] != conn_key.dst_ip) / same_service_count
            else:
                record['srv_serror_rate'] = 0.0
                record['srv_rerror_rate'] = 0.0
                record['srv_diff_host_rate'] = 0.0
            
            # Host-based features
            dst_host_conns = self._get_host_connections(conn_key.dst_ip)
            dst_host_count = len(dst_host_conns)
            
            if dst_host_count > 0:
                record['dst_host_count'] = dst_host_count
                record['dst_host_srv_count'] = sum(1 for c in dst_host_conns 
                                                 if c['service'] == conn_data['service'])
                record['dst_host_same_srv_rate'] = record['dst_host_srv_count'] / dst_host_count
                record['dst_host_diff_srv_rate'] = 1.0 - record['dst_host_same_srv_rate']
                record['dst_host_same_src_port_rate'] = sum(1 for c in dst_host_conns 
                                                          if c['src_port'] == conn_key.src_port) / dst_host_count
                record['dst_host_serror_rate'] = sum(1 for c in dst_host_conns 
                                                   if 'S' in c['flags'] and 'A' not in c['flags']) / dst_host_count
                record['dst_host_rerror_rate'] = sum(1 for c in dst_host_conns 
                                                   if 'R' in c['flags']) / dst_host_count
                
                srv_host_conns = [c for c in dst_host_conns if c['service'] == conn_data['service']]
                srv_host_count = len(srv_host_conns)
                
                if srv_host_count > 0:
                    record['dst_host_srv_serror_rate'] = sum(1 for c in srv_host_conns 
                                                           if 'S' in c['flags'] and 'A' not in c['flags']) / srv_host_count
                    record['dst_host_srv_rerror_rate'] = sum(1 for c in srv_host_conns 
                                                           if 'R' in c['flags']) / srv_host_count
                    record['dst_host_srv_diff_host_rate'] = sum(1 for c in srv_host_conns 
                                                              if c['src_ip'] != conn_key.src_ip) / srv_host_count
                else:
                    record['dst_host_srv_serror_rate'] = 0.0
                    record['dst_host_srv_rerror_rate'] = 0.0
                    record['dst_host_srv_diff_host_rate'] = 0.0
                    
                record['dst_host_srv_diff_host_rate'] = record.get('dst_host_srv_diff_host_rate', 0.0)
            else:
                # Set all dst_host features to 0
                for key in ['dst_host_count', 'dst_host_srv_count', 'dst_host_same_srv_rate',
                           'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate',
                           'dst_host_serror_rate', 'dst_host_rerror_rate',
                           'dst_host_srv_serror_rate', 'dst_host_srv_rerror_rate',
                           'dst_host_srv_diff_host_rate']:
                    record[key] = 0.0
            
            # Make prediction
            if self.use_ml and self.ml_loaded:
                try:
                    prediction = self.predict_record(record)
                    record['class'] = 'anomaly' if prediction == 1 else 'normal'
                    
                    if record['class'] == 'anomaly':
                        print(f"\n🚨 [ALERT] Potential intrusion detected: {conn_key}")
                        print(f"   Service: {record['service']}, Duration: {duration:.2f}s")
                except Exception as e:
                    print(f"\nWarning: Prediction failed: {e}")
                    record['class'] = 'normal'
            else:
                record['class'] = 'normal'
            
            # Add to completed connections
            self.completed_connections.append(record)
            
            # Add to connection history
            conn_history_entry = {
                'time': datetime.now(),
                'src_ip': conn_key.src_ip,
                'dst_ip': conn_key.dst_ip,
                'src_port': conn_key.src_port,
                'dst_port': conn_key.dst_port,
                'protocol': conn_key.protocol,
                'service': conn_data['service'],
                'flags': conn_data['flags']
            }
            self.connection_history.append(conn_history_entry)
            self.host_connections[conn_key.dst_ip].append(conn_history_entry)
            
            # Send to Next.js if enabled
            if self.nextjs_enabled:
                self._send_connection_to_nextjs(record, conn_key)
            
            # Remove from active connections
            del self.active_connections[conn_key]
            
        except Exception as e:
            print(f"\nError completing connection: {e}")
            # Remove problematic connection
            if conn_key in self.active_connections:
                del self.active_connections[conn_key]
    
    def _get_recent_connections(self, dst_ip, dst_port, protocol):
        """Get recent connections for time-based features"""
        now = datetime.now()
        window_start = now.timestamp() - self.window_size
        
        recent_conns = {'same_host': [], 'same_service': []}
        
        for conn in self.connection_history:
            if conn['time'].timestamp() < window_start:
                continue
                
            if conn['dst_ip'] == dst_ip:
                recent_conns['same_host'].append(conn)
                
            service = self._get_service(dst_port)
            if conn['service'] == service:
                recent_conns['same_service'].append(conn)
                
        return recent_conns
    
    def _get_host_connections(self, dst_ip):
        """Get connections to a specific host"""
        return self.host_connections.get(dst_ip, [])
    
    def cleanup_connections(self):
        """Clean up stale connections"""
        now = datetime.now()
        stale_keys = []
        
        for conn_key, conn_data in self.active_connections.items():
            if (now - conn_data['start_time']).total_seconds() > 60:
                stale_keys.append(conn_key)
        
        for conn_key in stale_keys:
            self._complete_connection(conn_key)
    
    def write_output(self):
        """Write collected data to CSV file"""
        try:
            with open(self.output_file, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=self.csv_header)
                writer.writeheader()
                writer.writerows(self.completed_connections)
            
            print(f"\n✓ Wrote {len(self.completed_connections)} connection records to {self.output_file}")
            
            # Print summary statistics
            if self.completed_connections:
                anomaly_count = sum(1 for record in self.completed_connections if record['class'] == 'anomaly')
                print(f"✓ Normal connections: {len(self.completed_connections) - anomaly_count}")
                print(f"⚠ Anomalous connections: {anomaly_count}")
                
        except Exception as e:
            print(f"Error writing output file: {e}")
    
    def list_interfaces(self):
        """List available network interfaces"""
        try:
            interfaces = get_if_list()
            print("Available network interfaces:")
            for i, iface in enumerate(interfaces):
                print(f"  {i}: {iface}")
            return interfaces
        except Exception as e:
            print(f"Error listing interfaces: {e}")
            return []
    
    def start_capture(self):
        """Start capturing packets"""
        if not DEPENDENCIES_AVAILABLE:
            print("Cannot start capture: missing dependencies")
            return
        
        print(f"🚀 Starting network capture on {'all interfaces' if not self.interface else self.interface}")
        print(f"📊 ML model: {self.model_name if self.use_ml and self.ml_loaded else 'disabled'}")
        print(f"💾 Output file: {self.output_file}")
        print(f"⏱️  Window size: {self.window_size} seconds")
        if self.nextjs_enabled:
            print(f"🌐 Next.js integration: {self.nextjs_url}")
        print("Press Ctrl+C to stop the capture and save data\n")
        
        # Validate interface
        if self.interface:
            available_interfaces = self.list_interfaces()
            if self.interface not in available_interfaces:
                print(f"⚠ Warning: Interface '{self.interface}' not found in available interfaces")
                print("Trying anyway...")
        
        try:
            # Start cleanup thread
            stop_event = threading.Event()
            
            def cleanup_thread():
                while not stop_event.is_set():
                    self.cleanup_connections()
                    time.sleep(5)
            
            cleanup = threading.Thread(target=cleanup_thread, daemon=True)
            cleanup.start()
            
            # Start packet capture
            sniff(
                iface=self.interface,
                prn=self.packet_callback,
                store=0,
                timeout=self.timeout
            )
            
        except KeyboardInterrupt:
            print("\n\n🛑 Capture stopped by user")
        except Exception as e:
            print(f"\n❌ Error during capture: {e}")
            print("Note: Packet capture typically requires administrator/root privileges")
            traceback.print_exc()
        finally:
            # Stop cleanup thread
            if 'stop_event' in locals():
                stop_event.set()
            
            # Final cleanup
            print("🧹 Cleaning up connections...")
            self.cleanup_connections()
            
            # Write output
            self.write_output()
            
            # Send final stats to Next.js
            if self.nextjs_enabled:
                self._send_stats_to_nextjs()
            
            # Print final summary
            duration = datetime.now() - self.start_time
            print(f"\n📈 Capture Summary:")
            print(f"   Duration: {duration}")
            print(f"   Packets processed: {self.packet_count}")
            print(f"   Connections completed: {len(self.completed_connections)}")
            print(f"   Active connections: {len(self.active_connections)}")
            print(f"   Processing errors: {self.error_count}")
            print(f"   Model used: {self.model_name if self.use_ml and self.ml_loaded else 'None'}")

def main():
    parser = argparse.ArgumentParser(
        description='Network Intrusion Detection System Data Collector',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ids_data_collector.py --list-interfaces
  python ids_data_collector.py --list-models
  python ids_data_collector.py -i "Wi-Fi" -o output.csv
  python ids_data_collector.py -i eth0 -m complete_nn_ids_model.pkl
  python ids_data_collector.py -i eth0 -t 60 --no-ml
  python ids_data_collector.py -i eth0 --nextjs http://localhost:3000
        """
    )
    
    parser.add_argument('-i', '--interface', help='Network interface to capture')
    parser.add_argument('-o', '--output', default='ids_data.csv', help='Output CSV file')
    parser.add_argument('-t', '--timeout', type=int, help='Capture timeout in seconds')
    parser.add_argument('-w', '--window', type=int, default=2, help='Time window for features (seconds)')
    parser.add_argument('-m', '--model', default='hids_model.pkl', help='ML model to use for classification')
    parser.add_argument('--no-ml', action='store_true', help='Disable machine learning predictions')
    parser.add_argument('--list-interfaces', action='store_true', help='List available network interfaces')
    parser.add_argument('--list-models', action='store_true', help='List available ML models')
    parser.add_argument('--nextjs', help='Next.js dashboard URL (e.g., http://localhost:3000)')
    
    args = parser.parse_args()
    
    if args.list_interfaces:
        collector = IDSDataCollector()
        collector.list_interfaces()
        return
    
    if args.list_models:
        models = IDSDataCollector.list_available_models()
        if models:
            print("Available ML models:")
            for i, model in enumerate(models):
                print(f"  {i}: {model}")
        else:
            print("No ML models found in the current directory.")
        return
    
    collector = IDSDataCollector(
        interface=args.interface,
        output_file=args.output,
        timeout=args.timeout,
        window_size=args.window,
        use_ml=not args.no_ml,
        model_name=args.model,
        nextjs_url=args.nextjs
    )
    
    collector.start_capture()

if __name__ == "__main__":
    main()
