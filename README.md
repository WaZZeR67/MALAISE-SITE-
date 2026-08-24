# Couverture Malaise

Site statique prepare pour GitHub et Vercel.

## Deploiement Vercel

1. Envoyer le projet sur GitHub.
2. Importer le depot dans Vercel.
3. Vercel detecte `vercel.json` et lance `npm run build`.
4. Le dossier public deploye est `dist/`.

## Variables d'environnement pour les formulaires

Ne pas mettre ces valeurs dans GitHub. Les ajouter uniquement dans Vercel, rubrique **Settings > Environment Variables** :

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `MAIL_TO`

Les demandes de devis et les fichiers joints sont envoyes par la fonction `/api/demande`.
