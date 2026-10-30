# To-Do List Life Dashboard

A simple dashboard that helps you organize your day. Built with HTML, CSS and vanilla JavaScript. No backend, no build step. All data is stored in the browser's Local Storage.

## Features (MVP)

- **Greeting**: live time and date, with a greeting based on the time of day
- **Focus Timer**: 25-minute timer with Start, Stop and Reset
- **To-Do List**: add, edit, mark as done, delete (saved in Local Storage)
- **Quick Links**: buttons that open favorite websites (saved in Local Storage)

## Challenges chosen (3)

1. Light / Dark mode (remembered between visits)
2. Custom name in the greeting
3. Change the Pomodoro (focus timer) duration

## Project structure

```
.
├── .kiro/            # Kiro specs used while building
├── css/style.css     # the only CSS file
├── js/app.js         # the only JavaScript file
├── favicon.svg       # tab icon
├── index.html
└── README.md
```

## Run locally

Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

## Deploy with GitHub Pages

1. Push this folder to your GitHub repository.
2. Open the repository **Settings** > **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute your site is live at `https://<username>.github.io/<repository-name>/`.
