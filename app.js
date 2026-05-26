// Supabase Configuration
const supabaseUrl = 'https://sjeidyhfbkyiahdshxga.supabase.co';
const supabaseKey = 'sb_publishable_JkZUUkVm-gP7qTM6fO7Spg_O72AdAmd';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- Composant Navigation Dynamique ---
function renderNavbar() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const path = window.location.pathname;
    const isPage = (name) => path.endsWith(name) || (name === 'index.html' && (path.endsWith('/') || path === ''));

    nav.innerHTML = `
        <div class="nav-container">
            <a href="index.html" class="nav-logo">
                <img src="assets/img/logo.png" alt="Luna Planning">
            </a>
            <div class="nav-links">
                <a href="index.html" class="${isPage('index.html') ? 'active' : ''}">
                    <i data-feather="plus-circle"></i> Créer
                </a>
                <a href="all.html" class="${isPage('all.html') ? 'active' : ''}">
                    <i data-feather="list"></i> Annonces
                </a>
                <a href="today.html" class="${isPage('today.html') ? 'active' : ''}">
                    <i data-feather="calendar"></i> Aujourd'hui
                </a>
                <a href="sold.html" class="${isPage('sold.html') ? 'active' : ''}">
                    <i data-feather="check-square"></i> Vendues
                </a>
                <a href="#" id="logout-btn" style="margin-left: auto; color: #ef4444;">
                    <i data-feather="log-out"></i> Déconnexion
                </a>
            </div>
        </div>
    `;

    // Ré-initialiser les icônes feather après l'injection
    if (window.feather) feather.replace();

    // Gérer la déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await _supabase.auth.signOut();
            window.location.href = 'login.html';
        });
    }
}

// --- Protection des pages et Gestion de Session ---
async function checkAuth() {
    const { data: { session } } = await _supabase.auth.getSession();
    const isLoginPage = window.location.pathname.endsWith('/login.html');

    if (!session && !isLoginPage) {
        window.location.href = 'login.html';
    } else if (session && isLoginPage) {
        window.location.href = 'index.html';
    }
    
    if (session) {
        renderNavbar();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // --- Logique spécifique à la page ---
    const path = window.location.pathname;

    if (path.endsWith('/all.html')) {
        loadAllAnnonces();
    }

    if (path.endsWith('/today.html')) {
        loadTodayAnnonces();
    }

    if (path.endsWith('/sold.html')) {
        loadSoldAnnonces();
    }

    if (path.endsWith('/index.html') || path.endsWith('/') || path === '') {
        selectedFiles = [];
        setupTagSelectors();
        setupBrandAutocomplete();
        setupCategoryAutocomplete(); 
        setupPhotoPreviews();
        handleFormSubmission();
    }

    if (path.endsWith('/edit.html')) {
        selectedFiles = [];
        setupTagSelectors();
        setupBrandAutocomplete();
        setupCategoryAutocomplete(); 
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
        const copyBtn = event.target.closest('.copy-btn');
        if (copyBtn) {
            handleCopyClick(event);
        }
        if (event.target.classList.contains('download-all-btn')) {
            handleDownloadAll(event);
        }
    });
});

/**
 * Gère le clic sur le bouton "Télécharger tout".
 */
function handleDownloadAll(event) {
    const button = event.target;
    const images = JSON.parse(button.dataset.images || '[]');
    
    images.forEach((imageUrl, index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = imageUrl.split('/').pop().split('?')[0]; 
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }, index * 300); 
    });
}

/**
 * Autocomplete Marque
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
        suggestionsContainer.style.display = filteredBrands.length > 0 ? 'block' : 'none';
    };

    input.addEventListener('focus', () => showSuggestions(input.value));
    input.addEventListener('input', () => showSuggestions(input.value));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) suggestionsContainer.style.display = 'none';
    });
}

/**
 * Autocomplete Catégorie
 */
