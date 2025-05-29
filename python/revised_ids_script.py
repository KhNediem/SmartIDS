
#!/usr/bin/env python3
import argparse
import time
import csv
import os
from collections import defaultdict, deque
from datetime import datetime
from joblib import load
import numpy as np
from scapy.all import sniff, IP, TCP, UDP, ICMP

# Load model and preprocessing tools
model = load('hids_model.pkl')
label_encoders = load('label_encoders.pkl')
scaler = load('scaler.pkl')

class ConnectionKey:
    def __init__(self, src_ip, dst_ip, src_port, dst_port, protocol):
        self.src_ip = src_ip
        self.dst_ip = dst_ip
        self.src_port = src_port or 0
        self.dst_port = dst_port or 0
        self.protocol = protocol

    def __hash__(self):
        return hash((self.src_ip, self.dst_ip, self.src_port, self.dst_port, self.protocol))

    def __eq__(self, other):
        return (self.src_ip, self.dst_ip, self.src_port, self.dst_port, self.protocol) == (other.src_ip, other.dst_ip, other.src_port, other.dst_port, other.protocol)

    def __str__(self):
        return f"{self.src_ip}:{self.src_port} -> {self.dst_ip}:{self.dst_port} ({self.protocol})"

class IDS:
    def __init__(self, interface=None, timeout=60):
        self.interface = interface
        self.timeout = timeout
        self.active_connections = {}
        self.start_time = datetime.now()
        self.connection_history = deque(maxlen=1000)

        self.service_map = {80: 'http', 443: 'http_443', 22: 'ssh', 21: 'ftp', 53: 'domain'}

    def _get_service(self, port):
        return self.service_map.get(port, 'other')

    def predict_record(self, record):
        for field in ['protocol_type', 'service', 'flag']:
            value = record[field]
            record[field] = label_encoders[field].transform([str(value)])[0]

        # Ensure all values are numeric
        features = np.array([list(record.values())], dtype=float)
        scaled = scaler.transform(features)
        return model.predict(scaled)[0]


    def _process_packet(self, packet):
        if IP not in packet:
            return

        proto = 'tcp' if TCP in packet else 'udp' if UDP in packet else 'icmp' if ICMP in packet else None
        if proto is None:
            return

        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        src_port = packet.sport if hasattr(packet, 'sport') else 0
        dst_port = packet.dport if hasattr(packet, 'dport') else 0

        conn_key = ConnectionKey(src_ip, dst_ip, src_port, dst_port, proto)

        if conn_key not in self.active_connections:
            self.active_connections[conn_key] = {
                'start_time': datetime.now(),
                'src_bytes': 0,
                'dst_bytes': 0,
                'protocol_type': proto,
                'service': self._get_service(dst_port),
                'flag': 'SF',
                'land': int(src_ip == dst_ip and src_port == dst_port),
                'wrong_fragment': 0,
                'urgent': 0,
                'hot': 0, 'num_failed_logins': 0, 'logged_in': 0,
                'num_compromised': 0, 'root_shell': 0, 'su_attempted': 0,
                'num_root': 0, 'num_file_creations': 0, 'num_shells': 0,
                'num_access_files': 0, 'num_outbound_cmds': 0,
                'is_host_login': 0, 'is_guest_login': 0,
                'count': 0, 'srv_count': 0,
                'serror_rate': 0.0, 'srv_serror_rate': 0.0,
                'rerror_rate': 0.0, 'srv_rerror_rate': 0.0,
                'same_srv_rate': 0.0, 'diff_srv_rate': 0.0,
                'srv_diff_host_rate': 0.0, 'dst_host_count': 0,
                'dst_host_srv_count': 0, 'dst_host_same_srv_rate': 0.0,
                'dst_host_diff_srv_rate': 0.0, 'dst_host_same_src_port_rate': 0.0,
                'dst_host_srv_diff_host_rate': 0.0, 'dst_host_serror_rate': 0.0,
                'dst_host_srv_serror_rate': 0.0, 'dst_host_rerror_rate': 0.0,
                'dst_host_srv_rerror_rate': 0.0
            }

        data = self.active_connections[conn_key]
        data['src_bytes'] += len(packet)
        duration = (datetime.now() - data['start_time']).total_seconds()
        data['duration'] = duration

        prediction = self.predict_record(data)
        label = 'anomaly' if prediction == 1 else 'normal'

        if label == 'anomaly':
            print(f"[ALERT] Intrusion detected: {conn_key}")

        del self.active_connections[conn_key]

    def start(self):
        print(f"Starting IDS on interface: {self.interface or 'default'}")
        sniff(iface=self.interface, prn=self._process_packet, timeout=self.timeout, store=False)
        print(f"Capture complete. Duration: {datetime.now() - self.start_time}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-i', '--interface', help='Network interface to sniff', required=True)
    parser.add_argument('-t', '--timeout', type=int, default=60, help='Capture duration in seconds')
    args = parser.parse_args()

    ids = IDS(interface=args.interface, timeout=args.timeout)
    ids.start()

if __name__ == '__main__':
    main()
