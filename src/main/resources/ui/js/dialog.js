let Dialog = function () {
    this.dialog = $("#common-dialog");
    this.closeDialogButton = $("#close-dialog-button");
    this.dialogTitle = dialog.querySelector('.title');
    this.dialogContent = dialog.querySelector('.dialog-container');
    this.dialogContent.innerHTML = '';

    this.setTitle = function (text) {
        this.dialogTitle.innerText = text;
    }

    this.setTitleElement = function (e) {
        this.dialogTitle.innerHTML = '';
        this.dialogTitle.appendChild(e);
    }

    this.addElement = function (e) {
        this.dialogContent.appendChild(e);
    }

    this.addText = function (text) {
        this.addElement(createDialogItem(text));
    }

    this.setVisible = function (visible) {
        if (visible) {
            this.dialog.showModal();
        } else {
            this.dialog.classList.add('fade-out')
        }
    }
}

let dialog = $("#common-dialog");
let closeDialogButton = $("#close-dialog-button");
dialog.addEventListener('animationend', function () {
    if (dialog.classList.contains('fade-out')) {
        dialog.classList.remove('fade-out')
        dialog.close();
    }
});

closeDialogButton.addEventListener('click', () => {
    dialog.classList.add('fade-out');
});

function createDialogItem(content, button = false) {
    let a = document.createElement(button ? 'button' : 'a');
    a.classList.add('dialog-item');
    if (content != null)
        a.innerHTML = content;
    return a;
}