function setupCategoryAutocomplete() {
    const input = document.getElementById('categorie');
    const suggestionsContainer = document.getElementById('categorie-suggestions');
    if (!input || !suggestionsContainer) return;

    const categories = [
        "Femme|Vêtements|Robes|Robes d'été", "Femme|Vêtements|Robes|Robes de soirée",
        "Femme|Vêtements|Robes|Robes longues", "Femme|Vêtements|Tops & T-shirts|T-shirts",
        "Femme|Vêtements|Tops & T-shirts|Débardeurs", "Femme|Vêtements|Jeans|Jeans skinny",
        "Femme|Vêtements|Jeans|Jeans boyfriend", "Femme|Vêtements|Pulls & Gilets|Pulls",
        "Femme|Vêtements|Pulls & Gilets|Gilets", "Femme|Chaussures|Baskets",
        "Femme|Chaussures|Talons", "Femme|Sacs|Sacs à main",
        "Femme|Sacs|Sacs bandoulière", "Femme|Accessoires|Bijoux|Colliers",
        "Femme|Accessoires|Bijoux|Bracelets", "Homme|Vêtements|T-shirts & Débardeurs",
        "Homme|Vêtements|Chemises", "Homme|Vêtements|Pantalons|Pantalons chino",
        "Homme|Vêtements|Pantalons|Jeans", "Homme|Chaussures|Baskets",
        "Homme|Chaussures|Chaussures de ville", "Homme|Accessoires|Ceintures",
        "Enfant|Filles|Vêtements|Robes", "Enfant|Garçons|Vêtements|T-shirts",
        "Maison|Textiles|Linge de lit", "Maison|Décoration|Vases"
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
                input.value = filter; 
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'none';
            });
            suggestionsContainer.appendChild(item);
        }
        suggestionsContainer.style.display = 'block';
    };

    input.addEventListener('focus', () => showSuggestions(input.value));
    input.addEventListener('input', () => showSuggestions(input.value));
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) suggestionsContainer.style.display = 'none';
    });
}

let selectedFiles = []; 

/**
 * Aperçu des photos
 */
