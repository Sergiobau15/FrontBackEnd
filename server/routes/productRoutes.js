const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configurar multer para el almacenamiento de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'products');
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('No es un archivo de imagen válido'));
        }
    }
});

const { 
    createProduct, 
    specificProduct, 
    products, 
    updateProduct, 
    inactivateProduct, 
    productsInactive, 
    activateProduct, 
    getCategories, 
    createCategory,
    updateCategory,
    deleteCategory,
    updateProductQuantity
} = require('../controllers/product');

router.get("/categories", getCategories);
router.post("/create", upload.single('imagen'), createProduct);
router.get("/", products);
router.get("/productsInactive", productsInactive);
router.get("/:id", specificProduct);
router.put("/updateProduct/:id", upload.single('imagen'), updateProduct); // Agregado upload para actualización de imagen
router.patch("/inactivateProduct/:id", inactivateProduct);
router.put("/activate/:id", activateProduct);
router.post("/createCategory", createCategory);
router.put("/updateCategory/:id", updateCategory);
router.delete("/deleteCategory/:id", deleteCategory);
router.put("/updateQuantity/:id", updateProductQuantity);

module.exports = router;