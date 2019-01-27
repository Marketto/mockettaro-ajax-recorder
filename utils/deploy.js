#!/usr/bin/env node
const program = require('commander');

program
    .option('--refresh-token <string>', '')
    .option('--extension-id <string>', '')
    .option('--client-secret <string>', '')
    .option('--client-id <string>', '')
    .parse(process.argv);

const zipFolder = require('zip-folder');

let folder = 'build';
let zipName = 'dist/extension.zip';

const {refreshToken, extensionId, clientSecret, clientId} = program;

// zipping the output folder
zipFolder(folder, zipName, function (err) {
    if (err) {
        console.log('oh no!', err);
        process.exit(1);
    } else {
        console.log(`Successfully Zipped ${folder} and saved as ${zipName}`);
        //uploadZip(); // on successful zipping, call upload
    }
});

function uploadZip() {
  // creating file stream to upload
    const webStore = require('chrome-webstore-upload')({refreshToken, extensionId, clientSecret, clientId});
    const extensionSource = fs.createReadStream(`./${zipName}`);

    // upload the zip to webstore
    webStore.uploadExisting(extensionSource).then(res => {
        console.log('Successfully uploaded the ZIP');

        // publish the uploaded zip
        webStore.publish().then(res => {
            onsole.log('Successfully published the newer version');
        }).catch((error) => {
            console.log(`Error while publishing uploaded extension: ${error}`);
            process.exit(1);
        });

    }).catch((error) => {
        console.log(`Error while uploading ZIP: ${error}`);
        process.exit(1);
    });
}