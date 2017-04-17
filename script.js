'use strict';
(function() {
    function display(result) {
        const height = result.length;
        const width = result[0].length;

        const colors = {};
        result.forEach(row => row.forEach(cell => colors[cell] = null));
        const colorList = ['#b58900', '#cb4b16', '#dc322f', '#d33682', '#6c71c4', '#268bd2', '#2aa198', '#859900'];
        let index = 0;
        for (let key in colors) {
            if (key === ' ') {
                colors[key] = '#ffffff';
            } else {
                colors[key] = colorList[index];
                index++;
                index %= colorList.length;
            }
        }

        const div = document.createElement('div');
        div.style.width = width + "em";
        div.style.height = height + "em";
        div.classList.add('mdl-shadow--2dp');

        result.forEach(row => row.forEach(elem => {
            const pixel = document.createElement('div');
            pixel.style.width = '1em';
            pixel.style.height = '1em';
            pixel.style.backgroundColor = colors[elem];
            pixel.style.float = 'left';
            div.appendChild(pixel);
        }));

        const main = document.querySelector('main');
        Array.from(main.children).forEach(c => main.removeChild(c));

        main.appendChild(div);
    }

    function uploadFile(file) {
        const reader = new FileReader();
        reader.addEventListener('load', evt => {
            const data = JSON.parse(reader.result);
            const result = nonogram.solve(data.rows.map(nonogram.parseConstraint), data.cols.map(nonogram.parseConstraint));
            display(result);
        });
        // FIXME add loading screen
        reader.readAsText(file);
    }

    const uploadCard = document.getElementById('upload-card');
    let numEnters = 0;

    function update() {
        if (numEnters) {
            uploadCard.classList.add('dragged');
        } else {
            uploadCard.classList.remove('dragged');
        }
    }

    uploadCard.addEventListener('dragenter', evt => {
        numEnters++;
        update();
    });
    uploadCard.addEventListener('dragleave', evt => {
        numEnters--;
        update();
    });
    uploadCard.addEventListener('dragover', evt => {
        evt.preventDefault();
    });
    uploadCard.addEventListener('drop', evt => {
        evt.preventDefault();
        numEnters = 0;
        update();
        uploadFile(evt.dataTransfer.items[0].getAsFile());
    });

    const fileInput = document.querySelector('#upload input');
    fileInput.addEventListener('change', evt => {
        uploadFile(fileInput.files[0]);
    });
})();