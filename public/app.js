document.addEventListener('DOMContentLoaded', () => {
    // --- Logique spécifique à la page ---
    const path = window.location.pathname;

    if (path.endsWith('/all.html') || path.endsWith('/all.html')) {
        loadAllAnnonces();
    }

    if (path.endsWith('/today.html')) {
        loadTodayAnnonces();
    }

    if (path.endsWith('/index.html') || path.endsWith('/')) {
        selectedFiles = [];
        setupTagSelectors();
        setupBrandAutocomplete();
        setupCategoryAutocomplete(); // Ajout de l'autocomplétion pour les catégories
        setupPhotoPreviews();
        handleFormSubmission();
    }

    if (path.endsWith('/edit.html')) {
        selectedFiles = [];
        setupTagSelectors();
        setupBrandAutocomplete();
        setupCategoryAutocomplete(); // Ajout de l'autocomplétion pour les catégories
        setupPhotoPreviews();
        populateEditForm();
        handleFormSubmission();
        setupDeleteButton();
    }

    // Gestionnaires d'événements globaux
    document.body.addEventListener('click', (event) => {
        // Ouvre la modale au clic sur une carte
        const summaryCard = event.target.closest('.summary-card');
        if (summaryCard) {
            openTodayModal(summaryCard.dataset.id);
        }

        // Ferme la modale
        if (event.target.matches('.modal-close-btn') || event.target.matches('.modal-backdrop')) {
            closeModal();
        }

        // Gère les autres clics
        if (event.target.classList.contains('copy-btn')) {
            handleCopyClick(event);
        }
        if (event.target.classList.contains('download-all-btn')) {
            handleDownloadAll(event);
        }
    });
});

/**
 * Gère le clic sur le bouton "Télécharger tout".
 * @param {Event} event 
 */
function handleDownloadAll(event) {
    const button = event.target;
    const images = JSON.parse(button.dataset.images || '[]');
    
    images.forEach((imageUrl, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = imageUrl.split('/').pop(); // Extrait le nom du fichier
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 300); // Délai pour éviter que le navigateur ne bloque les téléchargements
    });
}

/**
 * Initialise la logique pour le champ d'autocomplétion de la marque.
 */
