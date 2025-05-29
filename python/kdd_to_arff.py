#!/usr/bin/env python3
import argparse
import csv
import os

def csv_to_arff(csv_file, arff_file):
    """Convert CSV file to ARFF format"""
    # Read CSV file
    with open(csv_file, 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        data = list(reader)
    
    # Determine attribute types and values
    attribute_info = {}
    for i, attr in enumerate(header):
        values = set()
        is_numeric = True
        
        for row in data:
            if i < len(row):
                try:
                    float(row[i])
                except ValueError:
                    is_numeric = False
                values.add(row[i])
        
        if is_numeric:
            attribute_info[attr] = 'real'
        else:
            attribute_info[attr] = sorted(list(values))
    
    # Write ARFF file
    with open(arff_file, 'w') as f:
        # Write header
        f.write(f"@relation 'NetworkTraffic'\n\n")
        
        # Write attributes
        for attr in header:
            if attribute_info[attr] == 'real':
                f.write(f"@attribute '{attr}' real\n")
            else:
                values_str = '{' + ', '.join(f"'{v}'" for v in attribute_info[attr]) + '}'
                f.write(f"@attribute '{attr}' {values_str}\n")
        
        # Write data
        f.write("\n@data\n")
        for row in data:
            # Handle missing values and format
            formatted_row = []
            for i, val in enumerate(row):
                if i >= len(header):
                    continue
                    
                if val == '':
                    formatted_row.append('?')
                elif attribute_info[header[i]] == 'real':
                    formatted_row.append(val)
                else:
                    formatted_row.append(f"'{val}'")
                    
            f.write(','.join(formatted_row) + '\n')
    
    print(f"Converted {csv_file} to ARFF format: {arff_file}")

def main():
    parser = argparse.ArgumentParser(description='Convert CSV to ARFF format for WEKA')
    parser.add_argument('csv_file', help='Input CSV file')
    parser.add_argument('-o', '--output', help='Output ARFF file (default: input file with .arff extension)')
    args = parser.parse_args()
    
    if not args.output:
        base_name = os.path.splitext(args.csv_file)[0]
        args.output = f"{base_name}.arff"
    
    csv_to_arff(args.csv_file, args.output)

if __name__ == "__main__":
    main()