function setupPhotoPreviews() {
    const photoInput = document.getElementById('photos');
    const previewContainer = document.getElementById('photos-preview');
    const dropZone = document.querySelector('.file-drop-zone');
    if (!photoInput || !previewContainer || !dropZone) return;

    let draggedIndex = null;

    function handleFiles(files) {
        const fileList = Array.from(files);
        const remainingSlots = 10 - selectedFiles.length;
        
        if (fileList.length > remainingSlots) {
            alert(`Vous ne pouvez ajouter que ${remainingSlots} photo(s) supplémentaire(s) (Maximum 10 au total).`);
        }

        fileList.slice(0, remainingSlots).forEach(file => {
            // Éviter les doublons par nom de fichier
            if (!selectedFiles.find(f => (f.name || f) === file.name)) {
                selectedFiles.push(file);
            }
        });
        
        renderPreviews();
    }

    photoInput.addEventListener('change', () => {
        handleFiles(photoInput.files);
        photoInput.value = '';
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('is-active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('is-active'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('is-active'); handleFiles(e.dataTransfer.files); });

    window.renderPreviews = function() {
        previewContainer.innerHTML = '';
        selectedFiles.forEach((fileOrString, index) => {
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'preview-image-container';
            previewWrapper.setAttribute('draggable', 'true');
            previewWrapper.setAttribute('data-index', index);

            const img = document.createElement('img');
            img.addEventListener('click', () => openLightbox(index)); 

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-image-btn';
            removeBtn.innerHTML = '<i data-feather="x"></i>';
            removeBtn.type = 'button';
            removeBtn.addEventListener('click', (e) => { e.stopPropagation(); selectedFiles.splice(index, 1); renderPreviews(); });

            previewWrapper.appendChild(img);
            previewWrapper.appendChild(removeBtn);
            previewContainer.appendChild(previewWrapper);

            previewWrapper.addEventListener('dragstart', (e) => { draggedIndex = index; setTimeout(() => e.target.classList.add('is-dragging'), 0); });
            previewWrapper.addEventListener('dragend', (e) => e.target.classList.remove('is-dragging'));
            previewWrapper.addEventListener('dragover', (e) => { e.preventDefault(); const target = e.target.closest('.preview-image-container'); if (target && draggedIndex !== Number(target.dataset.index)) target.classList.add('is-drag-over'); });
            previewWrapper.addEventListener('dragleave', (e) => e.target.closest('.preview-image-container').classList.remove('is-drag-over'));
            previewWrapper.addEventListener('drop', (e) => {
                e.preventDefault();
                const target = e.target.closest('.preview-image-container');
                target.classList.remove('is-drag-over');
                const droppedOnIndex = Number(target.dataset.index);
                if (draggedIndex === droppedOnIndex) return;
                const [draggedItem] = selectedFiles.splice(draggedIndex, 1);
                selectedFiles.splice(droppedOnIndex, 0, draggedItem);
                renderPreviews();
            });

            if (typeof fileOrString === 'string') img.src = fileOrString;
            else { const reader = new FileReader(); reader.onload = (e) => { img.src = e.target.result; }; reader.readAsDataURL(fileOrString); }
        });
        if (window.feather) feather.replace();
    }
}

// Lightbox
let currentLightboxIndex = 0;
function openLightbox(index) {
    currentLightboxIndex = index;
    const lightboxContainer = document.createElement('div');
    lightboxContainer.id = 'lightbox-container';
    lightboxContainer.className = 'lightbox-container';
    document.body.appendChild(lightboxContainer);
    document.body.classList.add('modal-open'); 
    showLightboxImage();
    window.addEventListener('keydown', handleLightboxKeys);
}
function showLightboxImage() {
    const lightboxContainer = document.getElementById('lightbox-container');
    if (!lightboxContainer) return;
    const fileOrString = selectedFiles[currentLightboxIndex];
    let imgSrc = typeof fileOrString === 'string' ? fileOrString : URL.createObjectURL(fileOrString);
    lightboxContainer.innerHTML = `
        <div class="lightbox-backdrop" onclick="closeLightbox()"></div>
        <button class="lightbox-close" onclick="closeLightbox()">&times;</button>
        <button class="lightbox-prev" style="display: ${currentLightboxIndex > 0 ? 'flex' : 'none'}">‹</button>
        <div class="lightbox-content"><img src="${imgSrc}" alt="Aperçu"></div>
        <button class="lightbox-next" style="display: ${currentLightboxIndex < selectedFiles.length - 1 ? 'flex' : 'none'}">›</button>
    `;
    lightboxContainer.querySelector('.lightbox-prev').addEventListener('click', () => { currentLightboxIndex--; showLightboxImage(); });
    lightboxContainer.querySelector('.lightbox-next').addEventListener('click', () => { currentLightboxIndex++; showLightboxImage(); });
}
function closeLightbox() {
    const container = document.getElementById('lightbox-container');
    if (container) document.body.removeChild(container);
    document.body.classList.remove('modal-open');
    window.removeEventListener('keydown', handleLightboxKeys);
}
function handleLightboxKeys(e) {
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft' && currentLightboxIndex > 0) { currentLightboxIndex--; showLightboxImage(); }
    else if (e.key === 'ArrowRight' && currentLightboxIndex < selectedFiles.length - 1) { currentLightboxIndex++; showLightboxImage(); }
}

/**
 * Upload Images
 */
async function uploadImages(files) {
    const uploadedUrls = [];
    const { data: { user } } = await _supabase.auth.getUser();
    
    for (const file of files) {
        if (typeof file === 'string') {
            uploadedUrls.push(file);
            continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await _supabase.storage
            .from('photos')
            .upload(fileName, file);

        if (error) throw error;
        const { data: urlData } = _supabase.storage.from('photos').getPublicUrl(fileName);
        uploadedUrls.push(urlData.publicUrl);
    }
    return uploadedUrls;
}

/**
 * Submit Form
 */
function handleFormSubmission() {
    const form = document.querySelector('.annonce-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enregistrement...';

        try {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            const isEditMode = !!id;
            const formData = new FormData(form);
            const imageLinks = await uploadImages(selectedFiles);

            if (imageLinks.length === 0) {
                alert('Veuillez sélectionner au moins une photo.');
                submitBtn.disabled = false;
                submitBtn.textContent = isEditMode ? 'Mettre à jour' : 'Créer le brouillon';
                return;
            }

            const { data: { user } } = await _supabase.auth.getUser();
            const annonceData = {
                titre: formData.get('titre'),
                description: formData.get('description'),
                categorie: formData.get('categorie'),
                marque: formData.get('marque'),
                taille: formData.get('taille'),
                etat: formData.get('etat'),
                couleur: formData.get('couleur') ? formData.get('couleur').split(',') : [],
                materiaux: formData.get('materiaux') ? formData.get('materiaux').split(',') : [],
                prix: parseFloat(formData.get('prix')),
                format_colis: formData.get('formatColis'),
                date_publication: formData.get('datePublication') ? new Date(formData.get('datePublication')).toISOString() : null,
                repetition: parseInt(formData.get('repetition'), 10),
                images: imageLinks,
                is_sold: formData.get('isSold') === 'on',
                user_id: user.id
            };

            let res;
            if (isEditMode) res = await _supabase.from('annonces').update(annonceData).eq('id', id);
            else res = await _supabase.from('annonces').insert([annonceData]);

            if (res.error) throw res.error;
            window.location.href = 'all.html';

        } catch (error) {
            console.error(error);
            alert(`Erreur: ${error.message}`);
            submitBtn.disabled = false;
            submitBtn.textContent = 'Créer le brouillon';
        }
    });
}

/**
 * Populate Edit Form
 */
async function populateEditForm() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    try {
        const { data: annonce, error } = await _supabase.from('annonces').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('titre').value = annonce.titre;
        document.getElementById('description').value = annonce.description;
        document.getElementById('categorie').value = annonce.categorie;
        document.getElementById('marque').value = annonce.marque;
        document.getElementById('taille').value = annonce.taille;
        document.getElementById('etat').value = annonce.etat;
        document.getElementById('prix').value = annonce.prix;
        document.getElementById('formatColis').value = annonce.format_colis;
        if (annonce.date_publication) document.getElementById('datePublication').value = new Date(annonce.date_publication).toISOString().split('T')[0];
        document.getElementById('repetition').value = annonce.repetition || '0';
        if (document.getElementById('isSold')) document.getElementById('isSold').checked = annonce.is_sold || false;

        (annonce.couleur || []).forEach(color => {
            const tag = document.querySelector(`#couleur-tags .tag-option[data-value="${color}"]`);
            if (tag) tag.classList.add('selected');
        });
        document.getElementById('couleur-input').value = (annonce.couleur || []).join(',');

        (annonce.materiaux || []).forEach(mat => {
            const tag = document.querySelector(`#materiaux-tags .tag-option[data-value="${mat}"]`);
            if (tag) tag.classList.add('selected');
        });
        document.getElementById('materiaux-input').value = (annonce.materiaux || []).join(',');

        selectedFiles = annonce.images || [];
        renderPreviews();

    } catch (error) {
        console.error(error);
        document.querySelector('main').innerHTML = `<h1>Erreur</h1><p>${error.message}</p>`;
    }
}

function setupTagSelectors() {
    document.querySelectorAll('.tag-container').forEach(container => {
        const input = document.getElementById(container.id.replace('-tags', '-input'));
        const limit = parseInt(container.dataset.limit, 10) || null;
        container.addEventListener('click', e => {
            if (e.target.classList.contains('tag-option')) {
                const clicked = e.target;
                const selected = container.querySelectorAll('.tag-option.selected');
                if (clicked.classList.contains('selected')) clicked.classList.remove('selected');
                else if (!limit || selected.length < limit) clicked.classList.add('selected');
                input.value = Array.from(container.querySelectorAll('.tag-option.selected')).map(t => t.dataset.value).join(',');
            }
        });
    });
}

function formatDate(ds) { if (!ds) return 'Non définie'; const d = new Date(ds); return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`; }
function toYYYYMMDD(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function toUTCYYYYMMDD(d) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`; }

let allAnnoncesData = [];
let currentCalendarDate = new Date();

async function loadAllAnnonces() {
    const grid = document.getElementById('grid-view');
    if (!grid) return;
    setupViewSwitcher();
    try {
        const { data, error } = await _supabase.from('annonces').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allAnnoncesData = data;
        renderGridView();
        renderCalendarView();
    } catch (error) { console.error(error); grid.innerHTML = '<p>Erreur lors du chargement.</p>'; }
}

function renderGridView() {
    const container = document.getElementById('grid-view');
    if (!container) return;
    allAnnoncesData.sort((a,b) => (b.date_publication ? new Date(b.date_publication) : 0) - (a.date_publication ? new Date(a.date_publication) : 0));
    if (allAnnoncesData.length === 0) { container.innerHTML = '<p>Aucune annonce.</p>'; return; }
    container.innerHTML = allAnnoncesData.map(a => `
        <a href="edit.html?id=${a.id}" class="card-link">
            <div class="card ${a.is_sold ? 'is-sold' : ''}">
                ${a.is_sold ? '<div class="sold-badge">Vendu</div>' : ''}
                <div class="card-image-wrapper">
                    <img src="${a.images[0]}" alt="${a.titre}" loading="lazy">
                </div>
                <div class="card-content">
                    <div class="card-price">${a.prix.toFixed(2)} €</div>
                    <div class="card-title">${a.titre}</div>
                    <div class="card-info">
                        <span class="card-brand">${a.marque || 'Sans marque'}</span>
                        <span class="card-date">
                            <i data-feather="calendar"></i> ${formatDate(a.date_publication)}
                        </span>
                    </div>
                </div>
            </div>
        </a>
    `).join('');
    if (window.feather) feather.replace();
}

function renderCalendarView() {
    const container = document.getElementById('calendar-view');
    if (!container) return;
    container.innerHTML = '';
    const y = currentCalendarDate.getFullYear();
    const m = currentCalendarDate.getMonth();
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `<button onclick="changeMonth(-1)">‹</button><h2>${currentCalendarDate.toLocaleString('fr-FR', {month:'long', year:'numeric'})}</h2><button onclick="changeMonth(1)">›</button>`;
    container.appendChild(header);
    window.changeMonth = (delta) => { currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta); renderCalendarView(); };
    
    const grid = document.createElement('div'); grid.className = 'calendar-grid';
    ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].forEach(d => { const h = document.createElement('div'); h.className='calendar-day-header'; h.textContent=d; grid.appendChild(h); });

    const events = {};
    const calEnd = new Date(y, m + 1, 0);
    allAnnoncesData.forEach(a => {
        if (!a.date_publication || a.is_sold) return;
        let curr = new Date(a.date_publication);
        const rep = parseInt(a.repetition, 10);
        if (rep > 0) {
            while (curr.getFullYear() < y || (curr.getFullYear() === y && curr.getUTCMonth() < m)) curr.setUTCDate(curr.getUTCDate() + rep);
        }
        while (curr <= calEnd) {
            if (curr >= new Date(y, m, 1)) {
                const k = toUTCYYYYMMDD(curr);
                if (!events[k]) events[k] = [];
                events[k].push(a);
            }
            if (rep > 0) curr.setUTCDate(curr.getUTCDate() + rep); else break;
        }
    });

    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    for (let i = 0; i < first; i++) { const c = document.createElement('div'); c.className='calendar-day is-other-month'; grid.appendChild(c); }
    for (let i = 1; i <= total; i++) {
        const c = document.createElement('div'); c.className='calendar-day';
        const d = new Date(y, m, i);
        c.addEventListener('click', (e) => { if (!e.target.closest('.calendar-annonce')) openAssignModal(d); });
        c.innerHTML = `<div class="day-number">${i}</div>`;
        const k = toYYYYMMDD(d);
        if (events[k]) events[k].forEach(a => {
            const e = document.createElement('a'); e.href=`edit.html?id=${a.id}`; e.className='calendar-annonce';
            e.innerHTML=`<img src="${a.images[0]}"><span>${a.titre}</span>`;
            c.appendChild(e);
        });
        grid.appendChild(c);
    }
    container.appendChild(grid);
}

