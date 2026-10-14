// Configuração
const TELEFONE_RESTAURANTE = "5511999999999";
const TAXA_ENTREGA = 5.00;

const products = [
  { id: 1, name: "Rapid Burger Double", category: "hamburgueres", price: 28.90, desc: "2 hambúrgueres 150g, cheddar e molho especial.", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500" },
  { id: 2, name: "Chicken Crispy", category: "hamburgueres", price: 24.50, desc: "Frango empanado crocante e maionese temperada.", img: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=500" },
  { id: 3, name: "Pizza Pepperoni Supreme", category: "pizzas", price: 45.00, desc: "Bastante muçarela e pepperoni fatiado.", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500" },
  { id: 4, name: "Pizza Quatro Queijos", category: "pizzas", price: 42.00, desc: "Muçarela, provolone, parmesão e gorgonzola.", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500" },
  { id: 5, name: "Coca-Cola 2L", category: "bebidas", price: 12.00, desc: "Garrafa de 2 Litros trincando de gelada.", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500" },
  { id: 6, name: "Suco Natural de Laranja", category: "bebidas", price: 8.50, desc: "500ml de puro suco de laranja natural.", img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500" },
  { id: 7, name: "Brownie com Sorvete", category: "sobremesas", price: 16.00, desc: "Brownie quente com sorvete de baunilha.", img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500" }
];

let cart = [];
let activeCategory = 'todos';
let discount = 0;
let deferredPrompt = null;

// Selectors
const productsGrid = document.getElementById('productsGrid');
const searchInput = document.getElementById('searchInput');
const categoriesContainer = document.getElementById('categoriesContainer');
const themeToggle = document.getElementById('themeToggle');
const installPwaBtn = document.getElementById('installPwaBtn');

// Cart Selectors
const bottomCartCount = document.getElementById('bottomCartCount');
const bottomCartTotal = document.getElementById('bottomCartTotal');
const cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsContainer = document.getElementById('cartItemsContainer');

// Checkout Selectors
const subtotalVal = document.getElementById('subtotalVal');
const deliveryVal = document.getElementById('deliveryVal');
const discountRow = document.getElementById('discountRow');
const discountVal = document.getElementById('discountVal');
const totalVal = document.getElementById('totalVal');
const trackerText = document.getElementById('trackerText');
const trackerFill = document.getElementById('trackerFill');
const applyCouponBtn = document.getElementById('applyCouponBtn');
const couponInput = document.getElementById('couponInput');
const sendOrderBtn = document.getElementById('sendOrderBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupEvents();
  registerServiceWorker();
});

function renderProducts() {
  const query = searchInput.value.toLowerCase();
  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'todos' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(query) || p.desc.toLowerCase().includes(query);
    return matchCat && matchSearch;
  });

  productsGrid.innerHTML = filtered.map(p => `
    <div class="product-card">
      <img src="${p.img}" class="product-img" alt="${p.name}">
      <div class="product-details">
        <h3>${p.name}</h3>
        <p>${p.desc}</p>
        <div class="product-bottom">
          <span class="price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
          <button class="btn-add-item" onclick="addToCart(${p.id})"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

window.addToCart = function(id) {
  const item = cart.find(i => i.id === id);
  if (item) item.qty++;
  else cart.push({ ...products.find(p => p.id === id), qty: 1 });
  
  showToast("Item adicionado ao carrinho!");
  updateCart();
};

window.changeQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  updateCart();
};

function updateCart() {
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  // Free Shipping Calculation
  const freeShippingThreshold = 50.00;
  const currentDelivery = (subtotal >= freeShippingThreshold || cart.length === 0) ? 0 : TAXA_ENTREGA;
  const finalTotal = Math.max(0, subtotal + currentDelivery - discount);

  bottomCartCount.textContent = totalItems;
  bottomCartTotal.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;

  // Update Free Shipping Tracker
  if (subtotal >= freeShippingThreshold) {
    trackerText.textContent = "Parabéns! Você ganhou Frete Grátis 🎉";
    trackerFill.style.width = "100%";
  } else {
    const remaining = freeShippingThreshold - subtotal;
    trackerText.textContent = `Faltam R$ ${remaining.toFixed(2).replace('.', ',')} para Frete Grátis!`;
    trackerFill.style.width = `${(subtotal / freeShippingThreshold) * 100}%`;
  }

  // Render Drawer Items
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `<p style="text-align:center; color: var(--text-muted);">Carrinho vazio.</p>`;
  } else {
    cartItemsContainer.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div>
          <strong>${i.name}</strong><br>
          <small>R$ ${i.price.toFixed(2).replace('.', ',')}</small>
        </div>
        <div class="cart-item-ctrls">
          <button onclick="changeQty(${i.id}, -1)">-</button>
          <span>${i.qty}</span>
          <button onclick="changeQty(${i.id}, 1)">+</button>
        </div>
      </div>
    `).join('');
  }

  subtotalVal.textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
  deliveryVal.textContent = currentDelivery === 0 ? "GRÁTIS" : `R$ ${currentDelivery.toFixed(2).replace('.', ',')}`;
  
  if (discount > 0) {
    discountRow.style.display = "flex";
    discountVal.textContent = `-R$ ${discount.toFixed(2).replace('.', ',')}`;
  } else {
    discountRow.style.display = "none";
  }

  totalVal.textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
}

function setupEvents() {
  searchInput.addEventListener('input', renderProducts);

  categoriesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.cat-pill');
    if (!btn) return;
    document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    renderProducts();
  });

  openCartBtn.addEventListener('click', () => cartDrawerOverlay.classList.add('active'));
  closeCartBtn.addEventListener('click', () => cartDrawerOverlay.classList.remove('active'));

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
    themeToggle.querySelector('i').className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  });

  applyCouponBtn.addEventListener('click', () => {
    if (couponInput.value.trim().toUpperCase() === 'RAPID10') {
      discount = 10.00;
      showToast("Cupom de R$ 10 aplicado!");
    } else {
      discount = 0;
      showToast("Cupom inválido!");
    }
    updateCart();
  });

  sendOrderBtn.addEventListener('click', () => {
    if (cart.length === 0) return alert('Seu carrinho está vazio!');
    const name = document.getElementById('clientName').value.trim();
    const address = document.getElementById('clientAddress').value.trim();
    const payment = document.getElementById('paymentMethod').value;

    if (!name || !address) return alert('Preencha seu nome e endereço.');

    let msg = `*NOVO PEDIDO - RAPID EATS*

`;
    msg += `*Cliente:* ${name}
*Endereço:* ${address}
*Pagamento:* ${payment}

*Itens:*
`;
    
    cart.forEach(i => {
      msg += `- ${i.qty}x ${i.name} (R$ ${(i.price * i.qty).toFixed(2)})
`;
    });

    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const delivery = subtotal >= 50 ? 0 : TAXA_ENTREGA;
    const total = Math.max(0, subtotal + delivery - discount);

    msg += `
*Subtotal:* R$ ${subtotal.toFixed(2)}`;
    msg += `
*Entrega:* ${delivery === 0 ? 'GRÁTIS' : 'R$ ' + delivery.toFixed(2)}`;
    if (discount > 0) msg += `
*Desconto:* -R$ ${discount.toFixed(2)}`;
    msg += `
*TOTAL:* R$ ${total.toFixed(2)}`;

    window.open(`https://wa.me/${TELEFONE_RESTAURANTE}?text=${encodeURIComponent(msg)}`, '_blank');
  });

  // PWA Install Prompt Handler
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installPwaBtn.style.display = 'flex';
  });

  installPwaBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') deferredPrompt = null;
    }
  });
}

function showToast(msg) {
  const toast = document.getElementById('toastNotification');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 2500);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg error:', err));
  }
}