function setupBrandAutocomplete() {
    const input = document.getElementById('marque');
    const suggestionsContainer = document.getElementById('marque-suggestions');
    if (!input || !suggestionsContainer) return;

    const brands = [
        'Nike', 'Adidas', 'Zara', 'H&M', 'Levi\'s', 'Ralph Lauren', 'Lacoste', 'Tommy Hilfiger',
        'Calvin Klein', 'The North Face', 'Carhartt', 'Vans', 'Converse', 'Doc Martens', 'Sézane',
        'Ba&sh', 'Maje', 'Sandro', 'Mango', 'Pull&Bear', 'Bershka', 'Stradivarius', 'Pimkie',
        'Kiabi', 'Gémo', 'Petit Bateau', 'Jacadi', 'Vertbaudet', 'Gucci', 'Prada', 'Chanel',
        'Dior', 'Hermès', 'Saint Laurent'
    ];

    const showSuggestions = (filter = '') => {
        const value = filter.toLowerCase();
        suggestionsContainer.innerHTML = '';

        const filteredBrands = brands.filter(brand => brand.toLowerCase().startsWith(value));

        filteredBrands.forEach(brand => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = brand;
            item.addEventListener('click', () => {
                input.value = brand;
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(item);
        });

        if (filteredBrands.length > 0) {
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    };

    input.addEventListener('focus', () => {
        showSuggestions(input.value);
    });

    input.addEventListener('input', () => {
        showSuggestions(input.value);
    });

    // Cacher les suggestions si on clique ailleurs
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.autocomplete-container')) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

/**
 * Initialise la logique pour le champ d'autocomplétion de la catégorie.
 */
function setupCategoryAutocomplete() {
    const input = document.getElementById('categorie');
    const suggestionsContainer = document.getElementById('categorie-suggestions');
    if (!input || !suggestionsContainer) return;

    const categories = [
        "Femme|Vêtements|Robes|Robes d'été",
        "Femme|Vêtements|Robes|Robes de soirée",
        "Femme|Vêtements|Robes|Robes longues",
        "Femme|Vêtements|Tops & T-shirts|T-shirts",
        "Femme|Vêtements|Tops & T-shirts|Débardeurs",
        "Femme|Vêtements|Jeans|Jeans skinny",
        "Femme|Vêtements|Jeans|Jeans boyfriend",
        "Femme|Vêtements|Pulls & Gilets|Pulls",
        "Femme|Vêtements|Pulls & Gilets|Gilets",
        "Femme|Chaussures|Baskets",
        "Femme|Chaussures|Talons",
        "Femme|Sacs|Sacs à main",
        "Femme|Sacs|Sacs bandoulière",
        "Femme|Accessoires|Bijoux|Colliers",
        "Femme|Accessoires|Bijoux|Bracelets",
        "Homme|Vêtements|T-shirts & Débardeurs",
        "Homme|Vêtements|Chemises",
        "Homme|Vêtements|Pantalons|Pantalons chino",
        "Homme|Vêtements|Pantalons|Jeans",
        "Homme|Chaussures|Baskets",
        "Homme|Chaussures|Chaussures de ville",
        "Homme|Accessoires|Ceintures",
        "Enfant|Filles|Vêtements|Robes",
        "Enfant|Garçons|Vêtements|T-shirts",
        "Maison|Textiles|Linge de lit",
        "Maison|Décoration|Vases"
    ];

    const showSuggestions = (filter = '') => {
        const value = filter.toLowerCase();
        suggestionsContainer.innerHTML = '';

        const filteredCategories = categories.filter(cat => cat.toLowerCase().includes(value));

        if (filteredCategories.length > 0) {
            filteredCategories.forEach(cat => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = cat;
                item.addEventListener('click', () => {
                    input.value = cat;
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.style.display = 'none';
                });
                suggestionsContainer.appendChild(item);
            });
        } else {
            const item = document.createElement('div');
            item.className = 'suggestion-item is-new';
            item.textContent = `Créer la catégorie : "${filter}"`;
            item.addEventListener('click', () => {
                input.value = filter; // On utilise la valeur tapée
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(item);
        }
        
        suggestionsContainer.style.display = 'block';
    };

    input.addEventListener('focus', () => {
        showSuggestions(input.value);
    });

    input.addEventListener('input', () => {
        showSuggestions(input.value);
    });

    // Cacher les suggestions si on clique ailleurs
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.autocomplete-container')) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

let selectedFiles = []; // Peut contenir des objets File ou des strings (noms de fichiers existants)

/**
 * Initialise la logique pour l'aperçu des photos.
 */
function setupPhotoPreviews() {
    const photoInput = document.getElementById('photos');
    const previewContainer = document.getElementById('photos-preview');
    const dropZone = document.querySelector('.file-drop-zone');
    if (!photoInput || !previewContainer || !dropZone) return;

    // Helper function to process files
    function handleFiles(files) {
        const fileList = Array.from(files);
        fileList.forEach(file => {
            if (!selectedFiles.find(f => (f.name || f) === file.name) && selectedFiles.length < 10) {
                selectedFiles.push(file);
            }
        });
        renderPreviews();
    }

    // Click listener
    photoInput.addEventListener('change', () => {
        handleFiles(photoInput.files);
        photoInput.value = '';
    });

    // Drag and Drop listeners
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('is-active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('is-active');
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('is-active');
        handleFiles(event.dataTransfer.files);
    });

    window.renderPreviews = function() {
        previewContainer.innerHTML = '';
        selectedFiles.forEach(fileOrString => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'preview-image-container';
            const img = document.createElement('img');

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.innerHTML = '<i data-feather="x"></i>';
            removeBtn.type = 'button';
            removeBtn.addEventListener('click', () => {
                selectedFiles = selectedFiles.filter(f => (f.name || f) !== (fileOrString.name || fileOrString));
                renderPreviews();
            });

            previewWrapper.appendChild(img);
            previewWrapper.appendChild(removeBtn);
            previewContainer.appendChild(previewWrapper);

            if (typeof fileOrString === 'string') {
                img.src = `/uploads/${fileOrString}`;
            } else {
                const reader = new FileReader();
                reader.onload = (e) => { img.src = e.target.result; };
                reader.readAsDataURL(fileOrString);
            }
        });
        feather.replace();
    }
}

/**
 * Gère la soumission du formulaire en AJAX pour la création et la mise à jour.
 */
function handleFormSubmission() {
    const form = document.querySelector('.annonce-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        const isEditMode = !!id;

        const formData = new FormData(form);

        // Supprimer le champ de fichier original, car nous gérons les fichiers manuellement
        formData.delete('photos');

        const newFiles = selectedFiles.filter(f => typeof f !== 'string');
        const existingImages = selectedFiles.filter(f => typeof f === 'string');

        if (existingImages.length === 0 && newFiles.length === 0) {
            alert('Veuillez sélectionner au moins une photo.');
            return;
        }

        newFiles.forEach(file => {
            formData.append('photos', file);
        });
        formData.append('existingImages', JSON.stringify(existingImages));

        const url = isEditMode ? `/api/annonces/${id}` : '/api/annonces';
        const method = 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (response.ok) {
                window.location.href = '/all.html';
            } else {
                const errorText = await response.text();
                alert(`Erreur lors de la mise à jour: ${errorText}`);
            }
        } catch (error) {
            console.error('Erreur de réseau:', error);
            alert('Erreur de réseau lors de la soumission du formulaire.');
        }
    });
}

/**
 * Pré-remplit le formulaire de modification avec les données de l'annonce.
 */
async function populateEditForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    try {
        const response = await fetch(`/api/annonces/${id}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Annonce non trouvée');
        }
        const annonce = await response.json();

        // Remplir les champs simples
        document.getElementById('titre').value = annonce.titre;
        document.getElementById('description').value = annonce.description;
        document.getElementById('categorie').value = annonce.categorie;
        document.getElementById('marque').value = annonce.marque;
        document.getElementById('taille').value = annonce.taille;
        document.getElementById('etat').value = annonce.etat;
        document.getElementById('prix').value = annonce.prix;
        document.getElementById('formatColis').value = annonce.formatColis;
        document.getElementById('datePublication').value = annonce.datePublication;
        document.getElementById('repetition').value = annonce.repetition || '0';

        // Gérer les sélecteurs de tags (couleur, materiaux)
        const couleurs = Array.isArray(annonce.couleur) ? annonce.couleur : (annonce.couleur ? [annonce.couleur] : []);
        couleurs.forEach(color => {
            if (!color) return;
            const tag = document.querySelector(`#couleur-tags .tag-option[data-value="${color}"]`);
            if (tag) tag.classList.add('selected');
        });
        document.getElementById('couleur-input').value = couleurs.join(',');

        const materiaux = Array.isArray(annonce.materiaux) ? annonce.materiaux : (annonce.materiaux ? [annonce.materiaux] : []);
        materiaux.forEach(material => {
            if (!material) return;
            const tag = document.querySelector(`#materiaux-tags .tag-option[data-value="${material}"]`);
            if (tag) tag.classList.add('selected');
        });
        document.getElementById('materiaux-input').value = materiaux.join(',');

        // Gérer les images
        selectedFiles = annonce.images || [];
        if (window.renderPreviews) {
            window.renderPreviews();
        }

    } catch (error) {
        console.error("Erreur lors du chargement de l'annonce:", error);
        document.querySelector('main').innerHTML = `<h1>Annonce non trouvée</h1><p>${error.message}</p>`;
    }
}