function openAssignModal(date) {
    const container = document.getElementById('assign-modal-container');
    if (!container) return;
    const ads = allAnnoncesData.filter(a => !a.is_sold);
    container.innerHTML = `
        <div class="modal-backdrop" onclick="closeAssignModal()"></div>
        <div class="modal-content">
            <button class="modal-close-btn" onclick="closeAssignModal()">&times;</button>
            <h2>Assigner au ${date.toLocaleDateString('fr-FR')}</h2>
            <div class="assign-list">${ads.map(a => `<div class="assign-annonce-item" data-id="${a.id}"><img src="${a.images[0]}"><span>${a.titre}</span></div>`).join('') || '<p>Aucune annonce.</p>'}</div>
        </div>
    `;
    container.querySelectorAll('.assign-annonce-item').forEach(item => {
        item.addEventListener('click', async () => {
            const id = item.dataset.id;
            const up = { date_publication: new Date(date).toISOString(), repetition: 14 };
            const { error } = await _supabase.from('annonces').update(up).eq('id', id);
            if (error) alert(error.message); else { 
                const ad = allAnnoncesData.find(x => x.id === id);
                if (ad) { ad.date_publication = up.date_publication; ad.repetition = up.repetition; }
                closeAssignModal(); renderCalendarView(); renderGridView();
            }
        });
    });
    document.body.classList.add('modal-open');
}
function closeAssignModal() { const c = document.getElementById('assign-modal-container'); if (c) c.innerHTML = ''; document.body.classList.remove('modal-open'); }

