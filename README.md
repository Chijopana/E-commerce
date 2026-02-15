# 🛒 E-Commerce Profesional - Angular

> Un e-commerce moderno y completo construido con **Angular 20+**, **Angular Material** y **TypeScript**. Este proyecto demuestra arquitectura escalable, mejores prácticas, diseño responsive y funcionalidades avanzadas de comercio electrónico.

[![Angular](https://img.shields.io/badge/Angular-20-red?logo=angular)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Material](https://img.shields.io/badge/Material-20-blue?logo=material-design)](https://material.angular.io/)

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Funcionalidades](#-funcionalidades-técnicas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## ✨ Características

### 🎯 Funcionalidades Principales

- **🏠 Landing Page Moderna**: Hero section, características, categorías y estadísticas
- **🔐 Sistema de Autenticación**: Login y registro con localStorage
- **🛍️ Catálogo de Productos**: 
  - Búsqueda en tiempo real
  - Filtrado por categoría, precio y rating
  - Sistema de ratings y reseñas
  - 12+ productos categorizados
- **❤️ Lista de Favoritos (Wishlist)**: Guarda productos para después
- **🛒 Carrito de Compras**:
  - Control de cantidad con validación de stock
  - Actualización en tiempo real
  - Persistencia con localStorage
- **💳 Proceso de Checkout**: 
  - Stepper de 3 pasos
  - Validaciones de formularios
  - Múltiples métodos de pago
- **📦 Historial de Pedidos**: Seguimiento completo de órdenes
- **🔒 Guards de Autenticación**: Protección de rutas sensibles
- **📱 Diseño Responsive**: Optimizado para móviles, tablets y desktop

### 🎨 Características de UX/UI

- Animaciones suaves y transiciones
- Loading states y skeleton screens
- Empty states informativos
- Badges de stock y notificaciones
- Iconografía consistente (Material Icons)
- Tema personalizado con paleta moderna
- Feedback visual para todas las acciones

---

## 🔧 Tecnologías

### Frontend
- **Angular 20.1** - Framework principal
- **TypeScript 5.8** - Lenguaje tipado
- **Angular Material 20** - Componentes UI
- **RxJS 7.8** - Programación reactiva
- **SweetAlert2** - Modales y notificaciones

### Herramientas
- **Angular CLI** - Desarrollo y build
- **Karma + Jasmine** - Testing
- **SCSS** - Estilos avanzados

### Arquitectura
- **Standalone Components** - Arquitectura modular
- **Lazy Loading** - Carga optimizada
- **Services con DI** - Inyección de dependencias
- **BehaviorSubjects** - Estado reactivo
- **Guards** - Protección de rutas
- **Models e Interfaces** - Tipado fuerte

---

## 🏗️ Arquitectura

### Estructura de Servicios

```
services/
├── auth.service.ts          # Autenticación de usuarios
├── cart.service.ts          # Gestión del carrito
├── products.service.ts      # Catálogo de productos
├── wishlist.service.ts      # Lista de deseos
└── order.service.ts         # Gestión de pedidos
```

### Modelos de Datos

```typescript
// Modelos principales
- Product (id, name, price, stock, category, rating, reviews)
- CartItem (id, name, price, quantity, stock, image)
- User (id, email, name, avatar, wishlist)
- Order (id, userId, items, total, status, shippingInfo)
```

### Flujo de Datos

```
Component → Service → BehaviorSubject → Component
                ↓
          localStorage (persistencia)
```

---

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm 9+
- Angular CLI 20+

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-repo>

# 2. Entrar al directorio
cd mini-ecommerce

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
ng serve

# 5. Abrir en navegador
http://localhost:4200
```

---

## 🎮 Uso

### Credenciales de Demo

```
Email: demo@ecommerce.com
Password: demo123
```

### Flujo de Usuario

1. **Explorar**: Navega por el catálogo de productos
2. **Buscar y Filtrar**: Usa los filtros para encontrar productos
3. **Agregar al Carrito**: Añade productos (sin necesidad de login)
4. **Wishlist**: Guarda favoritos (requiere login)
5. **Checkout**: Completa el proceso de compra
6. **Mis Pedidos**: Revisa el historial de órdenes

---

## 🛠️ Funcionalidades Técnicas

### 1. Sistema de Autenticación
- Login y registro de usuarios
- Almacenamiento seguro en localStorage
- Guards para protección de rutas
- Estado global de autenticación
- Usuarios de demostración precargados

### 2. Gestión de Productos
```typescript
// Funcionalidades
- Búsqueda por nombre/descripción
- Filtrado por categoría
- Filtrado por rango de precio
- Filtrado por rating mínimo
- Sistema de reviews
- Control de stock en tiempo real
```

### 3. Carrito Inteligente
```typescript
// Validaciones
- Stock disponible
- Límite de cantidad
- Cálculo automático de totales
- Persistencia entre sesiones
- Sincronización en tiempo real
```

### 4. Wishlist Personalizada
- Vinculada al usuario
- Sincronización con backend (simulado)
- Conversión fácil a carrito
- Gestión de favoritos

### 5. Sistema de Pedidos
```typescript
interface Order {
  id: string;              // ORD-timestamp-random
  userId: number;
  items: CartItem[];
  total: number;
  status: OrderStatus;     // Pending, Processing, Shipped, Delivered
  shippingInfo: {...};
  paymentMethod: string;
  createdAt: Date;
  estimatedDelivery: Date;
}
```

---

## 📁 Estructura del Proyecto

```
mini-ecommerce/
├── src/
│   ├── app/
│   │   ├── models/              # Interfaces y tipos
│   │   │   ├── product.model.ts
│   │   │   ├── cart.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── order.model.ts
│   │   ├── services/            # Servicios
│   │   │   ├── auth.service.ts
│   │   │   ├── cart.service.ts
│   │   │   ├── products.service.ts
│   │   │   ├── wishlist.service.ts
│   │   │   └── order.service.ts
│   │   ├── guards/              # Protección de rutas
│   │   │   └── auth.guard.ts
│   │   ├── home/                # Landing page
│   │   ├── auth/                # Login/Register
│   │   ├── products/            # Catálogo
│   │   ├── cart/                # Carrito
│   │   ├── checkout/            # Proceso de compra
│   │   ├── wishlist/            # Favoritos
│   │   ├── orders/              # Historial
│   │   ├── app.routes.ts        # Configuración de rutas
│   │   ├── app.config.ts        # Configuración de app
│   │   └── app.ts               # Componente raíz
│   ├── assets/
│   │   └── images/              # Imágenes de productos
│   ├── styles.css               # Estilos globales
│   └── index.html
├── angular.json
├── package.json
└── README.md
```

---

## 🎨 Capturas de Pantalla

### Home
- Landing page moderna con hero section
- Características principales
- Categorías destacadas

### Products
- Grid responsive de productos
- Barra de búsqueda y filtros
- Cards con información detallada

### Cart
- Vista detallada del carrito
- Control de cantidades
- Resumen de precios

### Checkout
- Stepper de 3 pasos
- Formularios validados
- Resumen de pedido

---

## 🗺️ Roadmap

### Versión Actual (v1.0)
- ✅ CRUD completo de carrito
- ✅ Sistema de autenticación
- ✅ Búsqueda y filtros avanzados
- ✅ Wishlist funcional
- ✅ Proceso de checkout
- ✅ Historial de pedidos
- ✅ Diseño responsive

### Futuras Mejoras (v2.0)
- [ ] Integración con backend real (Node.js, NestJS)
- [ ] Pasarela de pagos (Stripe, PayPal)
- [ ] Sistema de cupones y descuentos
- [ ] Reviews y ratings dinámicos
- [ ] Comparador de productos
- [ ] Notificaciones push
- [ ] Chat de soporte
- [ ] Panel de administración
- [ ] Multi-idioma (i18n)
- [ ] Modo oscuro

---

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Jose**

- Proyecto creado como demostración de habilidades en Angular
- Arquitectura escalable y mejores prácticas
- Código limpio y documentado

---

## 🙏 Agradecimientos

- Angular Team por el excelente framework
- Material Design por los componentes UI
- Comunidad de Angular por recursos y documentación

---

## 📞 Contacto

¿Preguntas o sugerencias? Abre un issue en GitHub.

---

<div align="center">

**⭐ Si te gustó el proyecto, dale una estrella! ⭐**

Made with ❤️ using Angular

</div>
