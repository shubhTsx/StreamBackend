const ImageKit = require('imagekit');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    
})

async function uploadFile(file, filename) {
    try {
        const result = await imagekit.upload({
            file: file,
            fileName: filename,
        });
        return result; // Add this return statement
    } catch (error) {
        console.error('ImageKit upload error:', error);
        throw error;
    }
}


module.exports = {
    uploadFile,
}