function setupViewSwitcher() {
    const gBtn = document.getElementById('grid-view-btn');
    const cBtn = document.getElementById('calendar-view-btn');
    const gV = document.getElementById('grid-view');
    const cV = document.getElementById('calendar-view');
    if (!gBtn || !cBtn) return;
    gBtn.onclick = () => { gBtn.classList.add('active'); cBtn.classList.remove('active'); gV.classList.remove('is-hidden'); cV.classList.add('is-hidden'); };
    cBtn.onclick = () => { cBtn.classList.add('active'); gBtn.classList.remove('active'); cV.classList.remove('is-hidden'); gV.classList.add('is-hidden'); };
}

async function loadSoldAnnonces() {
    const c = document.getElementById('annonces-list');
    if (!c) return;
    const { data, error } = await _supabase.from('annonces').select('*').eq('is_sold', true).order('created_at', { ascending: false });
    if (error) { console.error(error); return; }
    if (data.length === 0) { c.innerHTML = '<p>Aucune annonce vendue.</p>'; return; }
    
    c.innerHTML = data.map(a => `
        <a href="edit.html?id=${a.id}" class="card-link">
            <div class="card is-sold">
                <div class="sold-badge">Vendu</div>
                <div class="card-image-wrapper">
                    <img src="${a.images[0]}" alt="${a.titre}" loading="lazy">
                </div>
                <div class="card-content">
                    <div class="card-price">${a.prix.toFixed(2)} €</div>
                    <div class="card-title">${a.titre}</div>
                    <div class="card-info">
                        <span class="card-brand">${a.marque || 'Sans marque'}</span>
                    </div>
                </div>
            </div>
        </a>
    `).join('');
    if (window.feather) feather.replace();
}

