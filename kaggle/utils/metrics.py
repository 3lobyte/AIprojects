import torch

class Accuracy():
  def __init__(self):
    self.name = "acc"
  
  def call(self, output, labels):
    return (torch.argmax(output, axis=1) == labels).sum().item() / labels.shape[0] 