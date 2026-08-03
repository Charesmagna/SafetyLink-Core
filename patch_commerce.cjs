const fs = require('fs');
const path = 'src/components/CommerceCenter.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add state variable and useEffect inside the component
const target1 = `  const [activeTab, setActiveTab] = useState<'catalog' | 'calculator'>('catalog');`;
const repl1 = `  const [activeTab, setActiveTab] = useState<'catalog' | 'calculator'>('catalog');
  const [hardwareCatalog, setHardwareCatalog] = useState<HardwareProduct[]>(HARDWARE_CATALOG);

  React.useEffect(() => {
    // 1. Shopify Storefront API (Headless Commerce) Implementation
    const fetchShopifyProducts = async () => {
      try {
        const domain = import.meta.env.VITE_SHOPIFY_DOMAIN || 'safetylink-demo.myshopify.com';
        const storefrontAccessToken = import.meta.env.VITE_SHOPIFY_TOKEN || 'placeholder_token';
        
        if (storefrontAccessToken === 'placeholder_token') return;
        
        const query = \`
          {
            products(first: 20) {
              edges {
                node {
                  id
                  title
                  description
                  variants(first: 1) {
                    edges {
                      node {
                        price {
                          amount
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        \`;
        
        const response = await fetch(\`https://\${domain}/api/2024-01/graphql.json\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Storefront-Access-Token': storefrontAccessToken
          },
          body: JSON.stringify({ query })
        });
        
        const json = await response.json();
        if (json.data && json.data.products) {
          const shopifyProducts = json.data.products.edges.map((edge: any) => {
            const node = edge.node;
            return {
              id: node.id,
              name: node.title,
              description: node.description || 'Enterprise hardware node',
              priceZAR: parseFloat(node.variants.edges[0]?.node?.price?.amount || '0'),
              category: 'BaseStation',
              icon: '📦'
            };
          });
          
          if (shopifyProducts.length > 0) {
            setHardwareCatalog(shopifyProducts);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch from Shopify Storefront API', err);
      }
    };
    
    fetchShopifyProducts();
  }, []);`;

content = content.replace(target1, repl1);

// 2. Replace HARDWARE_CATALOG map with hardwareCatalog map
content = content.replace(/HARDWARE_CATALOG\.map/g, 'hardwareCatalog.map');

// 3. Replace HARDWARE_CATALOG.find with hardwareCatalog.find
content = content.replace(/HARDWARE_CATALOG\.find/g, 'hardwareCatalog.find');

fs.writeFileSync(path, content);
console.log('Patched CommerceCenter.tsx');
