import { Mint } from './mintkit/mint.js';
import '/Content.js';

export const Webfunctions = async (Main) => {
    async function SyncFavicons() {
        try {
            const faviconLink = document.getElementById('favicon');
            if (!faviconLink) {
                console.error('id="favicon" not found.');
                return;
            }
            
            const lightModeFaviconPath = '/assets/FavIcons/lightmode.svg';
            const darkModeFaviconPath = '/assets/FavIcons/darkmode.svg';
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

    const zoomPreventionState = Mint.createState({ preventedCount: 0 });

    const EventZoomHook = (state) => {
        document.addEventListener('keydown', async (event) => {
            if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=' || event.key === '-')) {
                event.preventDefault();
                await new Promise(resolve => setTimeout(resolve, 1));
                state.set(currentState => ({ preventedCount: currentState.preventedCount + 1 }));
            }
        });
        document.addEventListener('wheel', async (event) => {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                await new Promise(resolve => setTimeout(resolve, 1));
                state.set(currentState => ({ preventedCount: currentState.preventedCount + 1 }));
            }
        }, { passive: false });
    };

    EventZoomHook(zoomPreventionState);
    await SyncFavicons();
};