# 🚀 Configuración de Entorno Pre-Producción en Vercel

## Pasos para configurar el entorno PRE en Vercel

### 1. En el Dashboard de Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a **Settings** → **Git**
3. Asegúrate de que la rama de producción esté configurada como `main` o `master`

### 2. Configurar Preview Deployments

Vercel automáticamente crea preview deployments para todas las ramas que no sean la principal. Para la rama `PRE`:

1. Ve a **Settings** → **Git** → **Production Branch**
2. Configura la rama de producción como `main` (o `master`)
3. La rama `PRE` automáticamente generará preview deployments

### 3. Opcional: Configurar un dominio personalizado para PRE

Si quieres un dominio específico para el entorno de pre-producción:

1. Ve a **Settings** → **Domains**
2. Añade un dominio como `pre.clarity-app.com` o `staging.clarity-app.com`
3. En **Settings** → **Git** → **Production Branch**, puedes configurar:
   - **Production Branch**: `main`
   - **Preview Branch**: `PRE` (si quieres que solo PRE genere previews)

### 4. Variables de Entorno

Si necesitas variables de entorno diferentes para PRE:

1. Ve a **Settings** → **Environment Variables**
2. Añade variables específicas para:
   - **Preview**: Variables para el entorno PRE
   - **Production**: Variables para producción

### 5. Verificar el Deployment

Después de hacer push a la rama `PRE`:

1. Ve a la pestaña **Deployments** en Vercel
2. Deberías ver un nuevo deployment con la rama `PRE`
3. El deployment tendrá una URL única tipo: `clarity-app-git-pre-tu-usuario.vercel.app`

## Comandos útiles

```bash
# Ver el estado de la rama
git status

# Hacer push de cambios a PRE
git push origin PRE

# Ver los deployments en Vercel CLI (si tienes Vercel CLI instalado)
vercel ls
```

## Notas importantes

- ✅ Los preview deployments son automáticos en Vercel
- ✅ Cada push a `PRE` creará un nuevo deployment
- ✅ Puedes hacer rollback fácilmente desde el dashboard
- ✅ Las variables de entorno se pueden configurar por entorno
- ⚠️ Asegúrate de que Firebase esté configurado para aceptar el dominio de preview

## Configuración de Firebase para Preview

Si usas Firebase, necesitarás añadir el dominio de preview a las autorizaciones:

1. Ve a Firebase Console → Authentication → Settings → Authorized domains
2. Añade el dominio de Vercel preview (ej: `*.vercel.app` o el dominio específico)









