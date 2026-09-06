# Mi E-Commerce

Tienda online completa: **frontend Angular 20** + **API REST con NestJS, Prisma y
SQLite**. Catálogo con filtros y paginación, carrito, checkout por pasos con
cupones, favoritos, historial de pedidos, búsqueda en vivo, modo oscuro y
multi-idioma.

Cuenta de prueba: `demo@ecommerce.com` / `demo123`
Cupones: `DESCUENTO10`, `BIENVENIDO15`, `VIP20`

---

## Cómo verlo

Necesitas **Node 20 o superior**. Hacen falta dos terminales: una para la API y
otra para la web.

### 1. La API

```bash
cd server
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run setup             # crea la base de datos y la rellena con datos de ejemplo
npm run dev
```

Queda escuchando en `http://localhost:3000/api`.
Para comprobar que está viva: <http://localhost:3000/api/health>

### 2. La web

```bash
# desde la raíz del repositorio
npm install
npm start
```

Abre <http://localhost:4200>.

### Comandos útiles

| Dónde | Comando | Qué hace |
|---|---|---|
| raíz | `npm start` | Servidor de desarrollo de Angular |
| raíz | `npm run build` | Build de producción |
| raíz | `npm run test:ci` | Tests del frontend (56) |
| `server/` | `npm run dev` | API con recarga automática |
| `server/` | `npm test` | Tests unitarios (8) |
| `server/` | `npm run test:e2e` | Tests de integración contra base de datos (31) |
| `server/` | `npm run seed` | Asegura catálogo, cuenta demo y cupones (no toca el stock ya vendido) |
| `server/` | `npm run db:reset` | Borra todo y vuelve a dejar la tienda como recién instalada |
| `server/` | `npm run prisma:studio` | Explorador visual de la base de datos |

---

## Arquitectura

```
.                        # frontend Angular
├─ src/app/
│  ├─ auth/ cart/ checkout/ home/ orders/
│  ├─ product-detail/ products/ wishlist/ not-found/
│  ├─ components/        # tarjeta de producto, buscador, chat, diálogo, footer
│  ├─ core/              # token JWT, interceptor, traducción de errores HTTP
│  ├─ services/          # una fachada por recurso de la API
│  ├─ i18n/              # pipe de traducción, etiquetas de dominio, título
│  ├─ guards/ models/ testing/
│  └─ environments/      # apiUrl por entorno
└─ server/               # API NestJS
   ├─ prisma/            # esquema, migraciones y datos de ejemplo
   ├─ src/
   │  ├─ auth/           # registro, login, JWT, guard
   │  ├─ products/       # catálogo, filtros, reseñas
   │  ├─ orders/         # creación de pedidos, stock, cancelación
   │  ├─ coupons/ wishlist/
   │  └─ common/         # dinero y reglas de precio
   └─ test/              # tests de integración
```

### La API

