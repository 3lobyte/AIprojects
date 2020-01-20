import torch.nn as nn
import torchvision

class Model(nn.Module):
  def __init__(self, num_cats):
    super(Model, self).__init__()
    # download resnet34 pretrained
    self.model = torchvision.models.resnet34(pretrained=True)
    # freeze
    for param in self.model.parameters():
      param.requires_grad = False
    # add new fc layer
    self.model.fc = nn.Linear(self.model.fc.in_features, num_cats)
  def forward(self, x):
    x = self.model(x)
    return x