import pandas as pd

# Load the dataset (adjust the filename if needed)
df = pd.read_csv("kddcup99_csv.csv", header=None)

# Display the last few columns to identify the label column
# print(df.tail())

# The label is usually the last column (column index -1)
label_column = df.columns[-1]

# Replace "neptune" and "smurf" with "anomaly"
df[label_column] = df[label_column].replace(['neptune', 'smurf'], 'anomaly')

# Save the modified dataset
df.to_csv("nsl_kdd_modified.csv", index=False, header=False)

print("Labels 'neptune' and 'smurf' replaced with 'anomaly'. Saved as 'nsl_kdd_modified.csv'.")
