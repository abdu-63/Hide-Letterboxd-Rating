/**
 * Extension Firefox pour Letterboxd - Cache les notes sur les films non vus
 * Basé sur les spécifications du fichier Obsidian
 */

class LetterboxdRatingHider {
    constructor() {
        this.enabled = true;
        this.observer = null;
        this.setupMessaging();
        this.init();
    }

    init() {
        // Récupérer l'état initial depuis le background puis lancer
        chrome.runtime.sendMessage({ type: 'LETTERBOXD_GET_STATE' }, (response) => {
            if (response && typeof response.enabled !== 'undefined') {
                this.enabled = response.enabled;
            }

            // Attendre que la page soit complètement chargée
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.run());
            } else {
                this.run();
            }
        });
    }

    run() {
        if (this.enabled) {
            this.hideRatings();
        } else {
            this.showRatingElements();
        }
        // Observer les changements de contenu pour les pages dynamiques
        this.setupMutationObserver();
    }

    /**
     * Fonction principale pour masquer les notes
     */
    hideRatings() {
        if (!this.enabled) {
            return;
        }
        // Vérifier si on est sur une page de film
        if (!this.isFilmPage()) {
            return;
        }

        const isFilmWatched = this.isFilmWatched();
        console.log('Film vu:', isFilmWatched);

        if (!isFilmWatched) {
            this.hideRatingElements();
        } else {
            this.showRatingElements();
        }
    }

    /**
     * Vérifie si on est sur une page de film Letterboxd
     */
    isFilmPage() {
        return window.location.pathname.includes('/film/') && 
               !window.location.pathname.includes('/reviews') &&
               !window.location.pathname.includes('/lists');
    }

    /**
     * Détermine si le film est vu ou non
     * Utilise plusieurs méthodes de détection selon les spécifications
     */
    isFilmWatched() {
        // Méthode 1: Vérifier les classes CSS du bouton watch
        const watchButton = document.querySelector('.action.-watch');
        if (watchButton) {
            const classList = watchButton.className;
            
            // Non vu: "action -watch ajax-click-action  " (avec 2 espaces)
            if (classList.includes('ajax-click-action')) {
                return false;
            }
            
            // Vu: "action -watch -on"
            if (classList.includes('-on')) {
                return true;
            }
        }

        // Méthode 2: Vérifier le texte dans rateit-label
        const rateitLabel = document.querySelector('.rateit-label.js-rateit-label');
        if (rateitLabel) {
            const labelText = rateitLabel.textContent.trim();
            
            if (labelText === 'Rate') {
                return false; // Non vu
            } else if (labelText === 'Rated') {
                return true; // Vu
            }
        }

        // Méthode 3: Vérifier si l'utilisateur a déjà noté le film
        const userRating = document.querySelector('.rating.-micro.-rated');
        if (userRating) {
            return true; // Film vu et noté
        }

        // Par défaut, considérer comme non vu
        return false;
    }

    /**
     * Masque les éléments de notes selon les spécifications
     */
    hideRatingElements() {
        // Masquer toutes les balises "section.ratings-histogram-chart" (peut y en avoir plusieurs)
        const histogramCharts = document.querySelectorAll('.section.ratings-histogram-chart');
        histogramCharts.forEach(chart => {
            chart.style.display = 'none';
            chart.classList.add('letterboxd-hidden');
        });

        // Masquer la balise spécifique "section ratings-histogram-chart tomato-ratings ratings-extras"
        const tomatoRatings = document.querySelector('.section.ratings-histogram-chart.tomato-ratings.ratings-extras');
        if (tomatoRatings) {
            tomatoRatings.style.display = 'none';
            tomatoRatings.classList.add('letterboxd-hidden');
        }

        // Masquer les notes dans l'activité des amis
        this.hideActivityRatings();

        // Masquer les avis des amis (optionnel)
        this.hideFriendReviews();

        console.log(`Notes masquées pour ce film non vu (${histogramCharts.length} histogrammes masqués)`);
    }

    /**
     * Masque les notes dans l'activité des amis
     */
    hideActivityRatings() {
        // Masquer les notes avec classe "rating -nano rated-X" où X est de 1 à 10
        for (let i = 1; i <= 10; i++) {
            const ratingElements = document.querySelectorAll(`.rating.-nano.rated-${i}`);
            ratingElements.forEach(element => {
                element.style.display = 'none';
                element.classList.add('letterboxd-hidden');
            });
        }
    }

    /**
     * Masque les avis des amis (optionnel)
     */
    hideFriendReviews() {
        // Masquer les avis avec classe "rating -green rated-X"
        for (let i = 1; i <= 10; i++) {
            const reviewElements = document.querySelectorAll(`.rating.-green.rated-${i}`);
            reviewElements.forEach(element => {
                element.style.display = 'none';
                element.classList.add('letterboxd-hidden');
            });
        }
    }

    /**
     * Affiche les éléments de notes (au cas où ils seraient cachés)
     */
    showRatingElements() {
        const hiddenElements = document.querySelectorAll('.letterboxd-hidden');
        hiddenElements.forEach(element => {
            element.style.display = '';
            element.classList.remove('letterboxd-hidden');
        });
    }

    /**
     * Configure un observer pour détecter les changements de contenu
     * Utile pour les pages qui se rechargent dynamiquement
     */
    setupMutationObserver() {
        if (this.observer) {
            return; // déjà en place
        }
        this.observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                }
            });

            if (shouldCheck) {
                // Délai pour éviter les appels trop fréquents
                setTimeout(() => {
                    if (this.enabled) {
                        this.hideRatings();
                    }
                }, 500);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Gestion des messages background → content
LetterboxdRatingHider.prototype.setupMessaging = function() {
    chrome.runtime.onMessage.addListener((message) => {
        if (!message || message.type !== 'LETTERBOXD_TOGGLE') return;
        this.enabled = !!message.enabled;
        if (this.enabled) {
            this.hideRatings();
        } else {
            this.showRatingElements();
        }
    });
};

// Initialiser l'extension
new LetterboxdRatingHider();
