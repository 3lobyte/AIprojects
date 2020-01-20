from fastprogress import master_bar, progress_bar
from torch.utils.data import DataLoader
import torch
import numpy as np

class Model():
  def __init__(self, net):
    self.net = net

  def compile(self, loss, optimizer, metrics, dataset, device, scheduler=None):
    self.loss = loss
    self.optimizer = optimizer
    self.metrics = metrics
    self.scheduler = scheduler
    self.dataset = dataset
    self.device = device

  def fit(self, X, y, epochs=100, validation_data=None, batch_size=32, verbose=True, early_stopping=False, trans=None, validation_trans=None):

    dataset = self.dataset(X, y, trans=trans)
    dataloader = DataLoader(dataset, shuffle=True, batch_size=batch_size)
    self.history = {"loss": []}
    for metric in self.metrics:
      self.history[f'{metric.name}'] = []

    if validation_data:
      dataset = self.dataset(validation_data[0], validation_data[1], trans=validation_trans)
      dataloader_val = DataLoader(dataset, shuffle=False, batch_size=batch_size)
      self.history["val_loss"] = []
      for metric in self.metrics:
        self.history[f'val_{metric.name}'] = []
    
    if self.scheduler:
      self.history["lr"] = []
    
    self.net.to(self.device)
    mb = master_bar(range(1, epochs+1))
    best_loss, step, best_e = 1e10, 0, 0
    for epoch in mb:
      # train
      self.net.train()
      train_loss, train_metrics = [], [[] for m in self.metrics]
      for X, y in progress_bar(dataloader, parent=mb):
        X, y = X.to(self.device), y.to(self.device)  
        self.optimizer.zero_grad()
        output = self.net(X)
        loss = self.loss(output, y)
        loss.backward()
        self.optimizer.step()
        train_loss.append(loss.item())
        comment = f'train_loss {np.mean(train_loss):.5f}'
        for i, metric in enumerate(self.metrics):
          train_metrics[i].append(metric.call(output, y))
          comment += f' train_{metric.name} {np.mean(train_metrics[i]):.5f}'
        mb.child.comment = comment
      self.history["loss"].append(np.mean(train_loss))
      for i, metric in enumerate(self.metrics):
        self.history[f'{metric.name}'].append(np.mean(train_metrics[i]))
      bar_text = f'Epoch {epoch}/{epochs} loss {np.mean(train_loss):.5f}'
      for i, metric in enumerate(self.metrics):
        bar_text += f' {metric.name} {np.mean(train_metrics[i]):.5f}'
      if self.scheduler:
        self.history["lr"].append(optimizer.param_groups[0]['lr'])
        self.scheduler.step()
      # eval
      if validation_data:
        self.net.eval()
        val_loss, val_metrics = [], [[] for m in self.metrics]
        with torch.no_grad():
          for X, y in progress_bar(dataloader_val, parent=mb):
            X, y = X.to(self.device), y.to(self.device)  
            output = self.net(X)
            loss = self.loss(output, y)
            val_loss.append(loss.item())
            comment = f'val_loss {np.mean(val_loss):.5f}'
            for i, metric in enumerate(self.metrics):
              val_metrics[i].append(metric.call(output, y))
              comment += f' val_{metric.name} {np.mean(val_metrics[i]):.5f}'
            mb.child.comment = comment      
        self.history["val_loss"].append(np.mean(val_loss))
        for i, metric in enumerate(self.metrics):
          self.history[f'val_{metric.name}'].append(np.mean(val_metrics[i]))
        bar_text += f' val_loss {np.mean(val_loss):.5f}'
        for i, metric in enumerate(self.metrics):
          bar_text += f' val_{metric.name} {np.mean(val_metrics[i]):.5f}'
        if early_stopping:
          step += 1
          if np.mean(val_loss) < best_loss:
            best_loss = np.mean(val_loss)
            torch.save(self.net.state_dict(),'best_dict.pth')
            best_e = epoch
            step = 0
          if step >= early_stopping:
            self.net.load_state_dict(torch.load('best_dict.pth'))
            print(f"training stopped at epoch {epoch}")
            print(f"best model found at epoch {best_e} with val_loss {best_loss:.5f}")
            break
      if verbose:
        mb.write(bar_text)

    return self.history

  def predict(self, X_new, trans=None, batch_size=32):
    self.net.to(self.device)
    self.net.eval()
    dataset = self.dataset(X_new, train=False, trans=trans)
    dataloader = DataLoader(dataset, batch_size=batch_size)
    mb = master_bar(range(0, 1))
    for e in mb:
        preds = torch.tensor([]).to(self.device)
        with torch.no_grad():
            for X in progress_bar(dataloader, parent=mb):
                output = torch.nn.Softmax(dim=1)(self.net(X.to(self.device)))
                preds = torch.cat((preds, output))
    return preds

  def evaluate(self, X_test, y_test, batch_size=32, trans=None):
    self.net.to(self.device)
    self.net.eval()
    dataset = self.dataset(X_test, y_test, trans=trans)
    dataloader = DataLoader(dataset, batch_size=batch_size)
    mb = master_bar(range(0, 1))
    for e in mb:
      total_loss, metrics = [], [[] for m in self.metrics]
      with torch.no_grad():
        for X, y in progress_bar(dataloader, parent=mb):
          X, y = X.to(self.device), y.to(self.device)
          output = self.net(X)
          loss = self.loss(output, y)
          total_loss.append(loss.item())
          comment = f'loss {np.mean(total_loss):.5f}'
          for i, metric in enumerate(self.metrics):
            metrics[i].append(metric.call(output, y))
            comment += f' {metric.name} {np.mean(metrics[i]):.5f}'
          mb.child.comment = comment
        mb.write(comment)
