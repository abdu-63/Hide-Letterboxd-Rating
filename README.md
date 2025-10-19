# Hide-Letterboxd-Review
**Objectif** : Masquer les notes sur les films pas vus uniquement

## Théorie
#### Fonctionnement de masquage
*RATINGS*
- [ ] Détecte et masque les balises
	- [ ] "section ratings-histogram-chart"
	- [ ] "section ratings-histogram-chart tomato-ratings ratings-extras"
	- [ ] "section ratings-histogram-chart"
*ACTIVITY FROM FRIENDS*
- [ ] Détecte et masque la balise "rating -nano rated-10" (le 10 peut-être de 1-10)
**Optionnel** *Reviews from friends*
- [ ] Détecte et masque la balise "rating -green rated-10"
#### Fonctionnement pour détecter un film vu
- [ ] Non vu à masquer "action -watch ajax-click-action  " (2 espaces à la fin ?)
- [ ] Vu ne rien faire "action -watch -on"
**OU / ET (si marche)**
- [ ] Voir dans la balise "rateit-label js-rateit-label" si
	- [ ] Vu : "Rated"
	- [ ] Non vu : "Rate"

## Algorithme
Début
	SI "action -watch ajax-click-action  " ALORS
	Masquer "section ratings-histogram-chart"
	Masquer "rating -nano rated-10"
	SINON
	FIN SI
FIN
### Ajustement
- [ ] Changer le style pour un sobre en noir
- [ ] Ajouter une option dans les paramètres de l'extension pour cocher le masquage ou non
