/* ===== Diwali Crackers — storefront =====
   Prices: PRODUCTS[].price = customer price, PRODUCTS[].mrp = strike-through MRP.
   Photos: PRODUCTS[].img = file name inside images/ (e.g. os1 → images/os1.png).
   Category tiles show an emoji; item cards show the photo. */
const CART_KEY = 'dc_cart_v1';
const USER_KEY = 'dc_user_v1';
const ORD_KEY  = 'dc_orders_v1';
const HOME_PHONE = '919494496894';
const MIN_ORDER = 2499;   // ₪ minimum order value

const CAT_EMOJI = {
  'One Sound Crackers':'💥','Sparklers':'✨','Electric Crackers':'⚡','Bijili Crackers':'🧨',
  'Twinkling Star':'🌟','Bomb Crackers':'💣','Paper Bomb':'📜','Ground Chakkar':'🌀',
  'Flower Pots':'🪔','Rocket':'🚀','Single Fancy':'🎇','Nayagara Fancy':'🎆',
  '5 inch Single Pipe Special Edition':'🎯','Multi Colour Shots':'🌈','Fancy Crackers':'🎊',
  'Fancy Fountains':'⛲','New Arrivals':'🆕','Shower Special Edition':'🌊','CC Crackers':'🧰'
};
const emoji = c => CAT_EMOJI[c] || '🎆';
const money = n => '₹' + Number(n).toLocaleString('en-IN');

/* ---------- state ---------- */
let cart = load(CART_KEY, {});

/* drop any cart id that no longer exists in the catalogue (stale localStorage) */
function pruneCart(){
  let changed = false;
  Object.keys(cart).forEach(function(id){
    if (!PRODUCTS.some(function(p){ return String(p.id) === String(id); })) {
      delete cart[id]; changed = true;
    }
  });
  if (changed) save(CART_KEY, cart);
}
let user = load(USER_KEY, null);
let orders = load(ORD_KEY, []);
let openCat = null;
let query = '';