/**
 * Initialise la logique pour les sélecteurs de tags personnalisés.
 */
function setupTagSelectors() {
    const tagContainers = document.querySelectorAll('.tag-container');
    tagContainers.forEach(container => {
        const input = document.getElementById(container.id.replace('-tags', '-input'));
        const limit = parseInt(container.dataset.limit, 10) || null;

        container.addEventListener('click', event => {
            if (event.target.classList.contains('tag-option')) {
                const clickedTag = event.target;
                const selectedTags = container.querySelectorAll('.tag-option.selected');

                // Gérer la sélection/désélection
                if (clickedTag.classList.contains('selected')) {
                    clickedTag.classList.remove('selected');
                } else {
                    if (!limit || selectedTags.length < limit) {
                        clickedTag.classList.add('selected');
                    }
                }

                // Mettre à jour le champ caché
                const newSelectedTags = container.querySelectorAll('.tag-option.selected');
                const selectedValues = Array.from(newSelectedTags).map(tag => tag.dataset.value);
                input.value = selectedValues.join(',');
            }
        });
    });
}

/**
 * Charge et affiche toutes les annonces sur la page all.html
 */
async function loadAllAnnonces() {
    const container = document.getElementById('annonces-list');
    if (!container) return;

    try {
        const response = await fetch('/api/annonces');
        const annonces = await response.json();

        if (annonces.length === 0) {
            container.innerHTML = '<p>Aucune annonce trouvée. Créez-en une !</p>';
            return;
        }

        const annoncesHtml = annonces.map(annonce => `
            <a href="/edit.html?id=${annonce._id}" class="card-link">
                <div class="card">
                    <img src="/uploads/${annonce.images[0]}" alt="${annonce.titre}">
                    <div class="card-content">
                        <h3>${annonce.titre}</h3>
                        <p>À poster le: ${annonce.datePublication}</p>
                    </div>
                </div>
            </a>
        `).join('');

        container.innerHTML = annoncesHtml;

    } catch (error) {
        console.error('Erreur lors du chargement des annonces:', error);
        container.innerHTML = '<p>Impossible de charger les annonces.</p>';
    }
}

