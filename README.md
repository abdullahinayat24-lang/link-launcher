# DREAMSLABSTUDIO // Cyber Link Launcher

A futuristic, glass-chrome Chrome Profile Link Launcher web application with Master Password encryption and Cloud Sync.

## Features
- **Futuristic Cyber Glassmorphism**: Translucent frosted panels, glowing neon accents, and sleek metallic finish.
- **DreamsLabStudio Branding**: Inspired by the official DreamsLabStudio banner with vibrant orange cyber styling.
- **Chrome Profile Launching**: Direct launching into 13 pre-configured Chrome profiles (*Airah, Asghar, Entertaindo, Mythos1-5, Rana, Sara, Sumaiya, Your Chrome*).
- **Master Password Security**: Holographic cyber vault with client-side **AES-256-GCM** encryption via Web Crypto API.
- **Online Cross-Computer Cloud Sync**: Real-time encrypted syncing via GitHub Gist or Cloud Vault API.
- **GitHub Pages Ready**: Accessible anywhere online through `index.html`.

## Deployment to GitHub Pages
1. Push this folder to your GitHub repository (or create a new repo `link-launcher`).
2. In GitHub, go to **Settings** > **Pages**.
3. Under **Branch**, select `main` (root) and click **Save**.
4. Your Link Launcher will be live at `https://<your-username>.github.io/<repo-name>/`!

## Windows Protocol Setup (One-Time on any PC)
To enable direct launching of links into specific Chrome profiles:
1. Double-click `register-profile-protocol.bat`.
2. Windows registers the `chromeprofile://` protocol.
3. Clicking any link in the launcher opens the exact assigned Chrome profile!
