/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://sancan.ru',
    changefreq: 'daily',
    priority: 0.7,
    sitemapSize: 1000, // Максимум 1000 URL на файл
    generateRobotsTxt: true,
    exclude: ['/404', '/api/*'], // Исключаем ненужные страницы
    
    // Дополнительные пути для товаров и категорий
    additionalPaths: async (config) => {
        const result = [];
        
        try {
            const apiUrl = 'https://api.sancan.ru';
            console.log(`Fetching products from: ${apiUrl}/api/products`);
            
            // Получаем товары из API
            const productsResponse = await fetch(`${apiUrl}/api/products?limit=1000&status=publish`);
            
            if (!productsResponse.ok) {
                console.error(`API Error: ${productsResponse.status} ${productsResponse.statusText}`);
                return result;
            }
            
            const productsData = await productsResponse.json();
            console.log(`Products API response:`, productsData);
            
            if (productsData.data && Array.isArray(productsData.data)) {
                productsData.data.forEach(product => {
                    if (product.slug) {
                        // Убираем /ru/ префикс если есть
                        let cleanSlug = product.slug;
                        if (cleanSlug.startsWith('/ru/')) {
                            cleanSlug = cleanSlug.substring(4);
                        }
                        
                        result.push({
                            loc: `/products/${cleanSlug}`,
                            lastmod: new Date().toISOString(),
                            changefreq: 'weekly',
                            priority: 0.9,
                        });
                    }
                });
            }
            
            // Получаем категории из API
            console.log(`Fetching categories from: ${apiUrl}/api/categories`);
            const categoriesResponse = await fetch(`${apiUrl}/api/categories`);
            
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                console.log(`Categories API response:`, categoriesData);
                
                if (categoriesData.data && Array.isArray(categoriesData.data)) {
                    categoriesData.data.forEach(category => {
                        if (category.slug) {
                            // Убираем /ru/ префикс если есть
                            let cleanSlug = category.slug;
                            if (cleanSlug.startsWith('/ru/')) {
                                cleanSlug = cleanSlug.substring(4);
                            }
                            
                            result.push({
                                loc: `/categories/${cleanSlug}`,
                                lastmod: new Date().toISOString(),
                                changefreq: 'weekly',
                                priority: 0.8,
                            });
                        }
                    });
                }
            }
            
            console.log(`Generated ${result.length} additional paths for sitemap`);
            
        } catch (error) {
            console.error('Error generating additional paths for sitemap:', error);
        }
        
        return result;
    },
}
