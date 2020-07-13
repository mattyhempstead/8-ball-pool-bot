"""
    A script to allow the user to manually declare the centre of a ball and label it's type.
"""

import matplotlib.pyplot as plt
import numpy as np
import matplotlib.image as mpimg
import os

# checksum, type, x, y
LABELS_FILE_HEADER = "filename,type,x,y"
LABELS_FILE = "./ball-labels.csv"

ball_data = {}
if os.path.isfile(LABELS_FILE):
    with open(LABELS_FILE, "r") as file:
        rows = [row[:-1].split(",") for row in file.readlines()[1:]]
        for row in rows:
            ball_data[row[0]] = [int(row[1]), float(row[2]), float(row[3])]
            

print("Read {} labelled balls".format(len(ball_data.keys())))
# print(ball_data)


plt.ion()


class Ball_Labeller(object):
    def __init__(self, ax):
        self.images = os.listdir('ball-images')

        self.current_idx = -1
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
        if (event.dblclick) or (not event.inaxes) or (not self.clicking):
            return

        if event.button == 3:
            print("Skipping image")
            self.next_image()
            self.clicking = True
            return


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

        print("Labelled {}".format(self.current_image))
        self.next_image()

    
    def next_image(self):
        self.ax.clear()

        # Find first un-labelled image
        # missing_labels = [i for i in self.images if i not in ball_data.keys()]
        # if len(missing_labels) == 0:
        #     self.save_and_exit()

        self.current_idx = (self.current_idx + 1) % len(self.images)
        self.current_image = self.images[self.current_idx]

        # self.current_image = missing_labels[0]
        img = mpimg.imread('ball-images/{}'.format(self.current_image))
        self.ax.imshow(img)

        if self.current_image in ball_data:
            prev_ball_data = ball_data[self.current_image]

            print("Currently labelled as {}".format(prev_ball_data[0]))

            prev_center = plt.Circle((prev_ball_data[1], prev_ball_data[2]), 0.2, color='#00ff00')
            self.ax.add_patch(prev_center)





fig,ax = plt.subplots()

ball_labeller = Ball_Labeller(ax)

fig.canvas.mpl_connect('motion_notify_event', ball_labeller.mouse_move)
fig.canvas.mpl_connect('button_press_event', ball_labeller.mouse_click)

ball_labeller.next_image()

plt.show()


# Save when user closes plot
print("Saving and Exiting")
with open(LABELS_FILE, "w") as file:
    file.write(LABELS_FILE_HEADER + "\n")
    for key in ball_data.keys():
        row = ",".join([key, str(ball_data[key][0]), str(ball_data[key][1]), str(ball_data[key][2])])
        row += "\n"
        file.write(row)
