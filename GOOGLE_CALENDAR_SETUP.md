
# 📅 Configuración de Google Calendar

Para activar la sincronización automática de citas con Google Calendar, necesitas configurar las credenciales de Service Account o OAuth en Supabase.

## Opción Recomendada: Service Account (Más fácil)

Esta opción permite que la aplicación cree eventos en un calendario específico (ej. el del doctor) sin pedir permiso a cada usuario. Ideal para el Dr. Montes.

### Pasos:

1.  Ve a [Google Cloud Console](https://console.cloud.google.com/).
2.  Crea un nuevo proyecto o selecciona uno existente.
3.  Habilita la **Google Calendar API**.
4.  Ve a **IAM & Admin** > **Service Accounts** y crea una nueva Service Account.
5.  Crea una Key JSON para esa cuenta y descárgala.
6.  Abre el archivo JSON y copia el `client_email` y el `private_key`.
7.  En tu Google Calendar personal (donde quieres que aparezcan las citas):
    *   Ve a "Configurar y compartir" del calendario.
    *   En "Compartir con personas específicas", añade el `client_email` de la Service Account.
    *   Dale permiso de "Realizar cambios en eventos".

### Configuración en Supabase:

Ve a tu Dashboard de Supabase > Project Settings > Edge Functions (Secrets) y añade:

*   `GOOGLE_SERVICE_ACCOUNT_EMAIL`: El email de la service account.
*   `GOOGLE_PRIVATE_KEY`: La clave privada (incluyendo `-----BEGIN PRIVATE KEY...`).
*   `GOOGLE_CALENDAR_ID`: El ID del calendario (generalmente tu email o el ID que sale en configuración).

## Opción Alternativa: OAuth (Más compleja)

Si prefieres usar OAuth (que el doctor se loguee con Google):

1.  Configura OAuth Consent Screen en Google Cloud.
2.  Crea credenciales OAuth 2.0 Web Client.
3.  Añade `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` en Supabase.
4.  Implementa el flujo de intercambio de tokens (actualmente la app usa una simulación).

---

## ✅ Estado Actual

La función `Crear-evento-calendario` ha sido actualizada para realizar la integración real con Google Calendar usando la Service Account.

### Pasos para probar:
1.  Asegúrate de haber añadido las variables de entorno en Supabase Edge Functions:
    *   `GOOGLE_SERVICE_ACCOUNT_EMAIL`
    *   `GOOGLE_PRIVATE_KEY`
    *   `GOOGLE_CALENDAR_ID`
2.  Ve al Panel de Administración > Configuración.
3.  En la sección "Google Calendar", haz clic en el botón **"Probar Integración"**.
4.  Si todo está correcto, deberías ver una alerta de éxito y el evento creado en tu calendario.

### ❓ Solución de Problemas Comunes

*   **Error 401 / CORS Error:**
    *   Si al probar recibes un error 401 o un error de CORS en la consola, ve al Dashboard de Supabase.
    *   Entra a la función `Crear-evento-calendario`.
    *   **Desactiva** la opción "Verify JWT" (o "Enforce JWT Verification").
    *   Esto es necesario porque el navegador envía una petición preliminar (OPTIONS) sin credenciales que Supabase bloquea si esta opción está activa. Nuestra función ya maneja la seguridad internamente.

*   **Error "You need to have writer access...":**
    *   Significa que no compartiste tu calendario con el email de la Service Account. Revisa los pasos de configuración.
