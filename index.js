const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { pdfToPng } = require('pdf-to-png-converter');
var zip = require('express-zip');

const app = express();
const port = 3000;

// Set up storage engine with Multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + path.extname(file.originalname));
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

    const pngPages = await pdfToPng(path.join(__dirname, 'uploads', "pdf.pdf"),
    {
        disableFontFace: true, // When `false`, fonts will be rendered using a built-in font renderer that constructs the glyphs with primitive path commands. Default value is true.
        useSystemFonts: false, // When `true`, fonts that aren't embedded in the PDF document will fallback to a system font. Default value is false.
        enableXfa: false, // Render Xfa forms if any. Default value is false.
        viewportScale: 2.0, // The desired scale of PNG viewport. Default value is 1.0.
        outputFolder: 'images', // Folder to write output PNG files. If not specified, PNG output will be available only as a Buffer content, without saving to a file.
        outputFileMask: 'res', // Output filename mask. Default value is 'buffer'.
        pdfFilePassword: 'pa$$word', // Password for encrypted PDF.
        pagesToProcess: pageNumbers,   // Subset of pages to convert (first page = 1), other pages will be skipped if specified.
        strictPagesToProcess: false, // When `true`, will throw an error if specified page number in pagesToProcess is invalid, otherwise will skip invalid page. Default value is false.
        verbosityLevel: 0 // Verbosity level. ERRORS: 0, WARNINGS: 1, INFOS: 5. Default value is 0.
    });
    const outputFiles = []
    for (let i = 0; i < pageNumbers.length; i++) {
        const p = {
            path: `./images/res_page_${pageNumbers[i]}.png`,
            name: `pic${pageNumbers[i]}.png`
        }
        outputFiles.push(p);
    }
    res.zip(outputFiles);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
