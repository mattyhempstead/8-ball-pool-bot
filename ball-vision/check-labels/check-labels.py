"""
    Sorts the labels into folders for each checking of data integrity (probably using file manager)
"""
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.image as mpimg
import os
from shutil import copyfile
from pathlib import Path


# checksum, type, x, y
LABELS_FILE_HEADER = "filename,type,x,y"
LABELS_FILE = "../ball-labels.csv"


for i in range(16):
    Path(str(i)).mkdir(parents=True, exist_ok=True)



if os.path.isfile(LABELS_FILE):
    with open(LABELS_FILE, "r") as file:
        rows = [row[:-1].split(",") for row in file.readlines()[1:]]
        for row in rows:
            src = "../ball-images/{}".format(row[0])
            dst = "./{}/{}".format(row[1], row[0])
            print("Copying {} to {}".format(src, dst))
            copyfile(src, dst)

