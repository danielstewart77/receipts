function uploadReceipt() {
    const files = document.getElementById('fileInput').files;
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);

    fetch('/uploadreceipt', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        const item = document.createElement('div');
        item.innerHTML = data;
        fileList.appendChild(item);
    })
    .catch(error => {
        const item = document.createElement('div');
        item.textContent = file.name + ' - Error: ' + error;
        fileList.appendChild(item);
    });
    }
}