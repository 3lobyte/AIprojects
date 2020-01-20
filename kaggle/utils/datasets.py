from torch.utils.data import Dataset
import torch

class GreyImageDataset(Dataset):
  def __init__(self, X, y=None, train=True, trans=None):
    self.X = X
    self.y = y
    self.train = train
    self.len = len(X)
    self.trans = trans

  def __len__(self):
    return self.len 

  def __getitem__(self, ix):
    img = self.X[ix]
    if self.trans:
      augmented = self.trans(image=img)
      img = augmented["image"]
    img = torch.from_numpy(img / 255.).float().unsqueeze(0)
    if self.train:
      label = self.y[ix]
      return img, label
    return img