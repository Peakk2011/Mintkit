import { Mint } from './lib/mint.js';

export const Webfunctions = async (Main) => {
    async function SyncFavicons() {
        try {
            const faviconLink = document.getElementById('favicon');
            if (!faviconLink) {
                console.error('id="favicon" not found.');
                return;
            }
            const lightModeFaviconPath = '../assists/FavIcons/lightmode.svg';
            const darkModeFaviconPath = '../assists/FavIcons/darkmode.svg';
            const checkFaviconExists = async (path) => {
                try {
                    const response = await fetch(path, { method: 'HEAD' });
                    return response.ok;
                } catch (error) {
                    console.warn(`Cannot check favicon at: ${path}`, error);
                    return false;
                }
            };
            const updateFaviconBasedOnTheme = async (isDarkMode) => {
                const targetPath = isDarkMode ? darkModeFaviconPath : lightModeFaviconPath;

                const exists = await checkFaviconExists(targetPath);

                if (exists) {
                    faviconLink.href = targetPath;
                } else {
                    console.warn(`Favicon file not found: ${targetPath}`);
                }
            };

            const darkModeFavicons = window.matchMedia('(prefers-color-scheme: dark)');
            await updateFaviconBasedOnTheme(darkModeFavicons.matches);
            darkModeFavicons.addEventListener('change', async (event) => {
                await updateFaviconBasedOnTheme(event.matches);
            });

        } catch (error) {
            console.error('Error to sync favicons:', error);
        }
    }

    await SyncFavicons();
};