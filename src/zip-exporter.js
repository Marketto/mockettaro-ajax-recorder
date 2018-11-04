export function mockettaroExport(fileMap = [], filename = 'archive'){
    const zip = new JSZip();

    fileMap.forEach(fileConf => {
        zip.file(fileConf.path, fileConf.content);
    });

    return zip.generateAsync({
        'type'                : "blob", 
        'compression'         : 'DEFLATE',
        'compressionOptions'  : {
            'level'   : 9
        }
    }).then(function(blobData) {
        //FileSaver
        saveAs(blobData, filename+'.zip');
    });
}