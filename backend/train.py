import torch
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision
import torchvision.transforms as transforms

from mnist_model import CNN

def train_mnist_model(hparams, update_callback=None):
    """
    update_callback: function called each epoch: update_callback(epoch, loss, accuracy)
    """

    lr = hparams.get('learning_rate', 0.001)
    batch_size = hparams.get('batch_size', 64)
    epochs = hparams.get('epochs', 5)

    transform = transforms.Compose([transforms.ToTensor()])
    train_dataset = torchvision.datasets.MNIST(root='./data', train=True, download=True, transform=transform)
    test_dataset  = torchvision.datasets.MNIST(root='./data', train=False, download=True, transform=transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader  = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    model = CNN()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    criterion = torch.nn.CrossEntropyLoss()

    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()

        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for images, labels in test_loader:
                outputs = model(images)
                _, predicted = torch.max(outputs.data, 1)
                total += labels.size(0)
                correct += (predicted == labels).sum().item()

        val_accuracy = 100.0 * correct / total
        avg_loss = running_loss / len(train_loader)

        if update_callback:
            update_callback(epoch, avg_loss, val_accuracy)

    return {
        'final_val_accuracy': val_accuracy,
        'final_loss': avg_loss,
    }
