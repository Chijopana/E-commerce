# Mi E-Commerce
 
Tienda online construida con Angular standalone y Angular Material (Material 3), con carrito, checkout por pasos, cupones de descuento, lista de deseos, historial de pedidos, búsqueda en vivo, modo oscuro, soporte multi-idioma y un chat de soporte simulado.
 
## Stack técnico
 
| Área | Tecnología |
|---|---|
| Framework | Angular (standalone components, sin `NgModule`) |
| UI | Angular Material 3 (`mat.theme()`, tokens de sistema) |
| Estado | RxJS (`BehaviorSubject`) + Angular Signals (tema) |
| Formularios | Reactive Forms (`FormGroup`) + Template-driven (`ngModel`) donde corresponde |
| Persistencia | `localStorage` (auth, carrito, pedidos, wishlist, tema, idioma) — sin backend |
| Notificaciones UI | SweetAlert2 |
| Routing | Lazy loading parcial vía `loadComponent()`, guards funcionales (`CanActivateFn`) |
 
## Características
 
### Catálogo y compra
- Listado de productos con filtros (categoría, rango de precio, rating mínimo, búsqueda por texto)
- **Búsqueda en vivo** en el navbar con debounce (300ms) y sugerencias con imagen/precio
- Página de detalle de producto con reseñas (dejar y ver) y productos relacionados por categoría
- Carrito persistente con control de stock por unidad
- Checkout por pasos (envío → pago → revisión) con validación reactiva
- **Cupones de descuento** aplicados en checkout, reflejados en el total del pedido guardado
- Lista de deseos (wishlist) para usuarios autenticados
- Historial de pedidos con estados (pendiente, en proceso, enviado, entregado, cancelado)
### Experiencia
- **Modo oscuro** persistente, integrado con el sistema de theming M3 de Angular Material (`--mat-sys-*`), no un sistema de colores paralelo
- **Multi-idioma (i18n)** vía `TranslationService` propio con archivos JSON por idioma, en vez de compilar un build por locale
- **Chat de soporte** simulado (bot por palabras clave: envíos, devoluciones, pagos, stock)
- Autenticación mock con usuario demo (`demo@ecommerce.com` / `demo123`)
## Decisiones de diseño
 
### Colores semánticos fijos vs. tokens dinámicos
En todo el proyecto se sigue una regla consistente: los colores que comunican **estado** (verde = éxito/disponible, rojo = error/agotado, naranja = advertencia) están fijos en el CSS y no cambian con el tema, porque son una convención universal de UI que debe leerse igual en claro y oscuro. Los colores de **superficie y texto** (fondos, bordes, texto principal/secundario) usan los tokens del sistema de Angular Material (`var(--mat-sys-surface)`, `var(--mat-sys-on-surface)`, etc.) para adaptarse automáticamente al tema activo.
 
### Por qué un `TranslationService` propio en vez de `@angular/localize` o `ngx-translate`
El i18n nativo de Angular (`@angular/localize`) requiere compilar un build separado por idioma, lo cual es excesivo para un selector de idioma en caliente. Un servicio propio con `HttpClient` + Signals permite cambiar de idioma sin recargar la página ni duplicar el build, a cambio de no tener soporte de pluralización avanzada (aceptable para el alcance de este proyecto).
 
### Por qué el chat de soporte es un bot por palabras clave y no una integración real
El objetivo es demostrar el patrón de componente flotante + servicio de resolución de intents, no operar un canal de soporte real. Migrarlo a un proveedor real (Intercom, Tawk.to, o un backend propio con WebSockets) sería el siguiente paso natural si el proyecto pasara a producción.
 
## Estructura del proyecto
 
```
src/app/
├─ auth/                  # Login/registro (tabs)
├─ cart/                  # Carrito
├─ checkout/              # Checkout por pasos + cupones
├─ home/                  # Landing
├─ orders/                # Historial de pedidos
├─ product-detail/        # Ficha de producto + reseñas
├─ products/               # Catálogo + filtros
├─ wishlist/                # Lista de deseos
├─ components/
│  ├─ theme-toggle.component.ts
│  ├─ search-bar.component.ts
│  └─ support-chat.component.ts
├─ services/
│  ├─ auth.service.ts
│  ├─ cart.service.ts
│  ├─ chat-bot.service.ts
│  ├─ coupon.service.ts
│  ├─ order.service.ts
│  ├─ products.service.ts
│  ├─ theme.service.ts
│  ├─ translation.service.ts
│  └─ wishlist.service.ts
├─ guards/
│  └─ auth.guard.ts
├─ models/
└─ app.routes.ts
public/
└─ i18n/
   ├─ es.json
   └─ en.json
```
 
## Cómo correrlo en local
 
```bash
npm install
ng serve
```
 
Abre `http://localhost:4200`.
 
Usuario de prueba: `demo@ecommerce.com` / `demo123`
Cupones de prueba: `DESCUENTO10`, `BIENVENIDO15`, `VIP20`
 
## Notas de desarrollo
 
- Todos los componentes de página inyectan servicios con `BehaviorSubject`/streams que no completan por sí solos (`authState$`, `cartState$`, `wishlist$`); todas las suscripciones usan `takeUntilDestroyed()` para evitar fugas de memoria en navegación repetida.
- Las contraseñas se almacenan sin hash en `localStorage` — es una simplificación consciente porque no hay backend; en un entorno real esto se resolvería con hashing (bcrypt) del lado del servidor y nunca se persistiría en el cliente.
- El servidor de desarrollo de Angular (`ng serve`) no requiere configuración adicional para las rutas con parámetros (`/products/:id`) ni para los archivos estáticos de `public/i18n/`.
## Roadmap
 
- [ ] Lazy loading completo de todas las rutas (actualmente solo `wishlist` y `orders` usan `loadComponent()`)
- [ ] Guard dedicado para "carrito no vacío" en `/checkout` (actualmente la comprobación vive dentro del componente)
- [ ] Backend real con base de datos, para reemplazar el mock de `localStorage`