class MockettaroZipExporter {
    constructor(fileMap = [], fileName) {
        const JSZip = require("jszip");
        this.archive = new JSZip();

        return new Promise((resolve, reject) => {
            try {

                fileMap.forEach(file => this.addFile(file));

                if (Object.keys((this.archive || {}).files || []).length) {
                    this.saveAs(fileName).then(resolve).catch(reject);
                } else {
                    reject(new Error('Nothing to export'));
                }
            } catch(err) {
                reject(err);
            }
        });
    }

    addFile({path, content}) {
        return this.archive.file(path, content);
    }

    saveAs(fileName = 'archive') {
        const {saveAs} = require("file-saver");
        return this.archive.generateAsync({
            'type'                : "blob",
            'compression'         : 'DEFLATE',
            'compressionOptions'  : {
                'level'   : 9
            }
        }).then(function(blobData) {
            //FileSaver
            saveAs(blobData, `${fileName}.zip`);
        });
    }
}

export const mockettaroZipExporter = (...args) => new MockettaroZipExporter(...args);
export {MockettaroZipExporter};