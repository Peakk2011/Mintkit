# MintAssembly Documentation

## Overview
MintAssembly is a lightweight JavaScript templating engine designed for dynamic DOM creation and management. It uses concepts similar to Vue.js and React but in a simpler and smaller package.

## Installation
```html
<script src="MintAssembly.js"></script>
```
## Initialization

```javascript
const app = MintAssembly({
    context: { /* your data and methods */ },
    filters: { /* custom filters */ },
    debug: true, // optional
    template: "<div>Your template</div>" // optional
});
```

## Template Syntax

### 1. Interpolation
```html
<p>Name: ${user.name}</p>
<p>Price: ${product.price | currency}</p>
```
### 2. Filters
Built-in filters:

- **currency:** 99.99 → $99.99
- **truncate:length:** Truncates text with ellipsis
- **uppercase:** hello → HELLO
- **lowercase:** HELLO → hello
- **capitalize:** hello → Hello
- **date:** Formats date
- **json:** Converts to JSON string
- **length:** Returns array or string length
- **reverse:** Reverses array or string
- **join:separator:** Joins array with separator
- **default:value:** Provides default value

Usage:

```html
<p>${text | truncate:50}</p>
<p>${price | currency}</p>
<p>${items | join:', '}</p>
<p>${undefinedValue | default:'No value'}</p>
```

Custom filters:

```javascript
app.addFilter('excite', val => val + '!!!');
```
### 3. Conditional Rendering
If/ElseIf/Else:

```html
<if condition="isLoggedIn">
    <p>Welcome user!</p>
</if>
<elseif condition="score >= 80">
    <p>Grade A</p>
</elseif>
<else>
    <p>Grade C</p>
</else>
```

Switch/Case/Default:

```html
<switch value="status">
    <case value="'active'">
        <p>Status: Active</p>
    </case>
    <case value="'inactive'">
        <p>Status: Inactive</p>
    </case>
    <default>
        <p>Status: Unknown</p>
    </default>
</switch>
```

Directives:

```html
<p v-if="isVisible">Shown when true</p>
<p v-show="isVisible">Shown/hidden based on condition</p>
```

4. Loops

```html
<for item="product" in="products">
    <div>
        <h3>${$index + 1}. ${product.name}</h3>
        <p>${$first ? 'First' : $last ? 'Last' : 'Middle'}</p>
    </div>
</for>
```

Loop variables:

- **$index:** Current index  
- **$first:** Boolean for first item
- **$last:** Boolean for last item
- **$odd:** Boolean for odd index
- **$even:** Boolean for even index

1. Event Handling
```html
<button @click="handleClick">Click me!</button>
<button @click="incrementCounter()">Increment</button>

<input type="text" :value="message" @input="updateMessage($event.target.value)">

<form @submit="submitForm($event)">
    <input type="text" :value="formData.name">
    <button type="submit">Submit</button>
</form>
```

6. Components

Register component:

```html
<template name="user-card">
    <div class="user-card">
        <h3>${name}</h3>
        <p>Email: ${email}</p>
        <p>Age: ${age}</p>
    </div>
</template>
```

Use component:

```html
<user-card name="John Doe" email="john@example.com" age="30"></user-card>
```

7. Duplicate Elements
Register duplicate element:

```html
<duplicate name="alert-box" source=".alert-template"></duplicate>
```

Use duplicate element:

```html
<use name="alert-box" type="success" message="Success!"></use>
<use name="alert-box" times="3" type="info" message="Info"></use>
```

8. Two-way Binding
```html
<input type="text" :value="username" @input="setData('username', $event.target.value)">
<p>Username: ${username}</p>

<select :value="selectedOption" @change="setData('selectedOption', $event.target.value)">
    <option value="opt1">Option 1</option>
    <option value="opt2">Option 2</option>
</select>
<p>Selected: ${selectedOption}</p>
```

## API Reference
MintAssembly (options)
Creates a new MintAssembly instance.

### Options:

- **context:** Object containing data and methods
- **filters:** Object with custom filters
- **debug:** Boolean to enable debug mode
- **template:** String template (alternative to DOM-based templates)

### Instance Methods: 

- **mount(selector):** Mounts to DOM element
- **render(props):** Returns rendered HTML string
- **setData(key, value):** Sets reactive data
- **getData(key):** Gets reactive data
- **registerComponent(name, template):** Registers a component
- **registerDuplicateElement(name, element):** Registers a duplicate element
- **createDuplicateElement(name, props):** Creates a duplicate element
- **compileTemplate(templateString):** Compiles template string
- **addFilter(name, fn):** Adds custom filter
 -**debug(enabled):** Enables/disables debug mode

## Example Application
```javascript
const app = MintAssembly({
    context: {
        // Data
        user: { name: "John Doe", age: 30 },
        products: [
            { name: "Product 1", price: 100 },
            { name: "Product 2", price: 200 }
        ],
        isLoggedIn: true,
        
        // Methods
        handleClick() {
            alert('Button clicked!');
        },
        updateMessage(value) {
            this.message = value;
        }
    },
    debug: true
});

app.mount("#app");
```

## Template Structure
```html
<body>
    <if condition="isLoggedIn">
        <for item="product" in="products">
            <div>
                <h3>${product.name}</h3>
                <p>${product.price | currency}</p>
                <button @click="addToCart(product)">Add to Cart</button>
            </div>
        </for>
    </if>
    <else>
        <p>Please log in to see products</p>
    </else>
</body>
```

## Best Practices

1. Use meaningful names for components and duplicate elements
1. Keep templates simple and readable
1. Use filters for data formatting
1. Handle events with dedicated methods
1. Use debug mode during development

## Browser Support
MintAssembly works in all modern browsers that support:

- ES6 Proxies
- DOM Parser API
- Template literals

## License
MIT License - Feel free to use in your projects.<br>

From Mint teams