/**
 * Charge et affiche les annonces du jour sur today.html
 */
let todayAnnoncesData = {};

/**
 * Charge et affiche les annonces du jour sous forme de cartes récapitulatives.
 */
async function loadTodayAnnonces() {
    const container = document.getElementById('today-list');
    if (!container) return;

    try {
        const response = await fetch('/api/annonces/today');
        const annonces = await response.json();

        if (annonces.length === 0) {
            container.innerHTML = '<p>Aucune annonce à poster aujourd\'hui.</p>';
            return;
        }

        // Stocker les données complètes et générer les cartes
        todayAnnoncesData = {}; // Reset
        const annoncesHtml = annonces.map(annonce => {
            todayAnnoncesData[annonce._id] = annonce; // Stocker par ID
            return `
                <div class="card summary-card" data-id="${annonce._id}">
                    <img src="/uploads/${annonce.images[0]}" alt="${annonce.titre}">
                    <div class="card-content">
                        <h3>${annonce.titre}</h3>
                        <p>Prix: ${annonce.prix} €</p>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = annoncesHtml;

    } catch (error) {
        console.error('Erreur lors du chargement des annonces du jour:', error);
        container.innerHTML = '<p>Impossible de charger les annonces du jour.</p>';
    }
}

/**
 * Ouvre la modale avec les détails complets d'une annonce.
 * @param {string} annonceId L'ID de l'annonce à afficher.
 */
function openTodayModal(annonceId) {
    const annonce = todayAnnoncesData[annonceId];
    if (!annonce) return;

    const modalContainer = document.getElementById('modal-container');
    const modalContent = modalContainer.querySelector('.modal-content');

    // Construction du HTML détaillé (réutilisation de la logique précédente)
    const couleurs = Array.isArray(annonce.couleur) ? annonce.couleur.join(', ') : annonce.couleur;
    const materiaux = Array.isArray(annonce.materiaux) ? annonce.materiaux.join(', ') : annonce.materiaux;
    const imagesHtml = annonce.images.map(image => `<a href="/uploads/${image}" download="${image}"><img src="/uploads/${image}" alt="Photo"></a>`).join('');
    const imageUrls = annonce.images.map(image => `/uploads/${image}`);

    const detailHtml = `
        <button class="modal-close-btn">&times;</button>
        <div class="annonce-a-poster">
            <div>
                <strong>Images :</strong>
                <button type="button" class="download-all-btn" data-images='${JSON.stringify(imageUrls)}'>Télécharger tout</button>
                <div class="image-gallery">${imagesHtml}</div>
            </div>
            <h2>Annonce : <span class="copyable-text">${annonce.titre}</span><button class="copy-btn">Copier</button></h2>
            <div>
                <strong>Description :</strong> <button class="copy-btn">Copier</button>
                <pre class="copyable-text">${annonce.description}</pre>
            </div>
            <div>
                <strong>Infos :</strong>
                <ul class="info-list">
                    <li>Catégorie: <span class="copyable-text">${annonce.categorie}</span><button class="copy-btn">Copier</button></li>
                    <li>Marque: <span class="copyable-text">${annonce.marque}</span><button class="copy-btn">Copier</button></li>
                    <li>Taille: <span class="copyable-text">${annonce.taille}</span><button class="copy-btn">Copier</button></li>
                    <li>État: <span class="copyable-text">${annonce.etat}</span><button class="copy-btn">Copier</button></li>
                    <li>Couleurs: <span class="copyable-text">${couleurs}</span><button class="copy-btn">Copier</button></li>
                    <li>Matériaux: <span class="copyable-text">${materiaux}</span><button class="copy-btn">Copier</button></li>
                    <li>Prix: <span class="copyable-text">${annonce.prix} €</span><button class="copy-btn">Copier</button></li>
                    <li>Colis: <span class="copyable-text">${annonce.formatColis}</span><button class="copy-btn">Copier</button></li>
                </ul>
            </div>
        </div>
    `;

    modalContent.innerHTML = detailHtml;
    document.body.classList.add('modal-open');
}

/**
 * Ferme la modale.
 */
function closeModal() {
    document.body.classList.remove('modal-open');
}

/**
 * Gère le clic sur un bouton de copie
 * @param {Event} event
 */
function handleCopyClick(event) {
    if (!event.target.classList.contains('copy-btn')) {
        return; // Ne rien faire si ce n'est pas un bouton de copie
    }

    const button = event.target;
    const elementToCopy = button.parentElement.querySelector('.copyable-text');

    if (elementToCopy) {
        navigator.clipboard.writeText(elementToCopy.innerText)
            .then(() => {
                // Afficher un feedback visuel
                showCopyFeedback(button, 'Copié !');
            })
            .catch(err => {
                console.error('Erreur lors de la copie:', err);
                showCopyFeedback(button, 'Erreur');
            });
    }
}

/**
 * Affiche un message temporaire à côté d'un bouton
 * @param {HTMLElement} button Le bouton à côté duquel afficher le message
 * @param {string} message Le message à afficher
 */
function showCopyFeedback(button, message) {
    // Supprimer tout feedback existant
    const existingFeedback = button.parentElement.querySelector('.copy-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    const feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.textContent = message;

    button.insertAdjacentElement('afterend', feedback);

    setTimeout(() => {
        feedback.remove();
    }, 2000); // Le message disparaît après 2 secondes
}

/**
 * Initialise la logique pour le bouton de suppression.
 */
function setupDeleteButton() {
    const deleteBtn = document.getElementById('delete-btn');
    if (!deleteBtn) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return;

    deleteBtn.addEventListener('click', async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.")) {
            try {
                const response = await fetch(`/api/annonces/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Annonce supprimée avec succès.');
                    window.location.href = '/all.html';
                } else {
                    const errorText = await response.text();
                    alert(`Erreur lors de la suppression: ${errorText}`);
                }
            } catch (error) {
                console.error('Erreur de réseau:', error);
                alert('Erreur de réseau lors de la suppression.');
            }
        }
    });
}
