document.addEventListener('DOMContentLoaded', function() {
    // Initialize Materialize components
    const sidenavs = document.querySelectorAll('.sidenav');
    M.Sidenav.init(sidenavs);
    
    // State management
    const state = {
        cart: [],
        shipping: 5.99
    };
    
    // Load cart from localStorage
    loadCart();
    
    // Set up event listeners
    setupEventListeners();
    
    /**
     * Load cart from localStorage
     */
    function loadCart() {
        const savedCart = localStorage.getItem('shopEaseCart');
        
        if (savedCart) {
            state.cart = JSON.parse(savedCart);
            displayCart();
            updateCartBadge();
        } else {
            displayEmptyCart();
        }
    }
    
    /**
     * Display cart items
     */
    function displayCart() {
        const cartContainer = document.getElementById('cart-container');
        
        // Clear loading indicator
        cartContainer.innerHTML = '';
        
        if (state.cart.length === 0) {
            displayEmptyCart();
            return;
        }
        
        // Create cart table
        const cartTable = document.createElement('div');
        cartTable.className = 'card';
        
        // Create table content
        let tableContent = `
            <table class="responsive-table highlight">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add cart items to table
        state.cart.forEach(item => {
            tableContent += `
                <tr data-id="${item.id}">
                    <td>
                        <div class="cart-item-info">
                            <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                            <span class="cart-item-title">${item.title}</span>
                        </div>
                    </td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>
                        <div class="quantity-control">
                            <button class="btn-small quantity-btn decrement waves-effect waves-light teal lighten-2">
                                <i class="material-icons">remove</i>
                            </button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="btn-small quantity-btn increment waves-effect waves-light teal lighten-2">
                                <i class="material-icons">add</i>
                            </button>
                        </div>
                    </td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                        <button class="btn-small remove-item waves-effect waves-light red lighten-2">
                            <i class="material-icons">delete</i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableContent += `
                </tbody>
            </table>
        `;
        
        cartTable.innerHTML = tableContent;
        cartContainer.appendChild(cartTable);
        
        // Show order summary
        document.getElementById('cart-actions').style.display = 'block';
        
        // Update order summary
        updateOrderSummary();
    }
    
    /**
     * Display empty cart message
     */
    function displayEmptyCart() {
        const cartContainer = document.getElementById('cart-container');
        cartContainer.innerHTML = `
            <div class="card-panel">
                <div class="center-align">
                    <i class="material-icons large">shopping_cart</i>
                    <h4>Your cart is empty</h4>
                    <p>Looks like you haven't added any items to your cart yet.</p>
                    <a href="index.html" class="btn waves-effect waves-light teal">
                        Start Shopping
                    </a>
                </div>
            </div>
        `;
        
        // Hide order summary
        document.getElementById('cart-actions').style.display = 'none';
    }
    
    /**
     * Update order summary
     */
    function updateOrderSummary() {
        // Calculate subtotal
        const subtotal = state.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
        
        // Calculate shipping (free over $50)
        const shipping = subtotal > 50 ? 0 : state.shipping;
        
        // Calculate tax (10%)
        const tax = subtotal * 0.1;
        
        // Calculate total
        const total = subtotal + shipping + tax;
        
        // Update DOM
        document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('shipping').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
        document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('total').textContent = `$${total.toFixed(2)}`;
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
     * Set up event listeners
     */
    function setupEventListeners() {
        // Use event delegation for quantity buttons and remove buttons
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Handle increment button
            if (target.closest('.increment')) {
                const row = target.closest('tr');
                const productId = parseInt(row.getAttribute('data-id'));
                updateItemQuantity(productId, 1);
            }
            
            // Handle decrement button
            if (target.closest('.decrement')) {
                const row = target.closest('tr');
                const productId = parseInt(row.getAttribute('data-id'));
                updateItemQuantity(productId, -1);
            }
            
            // Handle remove button
            if (target.closest('.remove-item')) {
                const row = target.closest('tr');
                const productId = parseInt(row.getAttribute('data-id'));
                removeItem(productId);
            }
            
            // Handle checkout button
            if (target.closest('.checkout-btn')) {
                checkout();
            }
        });
    }
    
    /**
     * Update item quantity
     */
    function updateItemQuantity(productId, change) {
        const item = state.cart.find(item => item.id === productId);
        
        if (!item) return;
        
        // Update quantity
        item.quantity += change;
        
        // Remove item if quantity is 0 or less
        if (item.quantity <= 0) {
            removeItem(productId);
            return;
        }
        
        // Save cart
        saveCart();
        
        // Update display
        displayCart();
        updateCartBadge();
    }
    
    /**
     * Remove item from cart
     */
    function removeItem(productId) {
        state.cart = state.cart.filter(item => item.id !== productId);
        
        // Save cart
        saveCart();
        
        // Update display
        if (state.cart.length === 0) {
            displayEmptyCart();
        } else {
            displayCart();
        }
        
        updateCartBadge();
        
        // Show toast notification
        M.toast({html: 'Item removed from cart', classes: 'rounded red lighten-2'});
    }
    
    /**
     * Checkout process
     */
    function checkout() {
        // In a real application, this would redirect to a checkout page or process
        // For this demo, we'll just show a toast and clear the cart
        M.toast({html: 'Checkout functionality would be implemented here!', classes: 'rounded teal'});
        
        alert('Thank you for your order! In a real application, you would be redirected to a payment gateway.');
        
        // Clear cart
        state.cart = [];
        saveCart();
        displayEmptyCart();
        updateCartBadge();
    }
    
    // Add custom styles for cart page
    addCustomStyles();
    
    /**
     * Add custom styles for cart page
     */
    function addCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .cart-item-image {
                width: 50px;
                height: 50px;
                object-fit: contain;
                margin-right: 10px;
                vertical-align: middle;
            }
            
            .cart-item-info {
                display: flex;
                align-items: center;
            }
            
            .cart-item-title {
                max-width: 250px;
                display: inline-block;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .quantity-control {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .quantity-value {
                margin: 0 10px;
                min-width: 20px;
                text-align: center;
            }
            
            .quantity-btn {
                padding: 0;
                width: 30px;
                height: 30px;
            }
            
            .quantity-btn i {
                line-height: 30px;
            }
            
            @media only screen and (max-width: 600px) {
                .cart-item-info {
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .cart-item-image {
                    margin-bottom: 5px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}); 