Todo cuelga de `/api`. Lo marcado con 🔒 exige `Authorization: Bearer <token>`.

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/health` | Estado del servicio y de la base de datos |
| `POST` | `/auth/register` | Alta de usuario |
| `POST` | `/auth/login` | Devuelve el JWT |
| `GET` | `/auth/me` 🔒 | Usuario de la sesión actual |
| `GET` | `/products` | Catálogo con filtros, orden y paginación |
| `GET` | `/products/categories` | Categorías existentes |
| `GET` | `/products/:id` | Ficha de producto con reseñas |
| `POST` | `/products/:id/reviews` 🔒 | Publica o actualiza tu reseña |
| `GET` | `/orders` 🔒 | Tus pedidos |
| `POST` | `/orders` 🔒 | Crea un pedido |
| `GET` | `/orders/:id` 🔒 | Un pedido tuyo |
| `PATCH` | `/orders/:id/cancel` 🔒 | Cancela y devuelve el stock |
| `POST` | `/coupons/validate` 🔒 | Comprueba un código |
| `GET` `POST` `DELETE` | `/wishlist[/:productId]` 🔒 | Favoritos |

---

## Decisiones de diseño

### El servidor no se fía del cliente

Al crear un pedido, el navegador manda **solo `productId` y `quantity`**. Ni
precios, ni totales. El servidor busca los precios en la base de datos, aplica
el cupón, calcula el envío y cobra ese importe.

Es la diferencia entre una tienda y un formulario: si el total viaja desde el
cliente, cualquiera puede comprar por 0. La validación rechaza además cualquier
campo que no esté en el DTO (`forbidNonWhitelisted`), así que colar un `price`
o un `role: "ADMIN"` devuelve un 400 en vez de ignorarse en silencio.

### El stock se descuenta en una transacción

Leer stock, comprobar y descontar ocurre dentro de una transacción, y el
`UPDATE` lleva la condición `stock >= cantidad`. Si dos compras entran a la vez
por la última unidad, la segunda afecta a cero filas y la transacción se
deshace, en lugar de dejar el stock en negativo. Hay un test que lo fija.

### El dinero es un entero

Se guarda en **céntimos** (`priceCents`). Los `float` acumulan error de redondeo
—`0.1 + 0.2 !== 0.3`— y SQLite no tiene tipo decimal. La conversión a unidades
ocurre solo en el borde de la API, en `common/money.ts`.

### Las líneas de pedido guardan una foto del producto

Nombre, precio e imagen se copian dentro del pedido. Si mañana sube el precio o
se retira el producto, el pedido tiene que seguir mostrando lo que se cobró.

### Contraseñas

Hash **bcrypt con 12 rondas**, en el servidor. Nunca salen en ninguna respuesta.
El login compara siempre contra un hash —aunque el email no exista— para que el
tiempo de respuesta no delate qué correos están registrados. Un pedido ajeno
responde `404`, no `403`: un `403` confirmaría que ese identificador existe.

### El carrito sigue en el navegador

Es lo único que queda en `localStorage`, a propósito: un carrito sin confirmar
no es todavía un dato del negocio, y así se puede llenar sin tener cuenta. La
comprobación que vale es la del servidor al confirmar.

### Códigos, no texto, en los enums

Los pedidos guardan `PENDING` y `CREDIT_CARD`, no "Pendiente" ni "Tarjeta de
Crédito". Guardar la etiqueta traducida hacía imposible cambiar el texto sin
romper el historial. La traducción se resuelve al pintar (`i18n/catalog-labels.ts`).

### i18n con servicio propio

`@angular/localize` exige un build por idioma, excesivo para un selector en
caliente. El diccionario se carga en `provideAppInitializer`, antes del primer
render, para que no se vean las claves crudas. El pipe `t` es **impuro** a
propósito: uno puro cachea por argumentos y, al cambiar de idioma, la clave
sigue siendo la misma, así que la interfaz no se traduciría.

### Dónde se guarda el token

En `localStorage`, que es accesible desde JavaScript: un XSS podría leerlo. Lo
correcto en producción sería una cookie `httpOnly` + `SameSite`. Se queda así
porque el frontend es estático y la API vive en otro dominio, donde las cookies
de terceros complican más de lo que aportan en una demo.

---

## Tests

**95 en total**, todos verdes.

| Suite | Nº | Cubre |
|---|---|---|
| Frontend (`npm run test:ci`) | 56 | Reglas de precio, límites de stock del carrito, parámetros de consulta, sesión, montaje de cada página |
| API unitarios (`server/`, `npm test`) | 8 | Cálculo de totales y aritmética de céntimos |
| API integración (`server/`, `npm run test:e2e`) | 31 | Recorrido completo contra base de datos real |

Los de integración fijan las garantías que no pueden romperse: el precio lo pone
el servidor, no se puede comprar más stock del que hay, y nadie ve ni cancela
pedidos ajenos.

---

## Publicarlo en internet

El frontend es estático y puede ir a GitHub Pages, pero **la API necesita un
servidor**: GitHub Pages solo sirve ficheros.

1. **Despliega la API.** Hay un `render.yaml` listo: en [Render](https://render.com),
   *New > Blueprint* apuntando a este repositorio. Ajusta `CORS_ORIGINS` a la URL
   de tu frontend.

   El contenedor aplica las migraciones **y siembra los datos** en cada arranque
   (ver el `CMD` del `Dockerfile`). Hace falta porque en el plan gratuito el
   disco es efímero: sin eso, la tienda levantaría sin catálogo y sin la cuenta
   demo. El seed es idempotente y no toca el stock de lo que ya exista.

   Para algo permanente, crea una Postgres gratuita en Render, cambia `provider`
   a `postgresql` en `prisma/schema.prisma` y regenera las migraciones.

2. **Apunta el frontend a esa URL** en `src/environments/environment.ts`
   (ya está puesta la del despliegue actual).

3. **Publica la web:** `npm run deploy` (build con `--base-href=/E-commerce/` y
   subida a la rama `gh-pages`).

Dos cosas del plan gratuito de Render que conviene saber: el servicio **se
duerme tras un rato sin uso**, así que la primera visita puede tardar cerca de
un minuto en cargar el catálogo; y al despertar, la base de datos vuelve a los
datos de ejemplo.

---

## Roadmap

- [ ] Panel de administración (alta y edición de productos) sobre el rol `ADMIN`
- [ ] Pasarela de pago real (Stripe en modo test)
- [ ] Refresh tokens y cookies `httpOnly`
- [ ] Imágenes en `srcset` y formatos modernos (WebP/AVIF)
- [ ] Tests end-to-end de navegador (Playwright)
