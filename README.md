# 🛒 Mini E-Commerce en Angular

Un e-commerce completo construido con **Angular + Angular Material**, desarrollado como proyecto personal para practicar arquitecturas escalables, diseño moderno y lógica real de carrito y checkout.

---

## 🚀 Características principales

### 🏠 Home
- Presentación limpia del sitio.
- Navegación clara hacia productos y carrito.
- Diseño responsive con Angular Material.

### 🛍️ Products
- Listado dinámico de productos.
- Tarjetas con imagen, precio y descripción.
- Botón **Añadir al carrito** completamente funcional.
- Integración con servicios para gestionar datos y estado global.

### 🛒 Cart
- Vista completa del carrito:
  - Lista de productos añadidos  
  - Cantidad ajustable  
  - Precio total en tiempo real  
  - Botón para eliminar productos  
- Animaciones suaves y diseño moderno.
- Datos sincronizados gracias al `CartService`.

### 💳 Checkout
- Resumen final de compra.
- Formularios estilizados con Angular Material.
- Validaciones reactivas.
- Flujo completo hasta "Confirmar compra".

---

## 🧩 Tecnologías Utilizadas

| Tecnología | Uso |
|-----------|------|
| **Angular 17+** | Arquitectura principal |
| **Angular Material** | Componentes UI modernos |
| **TypeScript** | Tipado estricto y mantenible |
| **RxJS** | Estado reactivo y comunicación |
| **SCSS / CSS** | Estilos personalizados |
| **Services** | Lógica del carrito y productos |

---

## 📦 Funcionalidades Técnicas

- Arquitectura modular (Home, Products, Cart, Checkout).
- Servicios para manejar el estado del carrito.
- Observables y comunicación entre componentes.
- Diseño responsivo + Angular Material.
- Separación clara entre UI, lógica y estilos.
- Preparado para una futura integración con backend.