(async () => {
    try {
        await import('vite');
        console.log('Vite imported');
    } catch (e) {
        console.log('Error importing vite:', e.message);
    }
})();