let todayAnnoncesData = {};
async function loadTodayAnnonces() {
    const c = document.getElementById('today-list');
    if (!c) return;
    const { data, error } = await _supabase.from('annonces').select('*').eq('is_sold', false);
    if (error) return;
    const today = new Date(); today.setHours(0,0,0,0);
    const ads = data.filter(a => {
        if (!a.date_publication) return false;
        const d = new Date(a.date_publication); d.setHours(0,0,0,0);
        if (today < d) return false;
        const r = parseInt(a.repetition, 10);
        if (!r || r <= 0) return today.getTime() === d.getTime();
        return Math.floor(Math.abs(today - d) / 86400000) % r === 0;
    });
    
    if (ads.length === 0) { c.innerHTML = '<p>Rien à poster aujourd\'hui.</p>'; return; }
    
    todayAnnoncesData = {};
    c.innerHTML = ads.map(a => {
        todayAnnoncesData[a.id] = a;
        return `
            <div class="card summary-card" data-id="${a.id}" style="cursor: pointer;">
                <div class="card-image-wrapper">
                    <img src="${a.images[0]}" alt="${a.titre}">
                </div>
                <div class="card-content">
                    <div class="card-price">${a.prix.toFixed(2)} €</div>
                    <div class="card-title">${a.titre}</div>
                    <div class="card-info">
                        <span>${a.marque || 'Sans marque'}</span>
                        <span style="color: var(--primary); font-weight: 700;">Détails <i data-feather="arrow-right" style="width: 14px; height: 14px;"></i></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    if (window.feather) feather.replace();
}

function openTodayModal(id) {
    const a = todayAnnoncesData[id]; if (!a) return;
    const m = document.getElementById('modal-container');
    const content = m.querySelector('.modal-content');
    
    const couleurs = Array.isArray(a.couleur) ? a.couleur.join(', ') : '';
    const materiaux = Array.isArray(a.materiaux) ? a.materiaux.join(', ') : '';
    
    content.innerHTML = `
        <button class="modal-close-btn">&times;</button>
        <div class="annonce-details-premium">
            <div class="details-grid">
                <div class="details-gallery">
                    <label>Photos (Glissez-les vers Vinted)</label>
                    <div class="gallery-thumbs" id="modal-gallery">
                        ${a.images.map((img, idx) => `<img src="${img}" draggable="true" data-index="${idx}" title="Glissez cette image">`).join('')}
                    </div>
                    <button type="button" class="btn-submit download-all-btn" data-images='${JSON.stringify(a.images)}' style="margin-top: 10px;">
                        <i data-feather="download"></i> Tout télécharger
                    </button>
                    <div class="drag-tip">
                        <i data-feather="info"></i>
                        <span><strong>Astuce :</strong> Cliquez sur "Tout télécharger", puis glissez les fichiers depuis la barre de téléchargement de votre navigateur vers Vinted pour tout envoyer d'un coup !</span>
                    </div>
                </div>
                
                <div class="details-info">
                    <div class="card-price" style="font-size: 2rem; margin-bottom: 5px;">${a.prix.toFixed(2)} €</div>
                    <h2 style="margin-top: 0; display: flex; align-items: center; justify-content: space-between;">
                        <span class="copyable-text">${a.titre}</span>
                        <button class="copy-btn"><i data-feather="copy"></i></button>
                    </h2>
                    
                    <div class="info-section">
                        <label>Description</label>
                        <div style="position: relative;">
                            <pre class="copyable-text">${a.description}</pre>
                            <button class="copy-btn" style="position: absolute; top: 10px; right: 10px;"><i data-feather="copy"></i></button>
                        </div>
                    </div>

                    <div class="info-section">
                        <label>Fiche technique</label>
                        <ul class="premium-info-list">
                            <li><span>Catégorie</span> <strong><span class="copyable-text">${a.categorie}</span> <button class="copy-btn small"><i data-feather="copy"></i></button></strong></li>
                            <li><span>Marque</span> <strong><span class="copyable-text">${a.marque}</span> <button class="copy-btn small"><i data-feather="copy"></i></button></strong></li>
                            <li><span>Taille</span> <strong><span class="copyable-text">${a.taille}</span> <button class="copy-btn small"><i data-feather="copy"></i></button></strong></li>
                            <li><span>État</span> <strong><span class="copyable-text">${a.etat}</span> <button class="copy-btn small"><i data-feather="copy"></i></button></strong></li>
                            <li><span>Couleurs</span> <strong><span class="copyable-text">${couleurs}</span> <button class="copy-btn small"><i data-feather="copy"></i></button></strong></li>
                            <li><span>Matériaux</span> <strong><span class="copyable-text">${materiaux}</span> <button class="copy-btn small"><i data-feather="copy"></i></button></strong></li>
                            <li><span>Colis</span> <strong><span class="copyable-text">${a.format_colis}</span> <button class="copy-btn small"><i data-feather="copy"></i></button></strong></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Ajouter les événements de drag pour marquer les photos déjà glissées
    const galleryImgs = content.querySelectorAll('.gallery-thumbs img');
    galleryImgs.forEach(img => {
        img.addEventListener('dragend', () => {
            img.classList.add('dragged');
        });
    });

    if (window.feather) feather.replace();
    document.body.classList.add('modal-open');
}
function closeModal() { document.body.classList.remove('modal-open'); }
function handleCopyClick(e) {
    const b = e.target.closest('.copy-btn'); 
    if (!b) return;
    
    const container = b.closest('div, h2, li, strong');
    const txtElement = container ? container.querySelector('.copyable-text') : null;

    if (txtElement) {
        const textToCopy = txtElement.innerText || txtElement.textContent;
        navigator.clipboard.writeText(textToCopy.trim()).then(() => {
            const fb = document.createElement('span'); 
            fb.className = 'copy-feedback'; 
            fb.textContent = 'Copié !';
            
            b.appendChild(fb); 
            
            setTimeout(() => fb.remove(), 2000);
        }).catch(err => {
            console.error('Erreur de copie:', err);
            alert('Erreur lors de la copie. Veuillez réessayer.');
        });
    }
}

function setupDeleteButton() {
    const btn = document.getElementById('delete-btn');
    const id = new URLSearchParams(window.location.search).get('id');
    if (btn && id) btn.onclick = async () => {
        if (confirm("Supprimer ?")) {
            const { error } = await _supabase.from('annonces').delete().eq('id', id);
            if (error) alert(error.message); else window.location.href = 'all.html';
        }
    };
}
