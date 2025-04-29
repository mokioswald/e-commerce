document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);
    
    const selects = document.querySelectorAll('select');
    M.FormSelect.init(selects);
    
    const sidenavs = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenavs);
    
    // Store state
    const state = {
        products: [],
        cart: [],
        currentCategory: 'all'
    };
    
    // Load products from API
    loadProducts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load cart from localStorage if available
    loadCart();
    
    /**
     * Load products from fake store API
     */
    function loadProducts() {
        fetch('https://fakestoreapi.com/products')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                state.products = data.map(product => ({
                    ...product,
                    // Map the API categories to our categories
                    category: mapCategory(product.category)
                }));
                displayProducts(state.products);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                displayErrorMessage('Failed to load products. Please try again later.');
            });
    }
    
    /**
     * Map API categories to our display categories
     */
    function mapCategory(apiCategory) {
        const categoryMap = {
            "men's clothing": "clothing",
            "women's clothing": "clothing",
            "jewelery": "accessories",
            "electronics": "electronics"
        };
        
        return categoryMap[apiCategory] || apiCategory;
    }
    
    /**
     * Display products in the product list
     */
    function displayProducts(products) {
        const productList = document.getElementById('product-list');
        
        // Clear loading indicator
        productList.innerHTML = '';
        
        // Filter products by category if needed
        let displayProducts = products;
        if (state.currentCategory !== 'all') {
            displayProducts = products.filter(product => 
                product.category === state.currentCategory
            );
        }
        
        // Display message if no products found
        if (displayProducts.length === 0) {
            productList.innerHTML = `
                <div class="col s12">
                    <div class="card-panel">
                        <p class="center-align">No products found in this category.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create product cards
        displayProducts.forEach(product => {
            const productCard = createProductCard(product);
            productList.appendChild(productCard);
        });
    }
    
    /**
     * Create a product card element
     */
    function createProductCard(product) {
        const col = document.createElement('div');
        col.className = 'col s12 m6 l4';
        
        col.innerHTML = `
            <div class="card product-card" data-id="${product.id}">
                <div class="card-image">
                    <img src="${product.image}" alt="${product.title}">
                </div>
                <div class="card-content">
                    <h3 class="card-title">${product.title}</h3>
                    <p class="product-category">${product.category}</p>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                </div>
                <div class="card-action">
                    <button class="btn waves-effect waves-light teal view-product">
                        View Details
                    </button>
                </div>
            </div>
        `;
        
        return col;
    }
    
    /**
     * Display error message
     */
    function displayErrorMessage(message) {
        const productList = document.getElementById('product-list');
        productList.innerHTML = `
            <div class="col s12">
                <div class="card-panel red lighten-4">
                    <p class="center-align red-text text-darken-4">${message}</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Category filter clicks
        document.querySelectorAll('[data-category]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all category links
                document.querySelectorAll('[data-category]').forEach(el => {
                    el.classList.remove('active');
                });
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Update current category
                state.currentCategory = this.getAttribute('data-category');
                
                // Display filtered products
                displayProducts(state.products);
                
                // Close mobile sidenav if open
                const sidenav = M.Sidenav.getInstance(document.querySelector('.sidenav'));
                if (sidenav && sidenav.isOpen) {
                    sidenav.close();
                }
            });
        });
        
        // Product view button clicks
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('view-product') || 
                e.target.closest('.view-product')) {
                const card = e.target.closest('.product-card');
                const productId = parseInt(card.getAttribute('data-id'));
                openProductDetails(productId);
            }
        });
        
        // Add to cart button clicks
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('add-to-cart') || 
                e.target.closest('.add-to-cart')) {
                const productId = parseInt(document.querySelector('#product-modal').getAttribute('data-id'));
                const quantity = parseInt(document.querySelector('#product-quantity').value);
                addToCart(productId, quantity);
                
                // Show confirmation and close modal
                M.toast({html: 'Product added to cart!', classes: 'rounded teal'});
                const modal = M.Modal.getInstance(document.querySelector('#product-modal'));
                modal.close();
            }
        });
    }
    
    /**
     * Open product details modal
     */
    function openProductDetails(productId) {
        const product = state.products.find(p => p.id === productId);
        
        if (!product) return;
        
        const modal = document.querySelector('#product-modal');
        modal.setAttribute('data-id', product.id);
        
        document.querySelector('#modal-product-image').src = product.image;
        document.querySelector('#modal-product-title').textContent = product.title;
        document.querySelector('#modal-product-category').textContent = product.category;
        document.querySelector('#modal-product-price').textContent = `$${product.price.toFixed(2)}`;
        document.querySelector('#modal-product-description').textContent = product.description;
        
        // Reset quantity selector
        document.querySelector('#product-quantity').value = "1";
        M.FormSelect.init(document.querySelector('#product-quantity'));
        
        // Open modal
        const modalInstance = M.Modal.getInstance(modal);
        modalInstance.open();
    }
    
    /**
     * Add product to cart
     */
    function addToCart(productId, quantity) {
        const product = state.products.find(p => p.id === productId);
        
        if (!product) return;
        
        // Check if product already in cart
        const existingItem = state.cart.find(item => item.id === productId);
        
        if (existingItem) {
            // Update quantity
            existingItem.quantity += quantity;
        } else {
            // Add new item
            state.cart.push({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        // Save cart to localStorage
        saveCart();
        
        // Update cart badge
        updateCartBadge();
    }
    
    /**
     * Update cart count badge
     */
    function updateCartBadge() {
        const cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);
        
        // Add cart badge if doesn't exist
        const cartLinks = document.querySelectorAll('nav li a i.material-icons');
        cartLinks.forEach(icon => {
            if (icon.textContent === 'shopping_cart') {
                const li = icon.closest('li');
                if (!li.classList.contains('cart-badge')) {
                    li.classList.add('cart-badge');
                    
                    // Add badge element if it doesn't exist
                    if (!li.querySelector('.badge')) {
                        const badge = document.createElement('span');
                        badge.className = 'badge';
                        li.appendChild(badge);
                    }
                }
                
                // Update badge count
                const badge = li.querySelector('.badge');
                if (cartCount > 0) {
                    badge.textContent = cartCount;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        });
    }
    
    /**
     * Save cart to localStorage
     */
    function saveCart() {
        localStorage.setItem('shopEaseCart', JSON.stringify(state.cart));
    }
    
    /**
     * Load cart from localStorage
     */
    function loadCart() {
        const savedCart = localStorage.getItem('shopEaseCart');
        if (savedCart) {
            state.cart = JSON.parse(savedCart);
            updateCartBadge();
        }
    }
});

// Add additional functionality for a cart page if needed 