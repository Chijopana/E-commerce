/**
 * Configuracion de produccion.
 *
 * Apunta a la API desplegada en Render. Si cambia de dominio, este es el unico
 * valor que hay que tocar aqui — y el nuevo origen del frontend tiene que estar
 * en la variable CORS_ORIGINS del servidor, o el navegador bloqueara todo.
 *
 * Aviso sobre el plan gratuito de Render: el servicio se duerme tras un rato
 * sin uso y la primera peticion puede tardar cerca de un minuto en despertarlo.
 */
export const environment = {
  production: true,
  apiUrl: 'https://mini-ecommerce-api-ylh8.onrender.com/api',
};
