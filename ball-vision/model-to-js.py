import os, sys
import random
import numpy as np
import tensorflow as tf
from tensorflow import keras
import tensorflowjs as tfjs

model = keras.models.load_model("models/{}.h5".format(input("Enter model path: ")))
model.summary()

tfjs.converters.save_keras_model(model, "models/{}".format(input("Enter save path: ")))
