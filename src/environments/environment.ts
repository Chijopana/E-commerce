/**
 * Configuracion de produccion.
 *
 * `apiUrl` se sustituye al desplegar. Si el backend acaba en otro dominio
 * (Render, Railway, Fly...), es el unico valor que hay que cambiar aqui, y
 * ese origen debe estar en el CORS_ORIGINS del servidor.
 */
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api',
};