function load(k, d){ try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch(e){ return d; } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

/* ---------- helpers ---------- */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function toast(msg){
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

function cartCount(){ return Object.values(cart).reduce((a,b) => a + b, 0); }
function cartTotal(){ return Object.entries(cart).reduce((a,[id,q]) => {
  const p = PRODUCTS.find(x => String(x.id) === String(id)); return a + (p ? p.price * q : 0);
}, 0); }
function cartMrpTotal(){ return Object.entries(cart).reduce((a,[id,q]) => {
  const p = PRODUCTS.find(x => String(x.id) === String(id)); return a + (p ? p.mrp * q : 0);
}, 0); }


/* ---------- WhatsApp helpers ---------- */
function waLink(text){
  return 'https://wa.me/' + HOME_PHONE + '?text=' + encodeURIComponent(text);
}

/* Order status → customer gets a WhatsApp message they can send back to us */
function orderMessage(order, status){
  /* the shop's inbox reads like a slip of paper, not a chat message */
  const head = {
    new:       'New order ' + order.id,
    packed:    'Order ' + order.id + ' is packed',
    delivered: 'Order ' + order.id + ' is delivered',
  }[status] || ('Order ' + order.id);

  const who = order.name + '  +91' + order.phone;
  const lines = order.items.map(function(i){
    return i.name + ' x' + i.qty + ' = ₹' + (i.price * i.qty);
  });

  return head + '\n' + who + '\n' + order.address + '\n\n' +
         lines.join('\n') + '\n\nTOTAL: ₹' + order.total;
}


/* ---------- promo carousel: the two family packs ---------- */
var promoIndex = 0, promoTimer = null;

function renderPromo(){
  var box = document.getElementById('promo');
  if (!box) return;
  var kits = kitProducts();
  if (kits.length < 1){ box.style.display = 'none'; return; }
  box.style.display = '';

  box.innerHTML = kits.map(function(k, i){
    var save = k.mrp > k.price ? Math.round((1 - k.price / k.mrp) * 100) : 0;
    return '<div class="promo-slide' + (i === promoIndex ? ' on' : '') + '">' +
      '<div class="promo-art">' +
        (k.img ? '<img src="images/' + k.img + '.png" alt="">' : '<span>\uD83C\uDF81</span>') +
      '</div>' +
      '<div class="promo-info">' +
        '<span class="promo-tag">Family Pack</span>' +
        '<h4>' + k.name + '</h4>' +
        '<p>' + (k.kitCount || '') + ' item types \u00b7 ' + (k.kitPieces || '') + ' pieces in one box</p>' +
        '<div class="promo-price"><b>' + money(k.price) + '</b>' +
          (save ? '<s>' + money(k.mrp) + '</s><span class="save-tag">Save ' + save + '%</span>' : '') +
        '</div>' +
        '<button class="btn gold promo-btn" data-view="' + k.id + '">See what\u2019s inside \u2192</button>' +
      '</div>' +
    '</div>';
  }).join('') +
  '<div class="promo-dots">' + kits.map(function(k, i){
    return '<span class="' + (i === promoIndex ? 'on' : '') + '" data-dot="' + i + '"></span>';
  }).join('') + '</div>';

  box.querySelectorAll('[data-view]').forEach(function(b){
    b.onclick = function(){ showKit(b.getAttribute('data-view')); };
  });
  box.querySelectorAll('[data-dot]').forEach(function(d){
    d.onclick = function(){ promoIndex = Number(d.getAttribute('data-dot')); renderPromo(); };
  });
}

function startPromo(){
  clearInterval(promoTimer);
  promoTimer = setInterval(function(){
    if (kitProducts().length < 2) return;
    promoIndex = (promoIndex + 1) % kitProducts().length;
    renderPromo();
  }, 5000);
}

/* ---------- what is inside a kit ---------- */
function showKit(id){
  var k = PRODUCTS.find(function(x){ return String(x.id) === String(id); });
  if (!k) return;
  var key = k.kit === 'k3499' ? 'k3499' : 'k2499';
  var list = kitItems(key);
  var pieces = list.reduce(function(a, x){ return a + x.qty; }, 0);

  document.getElementById('kitName').textContent = k.name;
  document.getElementById('kitMeta').textContent =
    list.length + ' item types \u00b7 ' + pieces + ' pieces \u00b7 ' + money(k.price);
  document.getElementById('kitList').innerHTML = list.map(function(it){
    return '<div class="citem">' +
      '<div class="ci-em">' + (it.img ? '<img src="images/' + it.img + '.png" alt="">' : '\uD83C\uDF06') + '</div>' +
      '<div><div class="ci-n">' + it.name + '</div>' +
      '<div class="ci-p">' + money(it.price) + ' each</div></div>' +
      '<div class="ci-t"><b>\u00d7' + it.qty + '</b></div>' +
    '</div>';
  }).join('');
  document.getElementById('kitAdd').onclick = function(){
    addToCart(k.id); closeModal('#kitModal');
  };
  openModal('#kitModal');
}


/* ---------- visuals ---------- */
function photoOrEmoji(p){
  if (p.img) return '<div class="pc-photo"><img src="images/' + p.img + '.png" alt=""></div>';
  return '<div class="pc-em">' + emoji(p.cat) + '</div>';
}

/* ---------- catalogue ---------- */
const PROMO_CAT = 'Diwali Kits';

function categories(){
  const map = new Map();
  PRODUCTS.forEach(p => map.set(p.cat, (map.get(p.cat) || 0) + 1));
  return [...map.entries()]
    .filter(function(e){ return e[0] !== PROMO_CAT; })
    .map(function(e){ return { name: e[0], count: e[1] }; });
}

/* the two family packs, for the promo banner */
function kitProducts(){
  return PRODUCTS.filter(function(p){ return p.cat === PROMO_CAT; });
}

/* what sits inside one kit, from the k2499 / k3499 flags */
function kitItems(key){
  return PRODUCTS
    .filter(function(p){ return p[key] > 0; })
    .map(function(p){ return { name: p.name, qty: p[key], price: p.price, img: p.img }; });
}

/* level 1 — category tiles (emoji, no photos) */
function renderCategories(){
  const grid = $('#grid');
  if (!grid) return;
  grid.className = 'cat-grid';

  const tiles = categories().map(function(c){
    return '<button class="cat-tile" data-cat="' + c.name + '">' +
      '<div class="ct-em">' + emoji(c.name) + '</div>' +
      '<div class="ct-name">' + c.name + '</div>' +
      '<div class="ct-count">' + c.count + ' item' + (c.count > 1 ? 's' : '') + '</div>' +
      '<div class="ct-go">View items →</div>' +
    '</button>';
  }).join('');

  grid.innerHTML = tiles;
  grid.querySelectorAll('[data-cat]').forEach(function(b){
    b.onclick = function(){ showCategory(b.getAttribute('data-cat')); };
  });
}

/* level 2 — the items inside one category, or search results */
function productsFor(){
  const q = query.trim().toLowerCase();
  if (q) return PRODUCTS.filter(function(p){
    return p.name.toLowerCase().indexOf(q) > -1 || p.cat.toLowerCase().indexOf(q) > -1;
  });
  return openCat ? PRODUCTS.filter(function(p){ return p.cat === openCat; }) : [];
}

function renderProducts(){
  const grid = $('#grid');
  if (!grid) return;
  const list = productsFor();
  grid.className = 'grid';

  if (!list.length){
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><span class="em">🔍</span>No items found. Try another search.</div>';
    return;
  }

  grid.innerHTML = list.map(function(p){
    const q = cart[p.id] || 0;
    const save = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
    const action = q
      ? '<div class="stepper">' +
          '<button data-dec="' + p.id + '">−</button>' +
          '<span>' + q + '</span>' +
          '<button data-inc="' + p.id + '">+</button>' +
        '</div>'
      : '<button class="add" data-add="' + p.id + '">Add to Cart</button>';

    return '<article class="pcard">' +
      photoOrEmoji(p) +
      '<div class="pc-body">' +
        '<div class="pc-cat">' + p.cat + '</div>' +
        '<div class="pc-name">' + p.name + '</div>' +
        '<div class="pc-meta">' + p.pack + ' · Code ' + p.id + '</div>' +
      '</div>' +
      '<div class="pc-price">' +
        '<b>' + money(p.price) + '</b>' +
        (save ? '<s>' + money(p.mrp) + '</s><span class="save-tag">Save ' + save + '%</span>' : '') +
      '</div>' +
      action +
    '</article>';
  }).join('');

  grid.querySelectorAll('[data-add]').forEach(function(b){
    b.onclick = function(){ addToCart(b.getAttribute('data-add')); };
  });
  grid.querySelectorAll('[data-inc]').forEach(function(b){
    b.onclick = function(){ bump(b.getAttribute('data-inc'), 1); };
  });
  grid.querySelectorAll('[data-dec]').forEach(function(b){
    b.onclick = function(){ bump(b.getAttribute('data-dec'), -1); };
  });
}

/* single entry point */
function renderShop(){
  const searching = query.trim().length > 0;
  const bar = $('#backbar');

  if (searching){
    if (bar){
      bar.style.display = 'flex';
      $('#crumb').innerHTML = 'Search results for "<b>' + query.trim() + '</b>"';
    }
    $('#gridTitle').textContent = 'Search Results';
    const n = productsFor().length;
    $('#catCount').textContent = n + (n === 1 ? ' item' : ' items');
    renderProducts();
    return;
  }

  if (openCat){
    if (bar){
      bar.style.display = 'flex';
      $('#crumb').innerHTML = 'Browsing: <b>' + openCat + '</b>';
    }
    $('#gridTitle').textContent = openCat;
    const n = productsFor().length;
    $('#catCount').textContent = n + (n === 1 ? ' item' : ' items');
    renderProducts();
  } else {
    if (bar) bar.style.display = 'none';
    $('#gridTitle').textContent = 'Shop by Category';
    $('#catCount').textContent = categories().length + ' categories · ' + PRODUCTS.length + ' items';
    renderCategories();
  }
}

function showCategory(name){
  openCat = name;
  const shop = $('#shop');
  if (shop) shop.scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderShop();
}

function goBack(){
  openCat = null;
  query = '';
  const si = $('#searchInput');
  if (si) si.value = '';
  renderShop();
  const shop = $('#shop');
  if (shop) shop.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- cart ---------- */
function addToCart(id){
  cart[id] = (cart[id] || 0) + 1;
  save(CART_KEY, cart);
  renderShop(); renderCart();
  const p = PRODUCTS.find(function(x){ return String(x.id) === String(id); });
  toast('Added: ' + (p ? p.name : 'item'));
}

function bump(id, delta){
  const q = (cart[id] || 0) + delta;
  if (q <= 0) delete cart[id]; else cart[id] = q;
  save(CART_KEY, cart);
  renderShop(); renderCart();
  if (delta > 0) pulseCart();
  if (!cart[id]) toast('Removed from cart');
}

function pulseCart(){
  const c = $('.hbtn.cart');
  if (!c) return;
  c.style.transform = 'scale(1.09)';
  setTimeout(function(){ c.style.transform = ''; }, 180);
}

function renderCart(){
  $('#cartCount').textContent = cartCount();
  const body = $('#drBody');
  const ids = Object.keys(cart);

  if (!ids.length){
    body.innerHTML = '<div class="empty"><span class="em">🛒</span>Your cart is empty.<br>Add some crackers to get started!</div>';
    $('#drFoot').style.display = 'none';
    return;
  }
  $('#drFoot').style.display = '';

  body.innerHTML = ids.map(function(id){
    const p = PRODUCTS.find(function(x){ return String(x.id) === String(id); });
    if (!p) return '';
    const q = cart[id];
    return '<div class="citem">' +
      '<div class="ci-em">' + emoji(p.cat) + '</div>' +
      '<div><div class="ci-n">' + p.name + '</div><div class="ci-p">' + money(p.price) + ' · ' + p.pack + '</div>' +
        '<div class="qty"><button data-dec="' + id + '">−</button><span>' + q + '</span>' +
        '<button data-inc="' + id + '">+</button></div></div>' +
      '<div class="ci-t"><b>' + money(p.price * q) + '</b><br><span class="rm" data-rm="' + id + '">Remove</span></div>' +
    '</div>';
  }).join('');

  body.querySelectorAll('[data-inc]').forEach(function(b){
    b.onclick = function(){
      cart[b.getAttribute('data-inc')]++;
      save(CART_KEY, cart); renderCart(); renderShop();
    };
  });
  body.querySelectorAll('[data-dec]').forEach(function(b){
    b.onclick = function(){
      const id = b.getAttribute('data-dec');
      cart[id]--; if (cart[id] <= 0) delete cart[id];
      save(CART_KEY, cart); renderCart(); renderShop();
    };
  });
  body.querySelectorAll('[data-rm]').forEach(function(b){
    b.onclick = function(){
      delete cart[b.getAttribute('data-rm')];
      save(CART_KEY, cart); renderCart(); renderShop();
      toast('Item removed');
    };
  });

  const sub = cartTotal();
  $('#drTotal').textContent = money(sub);
  const saved = cartMrpTotal() - sub;
  $('#drSaved').textContent = saved > 1 ? 'You save ' + money(Math.round(saved)) + ' on this order' : '';

  /* minimum order value */
  const left = MIN_ORDER - sub;
  const noteEl = $('#drMinNote');
  const goBtn  = $('#checkout');
  if (noteEl && goBtn){
    if (left > 0){
      noteEl.innerHTML = 'Minimum order is ' + money(MIN_ORDER) + ' — add <b>' + money(Math.ceil(left)) + '</b> more to checkout';
      noteEl.className = 'min-note short';
      goBtn.classList.add('blocked');
      goBtn.textContent = 'Add ' + money(Math.ceil(left)) + ' more to checkout';
    } else {
      noteEl.innerHTML = '✓ Minimum order reached — you can checkout now';
      noteEl.className = 'min-note ok';
      goBtn.classList.remove('blocked');
      goBtn.textContent = 'Proceed to Checkout →';
    }
  }
}

function openCart(){ $('#drawer').classList.add('open'); $('#scrim').classList.add('open'); }
function closeCart(){ $('#drawer').classList.remove('open'); $('#scrim').classList.remove('open'); }

/* ---------- modals ---------- */
function openModal(id){ $(id).classList.add('open'); }
function closeModal(id){ $(id).classList.remove('open'); }

/* ---------- login (name + mobile, no OTP) ---------- */
function renderUser(){
  const el = $('#userChip');
  if (!el) return;
  el.textContent = user ? '👤 ' + user.name.split(' ')[0] : '👤 Login';
}

function startLogin(){
  if (user) return showAccount();
  $('#loginName').value = '';
  $('#loginPhone').value = '';
  openModal('#loginModal');
}

function bindLogin(){
  const doLogin = $('#doLogin');
  const nameEl  = $('#loginName');
  const phoneEl = $('#loginPhone');

  if (doLogin && nameEl && phoneEl){
    doLogin.onclick = function(){
      const name = nameEl.value.trim();
      const phone = phoneEl.value.replace(/[^0-9]/g, '');
      if (name.length < 2) return toast('Please enter your name');
      if (phone.length !== 10) return toast('Enter a valid 10-digit mobile number');
      user = { name: name, phone: phone, since: new Date().toISOString() };
      save(USER_KEY, user);
      closeModal('#loginModal');
      renderUser();
      toast('Welcome, ' + name.split(' ')[0] + '! 🎇');
    };
    phoneEl.onkeydown = function(e){ if (e.key === 'Enter') doLogin.click(); };
  }

  const out = $('#logout');
  if (out) out.onclick = function(){
    user = null; localStorage.removeItem(USER_KEY);
    closeModal('#acctModal'); renderUser(); toast('Logged out');
  };
}

function statusLabel(s){
  return s === 'new' ? 'New' : s === 'packed' ? 'Packed' : s === 'delivered' ? 'Delivered' : s;
}

function showAccount(){
  $('#acctName').textContent = user.name;
  $('#acctPhone').textContent = '+91 ' + user.phone;
  const mine = orders.filter(function(o){ return o.phone === user.phone; });

  if (!mine.length){
    $('#acctOrders').innerHTML = '<div class="empty"><span class="em">📦</span>No orders yet.</div>';
  } else {
    $('#acctOrders').innerHTML = mine.slice().reverse().map(function(o){
      return '<div class="citem"><div class="ci-em">🧾</div><div>' +
        '<div class="ci-n">Order #' + o.id + '</div>' +
        '<div class="ci-p">' + o.items.length + ' items · ' + money(o.total) + '</div>' +
        '<div class="ci-p">' + new Date(o.at).toLocaleString('en-IN') + '</div></div>' +
        '<div class="ci-t"><span class="tag ' + o.status + '">' + statusLabel(o.status) + '</span></div>' +
        '<div style="margin-top:8px"><a class="hint" style="color:var(--red);font-weight:700" href="' +
          waLink(orderMessage(o, o.status)) + '" target="_blank" rel="noopener">💬 Message us</a></div>' +
        '</div>';
    }).join('');
  }
  openModal('#acctModal');
}

/* ---------- checkout ---------- */
function openCheckout(){
  $('#coName').value = user.name || '';
  $('#coPhone').value = user.phone || '';
  $('#coLines').innerHTML = Object.entries(cart).map(function(pair){
    const id = pair[0], q = pair[1];
    const p = PRODUCTS.find(function(x){ return String(x.id) === String(id); });
    if (!p) return '';
    return '<div class="tot"><span>' + p.name + ' × ' + q + '</span><b style="font-size:15px">' + money(p.price * q) + '</b></div>';
  }).join('');
  $('#coTotal').textContent = money(cartTotal());
  openModal('#checkoutModal');
}

function bindCheckout(){
  $('#checkout').onclick = function(){
    if (!cartCount()) return toast('Your cart is empty');
    if (cartTotal() < MIN_ORDER){
      return toast('Minimum order is ' + money(MIN_ORDER) + '. Please add more items.');
    }
    closeCart();
    if (!user) return startLogin();
    openCheckout();
  };

  $('#placeOrder').onclick = function(){
    if (cartTotal() < MIN_ORDER){
      closeModal('#checkoutModal');
      return toast('Minimum order is ' + money(MIN_ORDER) + '. Please add more items.');
    }
    const name = $('#coName').value.trim();
    const phone = $('#coPhone').value.replace(/[^0-9]/g, '');
    const addr = $('#coAddr').value.trim();
    const area = $('#coArea').value.trim();
    if (name.length < 2) return toast('Please enter your name');
    if (phone.length !== 10) return toast('Enter a valid mobile number');
    if (addr.length < 6) return toast('Please enter your full address');

    const order = {
      id: 'DC' + Date.now().toString().slice(-6),
      name: name, phone: phone,
      address: addr + (area ? ', ' + area : ''),
      items: Object.entries(cart).map(function(pair){
        const id = pair[0], q = pair[1];
        const p = PRODUCTS.find(function(x){ return String(x.id) === String(id); });
        if (!p) return null;
        return { id: id, name: p.name, qty: q, price: p.price };
      }).filter(Boolean),
      total: cartTotal(),
      status: 'new',
      at: new Date().toISOString()
    };
    orders.push(order); save(ORD_KEY, orders);

    /* send the order straight to the shop's WhatsApp */
    window.open(waLink(orderMessage(order, 'new')), '_blank');

    cart = {}; save(CART_KEY, cart);
    renderCart(); renderShop();
    closeModal('#checkoutModal');
    $('#okOrderId').textContent = '#' + order.id;
    openModal('#okModal');
  };
}

/* ---------- wiring ---------- */
function boot(){
  pruneCart();
  renderShop(); renderCart(); renderUser(); renderPromo(); startPromo();
  bindLogin(); bindCheckout();

  $('#menuBtn').onclick = function(){ $('#links').classList.toggle('open'); };
  $('#openCart').onclick = openCart;
  $('#closeCart').onclick = closeCart;
  $('#scrim').onclick = closeCart;
  $('#userChip').onclick = function(){ if (user) showAccount(); else startLogin(); };
  document.querySelectorAll('#backBtn, .backbtn').forEach(function(b){
    b.onclick = function(e){ e.preventDefault(); goBack(); };
  });

  $$('.close-modal').forEach(function(b){
    b.onclick = function(e){
      e.preventDefault();
      closeModal('#' + b.closest('.modal').id);
    };
  });
  $$('.modal').forEach(function(m){
    m.onclick = function(e){ if (e.target === m) m.classList.remove('open'); };
  });

  $('#searchInput').oninput = function(e){
    query = e.target.value;
    if (query.trim()) openCat = null;
    renderShop();
  };
  $('#heroWa').onclick = function(){
    window.open(waLink('Hi, I want crackers'), '_blank');
  };
  const fw = $('#floatWa');
  if (fw) fw.onclick = function(){ window.open(waLink('Hi, I want crackers'), '_blank'); };

  const up = $('#toTop');
  if (up){
    window.addEventListener('scroll', function(){ up.classList.toggle('show', window.scrollY > 500); });
    up.onclick = function(){ window.scrollTo({ top: 0, behavior: 'smooth' }); };
  }

  $('#closeOk').onclick = function(){ closeModal('#okModal'); };
}

document.addEventListener('DOMContentLoaded', boot);
