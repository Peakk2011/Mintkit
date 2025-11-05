# MintAssembly DSL Template Engine

MintAssembly is HTML/JS template engine with modern DSL supported

## Supported Featured

### 1. Template & Props
```html
<template name="ProductCard">
  <props>
    <prop name="product" type="object" required />
    <prop name="showActions" type="boolean" default="true" />
  </props>
  <!-- ... -->
</template>
```

### 2. Interpolation & Filter/Pipe
```html
<h3>${product.name}</h3>
<price>${product.price | currency}</price>
<description>${product.description | truncate(100)}</description>
```

### 3. Event Binding
```html
<button @click="addToCart(product)">Add to Cart</button>
```

### 4. Dynamic Attribute Binding
```html
<button :disabled="product.stock === 0" :class="{ active: isInWishlist(product.id) }">
```

### 5. Conditional Rendering
```html
<if condition="product.discount > 0">
  <badge class="discount">-${product.discount}%</badge>
</if>
<else>
  <span>No discount</span>
</else>
```

### 6. Loop Rendering
```html
<for item="tag" in="product.tags">
  <tag>${tag}</tag>
</for>
```

### 7. Context-aware Function Call
```html
<button @click="addToCart(product)">Add to Cart</button>
<span :class="{ active: isInWishlist(product.id) }">♡</span>
```

### 8. JS implementation
```js
const mint = MintAssembly({
  context: {
    addToCart: (product) => alert('Add: ' + product.name),
    toggleWishlist: (product) => alert('Wishlist: ' + product.name),
    isInWishlist: (id) => id === 1,
    product: { name: 'MintKit', price: 100, stock: 5, tags: ['js', 'ui'], image: '...', discount: 10, description: '...', id: 1 }
  },
  filters: {
    currency: v => '$' + v,
    truncate: (v, n) => v.length > n ? v.slice(0, n) + '...' : v
  }
});
mint.mount('template[name=ProductCard]', { showActions: true });
```

## Full Example
```html
<template name="ProductCard">
  <card class="product-card">
    <h3>${product.name}</h3>
    <price>${product.price | currency}</price>
    <if condition="product.discount > 0">
      <badge class="discount">-${product.discount}%</badge>
    </if>
    <description>${product.description | truncate(100)}</description>
    <tags>
      <for item="tag" in="product.tags">
        <tag>${tag}</tag>
      </for>
    </tags>
    <button
      @click="addToCart(product)"
      :disabled="product.stock === 0"
      class="btn-primary"
    >
      <if condition="product.stock > 0">
        Add to Cart
      <else>
        Out of Stock
      </if>
    </button>
    <button
      @click="toggleWishlist(product)"
      class="btn-secondary"
      :class="{ active: isInWishlist(product.id) }"
    >
      ♡
    </button>
  </card>
</template>
<div id="mount-point"></div>
```

```js
const mint = MintAssembly({
  context: {
    addToCart: (product) => alert('Add: ' + product.name),
    toggleWishlist: (product) => alert('Wishlist: ' + product.name),
    isInWishlist: (id) => id === 1,
    product: { name: 'MintKit', price: 100, stock: 5, tags: ['js', 'ui'], image: '...', discount: 10, description: '...', id: 1 }
  },
  filters: {
    currency: v => '$' + v,
    truncate: (v, n) => v.length > n ? v.slice(0, n) + '...' : v
  }
});
mint.mount('template[name=ProductCard]', { showActions: true });
```

---

## Note
- Using pure with Mintkit imported HTML/CSS/JS
- Custom filter/context/template
- Suggess for rapid prototyping, static web, custom web framework 