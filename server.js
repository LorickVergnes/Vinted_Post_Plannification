const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = 3000;

// --- MongoDB Configuration ---
const mongoUrl = 'mongodb+srv://vintedAutoPost:Vinted1202!@cluster0.7pmf2hj.mongodb.net/?appName=Cluster0';
const dbName = 'vinted_annonces';
let db;

async function connectToMongo() {
    try {
        const client = new MongoClient(mongoUrl);
        await client.connect();
        console.log('Connecté à MongoDB');
        db = client.db(dbName);
    } catch (err) {
        console.error('Erreur de connexion à MongoDB:', err);
        process.exit(1);
    }
}

// --- Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (HTML, CSS, JS client)
app.use(express.static('public'));

// Servir les images uploadées pour qu'elles soient accessibles
app.use('/uploads', express.static(path.join(__dirname, 'data/uploads')));

// --- Configuration de Multer pour l'upload d'images ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'data/uploads/');
    },
    filename: function (req, file, cb) {
        // Garder un nom de fichier unique pour éviter les conflits
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { files: 10 } // Limite de 10 photos par annonce
});

// --- API Endpoints ---

/**
 * POST /api/annonces
 * Reçoit les données du formulaire, gère l'upload des images et sauvegarde l'annonce.
 */
app.post('/api/annonces', upload.array('photos', 10), async (req, res) => {
    try {
        const { body, files } = req;

        if (!files || files.length === 0) {
            return res.status(400).send('Vous devez uploader au moins une image.');
        }

        const imagePaths = files.map(file => file.filename);

        // Convertir les chaînes de tags en tableaux
        const couleurs = body.couleur ? body.couleur.split(',') : [];
        const materiaux = body.materiaux ? body.materiaux.split(',') : [];

        const nouvelleAnnonce = {
            titre: body.titre || '',
            description: body.description || '',
            categorie: body.categorie || '',
            marque: body.marque || '',
            taille: body.taille || '',
            etat: body.etat || '',
            couleur: couleurs,
            materiaux: materiaux,
            prix: body.prix || 0,
            formatColis: body.formatColis || '',
            datePublication: body.datePublication || '',
            repetition: body.repetition || '0',
            images: imagePaths,
            createdAt: new Date()
        };

        const result = await db.collection('annonces').insertOne(nouvelleAnnonce);
        
        // Rediriger vers la page de toutes les annonces après succès
        res.redirect('/all.html');

    } catch (error) {
        console.error('Erreur lors de la création de l\'annonce:', error);
        res.status(500).send('Erreur interne du serveur.');
    }
});

/**
 * GET /api/annonces
 * Retourne la liste de toutes les annonces sauvegardées.
 */
app.get('/api/annonces', async (req, res) => {
    try {
        const annonces = await db.collection('annonces').find().sort({ createdAt: -1 }).toArray();
        res.json(annonces);
    } catch (error) {
        console.error('Erreur lors de la lecture des annonces:', error);
        res.status(500).send('Erreur interne du serveur.');
    }
});

/**
 * GET /api/annonces/today
 * Retourne les annonces dont la date de publication est aujourd'hui.
 */
app.get('/api/annonces/today', async (req, res) => {
    try {
        const allAnnonces = await db.collection('annonces').find().toArray();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const annoncesDuJour = allAnnonces.filter(annonce => {
            if (!annonce.datePublication) return false;

            const datePublication = new Date(annonce.datePublication);
            datePublication.setHours(0, 0, 0, 0);

            if (today < datePublication) {
                return false; // Ne pas afficher les annonces dont la date de début est dans le futur
            }

            const repetition = parseInt(annonce.repetition, 10);

            if (!repetition || repetition <= 0) {
                // Logique sans récurrence : uniquement si la date est aujourd'hui
                return today.getTime() === datePublication.getTime();
            } else {
                // Logique avec récurrence
                const diffTime = Math.abs(today - datePublication);
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                return diffDays % repetition === 0;
            }
        });
        
        annoncesDuJour.sort((a, b) => b.createdAt - a.createdAt);

        res.json(annoncesDuJour);
    } catch (error) {
        console.error('Erreur lors de la lecture des annonces du jour:', error);
        res.status(500).send('Erreur interne du serveur.');
    }
});

/**
 * GET /api/annonces/:id
 * Retourne une annonce spécifique par son ID.
 */
app.get('/api/annonces/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send('ID d\'annonce invalide.');
        }
        const annonce = await db.collection('annonces').findOne({ _id: new ObjectId(id) });

        if (annonce) {
            res.json(annonce);
        } else {
            res.status(404).send('Annonce non trouvée.');
        }
    } catch (error) {
        console.error(`Erreur lors de la lecture de l'annonce ${req.params.id}:`, error);
        res.status(500).send('Erreur interne du serveur.');
    }
});

/**
 * POST /api/annonces/:id
 * Met à jour une annonce existante.
 */
app.post('/api/annonces/:id', upload.array('photos', 10), async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send('ID d\'annonce invalide.');
        }
        const { body, files } = req;

        const oldAnnonce = await db.collection('annonces').findOne({ _id: new ObjectId(id) });
        if (!oldAnnonce) {
            return res.status(404).send('Annonce non trouvée.');
        }

        const oldImages = oldAnnonce.images || [];
        const existingImages = JSON.parse(body.existingImages || '[]');
        const newImagePaths = files.map(file => file.filename);

        // Supprimer les anciennes images qui ne sont plus dans la liste
        const imagesToDelete = oldImages.filter(img => !existingImages.includes(img));
        imagesToDelete.forEach(imgName => {
            const imgPath = path.join(__dirname, 'data', 'uploads', imgName);
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        });

        const finalImages = [...existingImages, ...newImagePaths];

        const couleurs = body.couleur ? body.couleur.split(',') : [];
        const materiaux = body.materiaux ? body.materiaux.split(',') : [];

        const updatedAnnonce = {
            titre: body.titre || '',
            description: body.description || '',
            categorie: body.categorie || '',
            marque: body.marque || '',
            taille: body.taille || '',
            etat: body.etat || '',
            couleur: couleurs,
            materiaux: materiaux,
            prix: body.prix || 0,
            formatColis: body.formatColis || '',
            datePublication: body.datePublication || '',
            repetition: body.repetition || '0',
            images: finalImages
        };

        await db.collection('annonces').updateOne({ _id: new ObjectId(id) }, { $set: updatedAnnonce });

        res.status(200).send('Annonce mise à jour avec succès.');

    } catch (error) {
        res.status(500).send('Erreur interne du serveur.');
    }
});

/**
 * DELETE /api/annonces/:id
 * Supprime une annonce et ses images associées.
 */
app.delete('/api/annonces/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).send('ID d\'annonce invalide.');
        }

        const annonce = await db.collection('annonces').findOne({ _id: new ObjectId(id) });
        if (!annonce) {
            return res.status(404).send('Annonce non trouvée.');
        }

        // Supprimer les images associées
        const images = annonce.images || [];
        images.forEach(imgName => {
            const imgPath = path.join(__dirname, 'data', 'uploads', imgName);
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        });

        await db.collection('annonces').deleteOne({ _id: new ObjectId(id) });

        res.status(200).send('Annonce supprimée avec succès.');

    } catch (error) {
        console.error(`Erreur lors de la suppression de l'annonce ${req.params.id}:`, error);
        res.status(500).send('Erreur interne du serveur.');
    }
});

// --- Démarrage du serveur ---
connectToMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    });
});
