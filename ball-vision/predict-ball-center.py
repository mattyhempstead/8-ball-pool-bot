import os, sys, random, math
import numpy as np
import tensorflow as tf
from tensorflow import keras
import matplotlib.pyplot as plt
import pandas as pd
import PIL
# print("tf version", tf.__version__)

# Stop some of the random logging
os.environ['TF_CPP_MIN_VLOG_LEVEL'] = '3'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'


LABELS_FILE = "./ball-labels.csv"
EPOCHS = 500
BATCH_SIZE = 128
TRAINING_DATA_SIZE = 250


def get_ball_data():
    # ball_data = {}
    if os.path.isfile(LABELS_FILE):
        df = pd.read_csv(LABELS_FILE)
        print(df)
    else:
        raise Exception("Missing {}".format(LABELS_FILE))

    return df

    # new_idx = []
    # for i in range(16):
    #     new_idx += list(df[df["type"] == i].index)[:min(value_counts)]
    # random.shuffle(new_idx)
    # new_df = df.loc[new_idx].reset_index(drop=True)
    # print(new_df)
    # return new_df


def get_input_data(filenames):
    input_data = []
    for filename in filenames:
        img = PIL.Image.open("ball-images/{}".format(filename), "r")
        image_data = np.array([[i[0]/255, i[1]/255, i[2]/255] for i in img.getdata()])

        image_data = image_data.reshape(32, 32, 3)
        # image_data = image_data.reshape(16, 2, 16, 2, 3).mean(axis=1).mean(axis=2)
        # image_data = image_data.reshape(8, 2, 8, 2, 3).mean(axis=1).mean(axis=2)

        input_data.append(image_data)
    input_data = np.array(input_data)

    print(len(input_data))

    # Reshape for conv net
    # input_data = np.reshape(input_data, (len(filenames), 32, 32, 3))

    return input_data


def get_output_data(ball_data):
    output_data = np.array(list(zip(ball_data["x"].values, ball_data["y"].values)))
    output_data = output_data - 16
    return output_data


ball_data = get_ball_data()
# print(ball_data[abs(ball_data["x"] - 16) > 3])
input_data = get_input_data(ball_data["filename"].values)
output_data = get_output_data(ball_data)
combined_data = list(zip(input_data, output_data))
random.shuffle(combined_data)

# plt.imshow(input_data[0])
# plt.show()

input_data_train = np.array([i[0] for i in combined_data[:TRAINING_DATA_SIZE]])
output_data_train = np.array([i[1] for i in combined_data[:TRAINING_DATA_SIZE]])

input_data_test = np.array([i[0] for i in combined_data[TRAINING_DATA_SIZE:]])
output_data_test = np.array([i[1] for i in combined_data[TRAINING_DATA_SIZE:]])

print("Training data size: {}".format(len(input_data_train)))
print("Testing data size: {}".format(len(input_data_test)))

# print(input_data)
# print(output_data)

# print(list(zip(ball_data["filename"], output_data)))
input()

def get_model():
    model = keras.Sequential()

    model.add(keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(32, 32, 3)))
    model.add(keras.layers.Dropout(0.1))
    model.add(keras.layers.Conv2D(32, (3, 3), activation='relu'))
    model.add(keras.layers.MaxPooling2D((2, 2)))
    model.add(keras.layers.Dropout(0.5))
    # model.add(keras.layers.Conv2D(64, (3, 3), activation='relu'))
    # model.add(keras.layers.Conv2D(64, (3, 3), activation='relu'))
    # model.add(keras.layers.MaxPooling2D((2, 2)))
    # model.add(keras.layers.Dropout(0.5))
    # model.add(keras.layers.Conv2D(128, (3, 3), activation='relu'))
    # model.add(keras.layers.Conv2D(128, (3, 3), activation='relu'))
    # model.add(keras.layers.MaxPooling2D((2, 2)))
    # model.add(keras.layers.Dropout(0.3))
    model.add(keras.layers.Flatten())
    model.add(keras.layers.Dense(128, activation='relu'))
    model.add(keras.layers.Dropout(0.5))
    model.add(keras.layers.Dense(2, activation='linear'))
    
    # model.add(keras.layers.Flatten(input_shape=(32, 32, 3)))
    # model.add(keras.layers.Dense(64, activation=tf.nn.relu))
    # model.add(keras.layers.Dropout(0.3))
    # model.add(keras.layers.Dense(64, activation=tf.nn.relu))
    # model.add(keras.layers.Dropout(0.3))
    # model.add(keras.layers.Dense(16, activation=tf.nn.softmax))

    return model




model = get_model()

model.compile(
    optimizer='adam', #tf.keras.optimizers.Adam(0.001)
    loss='mse',
    metrics=['mse'],
)

model.summary()



input()

train_results = model.fit(
    input_data_train, 
    output_data_train,
    epochs = EPOCHS,
    batch_size = BATCH_SIZE,
    validation_data = (input_data_test, output_data_test),
)


# print(train_results.history)
# print(train_results.history['accuracy'])
# print(train_results.history['val_accuracy'])


plt.plot(
    range(EPOCHS),
    train_results.history['mse'],
    label='mse'
)
plt.plot(
    range(EPOCHS),
    train_results.history['val_mse'],
    label='val_mse'
)

# plt.ylim(0,1.01)
# plt.xticks(range(EPOCHS))
plt.legend()
plt.show()



predictions = model.predict(input_data_test)
for i,o,p in zip(input_data_test, output_data_test, predictions):
    if math.sqrt(sum((o-p)**2)) < 1:
        continue

    print("True ({: .4f}, {: .4f}) - Pred ({: .4f}, {: .4f})".format(o[0], o[1], p[0], p[1]))
    plt.imshow(i)

    plt.gcf().gca().add_artist(plt.Circle(o+16, 0.3, color='#00ff00'))
    plt.gcf().gca().add_artist(plt.Circle(o+16, 13, color='#00ff00', fill=False))

    plt.gcf().gca().add_artist(plt.Circle(p+16, 0.3, color='#00ffff'))
    plt.gcf().gca().add_artist(plt.Circle(p+16, 13, color='#00ffff', fill=False))
    plt.show()


# print(" ".join(["{:.4f}".format(i) for i in pred]))

# print(output_data[0])


# testLoss, testAcc = model.evaluate(testImages, testLabels)

# print("Correct: {}%".format(round(100*testAcc,2)))
# print("Error: {}%".format(round(100*(1-testAcc),2)))

# if input("Save model? ").upper() == "Y":
#     model.save("models/model-conv.h5")
#     print("Saved model as model-conv.h5")

# print("Done")

