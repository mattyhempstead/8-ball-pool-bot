"""
    A script to declare the centre of a ball and classify it.
"""

import matplotlib.pyplot as plt
import numpy as np
import matplotlib.image as mpimg
import csv
import os

# checksum, type, x, y
CLASSIFICATIONS_FILE_HEADER = "filename,type,x,y"
CLASSIFICATIONS_FILE = "./ball-classifications.csv"

ball_data = {}
if os.path.isfile(CLASSIFICATIONS_FILE):
    with open(CLASSIFICATIONS_FILE, "r") as file:
        rows = [row[:-1].split(",") for row in file.readlines()[1:]]
        for row in rows:
            ball_data[row[0]] = [int(row[1]), float(row[2]), float(row[3])]
            

print("Read {} labelled balls".format(len(ball_data.keys())))
# print(ball_data)


#plt.ion()


class Ball_Classifier(object):
    def __init__(self, ax):
        self.images = os.listdir('ball-images')
        self.current_image = None

        self.ax = ax

        self.circle1 = plt.Circle((0, 0), 0.1, color='r')
        self.circle2 = plt.Circle((0, 0), 13, color='r', fill=False)

        # text location in axes coords
        # self.txt = ax.text(0.7, 0.9, '', transform=ax.transAxes)

        self.clicking = True

    def mouse_move(self, event):
        if not event.inaxes:
            return

        x, y = event.xdata, event.ydata

        self.circle1.center = (x,y)
        self.ax.add_patch(self.circle1)
        
        self.circle2.center = (x,y)
        self.ax.add_patch(self.circle2)

        # self.txt.set_text('x=%1.2f, y=%1.2f' % (x, y))
        self.ax.figure.canvas.draw()


    def mouse_click(self, event):
        if not self.clicking:
            return

        if not event.inaxes:
            return

        if event.button == 3:
            self.save_and_exit()


        prev_center = plt.Circle((event.xdata, event.ydata), 0.2, color='#00ffff')
        self.ax.add_patch(prev_center)

        self.clicking = False
        

        while True:
            ball_num = input("Enter ball number: ")
            if not ball_num.isnumeric() or int(ball_num) < 0 or int(ball_num) > 15:
                print("Invalid ball number")
                continue

            ball_data[self.current_image] = [int(ball_num), event.xdata, event.ydata]
            print("You entered", ball_num)
            break


        self.clicking = True

        self.next_image()

    
    def next_image(self):
        self.ax.clear()

        # Find first un-labelled image
        missing_labels = [i for i in self.images if i not in ball_data.keys()]
        if len(missing_labels) == 0:
            self.save_and_exit()
        
        self.current_image = missing_labels[0]
        img = mpimg.imread('ball-images/{}'.format(self.current_image))
        
        self.ax.imshow(img)

        # if self.current_image in ball_data:
        #     prev_ball_data = ball_data[self.images[self.image_index]]
        #     prev_center = plt.Circle((prev_ball_data[1], prev_ball_data[2]), 0.2, color='#00ff00')
        #     self.ax.add_patch(prev_center)


    def save_and_exit(self):
        with open(CLASSIFICATIONS_FILE, "w") as file:
            file.write(CLASSIFICATIONS_FILE_HEADER + "\n")
            for key in ball_data.keys():
                row = ",".join([key, str(ball_data[key][0]), str(ball_data[key][1]), str(ball_data[key][2])])
                row += "\n"
                file.write(row)

        exit()




fig,ax = plt.subplots()

ball_classifier = Ball_Classifier(ax)

fig.canvas.mpl_connect('motion_notify_event', ball_classifier.mouse_move)
fig.canvas.mpl_connect('button_press_event', ball_classifier.mouse_click)

ball_classifier.next_image()

plt.show()

