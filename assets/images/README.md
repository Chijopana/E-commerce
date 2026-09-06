# Imágenes de producto

Los cuatro primeros productos del catálogo usan las fotos de esta carpeta:

| Producto | Archivo |
|---|---|
| Auriculares Inalámbricos Premium | `auriculares.jpg` |
| Smartwatch Deportivo Pro | `smartwatch.jpg` |
| Mochila Antirrobo Inteligente | `mochila.jpg` |
| Altavoz Bluetooth Resistente | `altavoz.jpg` |

El resto del catálogo tira de `placehold.co`, un servicio de marcadores de
posición remoto. Se referencian desde `ProductsService.baseCatalog`.

## Por qué una mezcla y no todo remoto

Antes los doce productos apuntaban a URLs remotas: sin conexión, el catálogo
entero se veía como una cuadrícula de huecos grises. Usar las fotos locales que
ya estaban en el repositorio (y que nadie referenciaba) hace que al menos la
primera pantalla se vea bien sin red, y de paso enseña productos de verdad en
vez de rectángulos de color.

Para las que siguen siendo remotas hay una imagen de reserva en línea (un SVG
como `data:` URI, en `product-card.component.ts`), de modo que si la petición
falla se ve un marcador limpio y no el icono de imagen rota del navegador.

## Para producción

Sustituye las URLs de `placehold.co` por imágenes reales del inventario,
idealmente servidas en varios tamaños (`srcset`) y en formatos modernos
(WebP/AVIF).
