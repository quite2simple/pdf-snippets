const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const { fromPath } = require('pdf2pic');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Set up storage engine with Multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload variable
const upload = multer({ storage: storage });

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

app.post('/api/convert', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const pageNumbers = req.body.pages ? JSON.parse(req.body.pages).pages : [];

    console.log(pageNumbers);

    const options = {
        density: 100,
        saveFilename: 'converted',
        savePath: './images',
        format: 'png',
        width: 600,
        height: 800
    };

    const converter = fromPath(req.file.path, options);

    // Ensure the images directory exists
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    try {
        // Extract and convert specified pages to images
        const pagesToConvert = pageNumbers.map(pageNumber => converter(pageNumber));

        console.log(pagesToConvert);
        const images = await Promise.all(pagesToConvert);



        // Clean up uploaded PDF file
        fs.unlinkSync(req.file.path);

        res.json({ message: 'Conversion successful', images: images.map(image => image.name) });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred during the conversion process.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
