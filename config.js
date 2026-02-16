// Configuración de Cloudinary y Supabase para la Cafetería
// --------------------------------------------------------------------
// IMPORTANTE:
// 1. Rellena los valores de CLOUDINARY y SUPABASE con tus datos reales.
// 2. Incluye este archivo en tu HTML (idealmente como módulo ES):
//    <script type="module" src="config.js"></script>
// 3. Desde otros scripts tipo módulo puedes hacer:
//    import { cloudinaryConfig, buildCloudinaryUrl, supabase, signInAdmin, getCurrentUser, signOut } from './config.js';

// ===========================
// CLOUDINARY
// ===========================

export const cloudinaryConfig = {
  cloudName: "djjrgesxu",         // p.ej. "mi-cafeteria"
  uploadPreset: "preset_cafeteria",   // preset sin firma (unsigned) si subes desde el navegador
  folder: "cafeteria",                // carpeta opcional en Cloudinary
};

/**
 * Construye una URL de imagen de Cloudinary a partir de un publicId y opciones.
 * NO hace subida, solo genera la URL.
 */
export function buildCloudinaryUrl(publicId, options = {}) {
  const { cloudName } = cloudinaryConfig;
  if (!cloudName || cloudName === "TU_CLOUD_NAME") {
    console.warn("[Cloudinary] Debes configurar cloudinaryConfig.cloudName en config.js");
  }

  const {
    width,
    height,
    crop = "fill",
    format = "jpg",
    quality = "auto",
  } = options;

  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);

  const t = transformations.length ? transformations.join(",") + "/" : "";
  return `https://res.cloudinary.com/${cloudName}/image/upload/${t}${publicId}.${format}`;
}

// ===========================
// SUPABASE
// ===========================

// Usamos la versión ESM de supabase-js para navegador.
// Si prefieres otro CDN o ya lo importas en otro archivo, puedes eliminar este import.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_CONFIG = {
  url: "https://qeafopmlsqxzkleslnqi.supabase.co",     // URL del proyecto
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlYWZvcG1sc3F4emtsZXNsbnFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzE5MTksImV4cCI6MjA4NjgwNzkxOX0.GiPrpCsnQLX9xZ-beDRvq3XyAEVLVjHtHycW4CZa22c",             // Clave pública anon
  adminRoleKey: "admin",                     // Valor esperado en user_metadata.role
};

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// ===========================
// AUTENTICACIÓN PANEL ADMIN
// ===========================

/**
 * Inicia sesión para el panel admin.
 * Ahora SOLO valida que el usuario exista en Supabase (sin comprobar rol).
 */
export async function signInAdmin({ email, password }) {
  if (!email || !password) {
    return { user: null, error: new Error("Email y contraseña son obligatorios") };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error };

  const user = data.user;
  // Ya no comprobamos ningún rol adicional: cualquier usuario autenticado tiene acceso.
  return { user, error: null };
}

/**
 * Devuelve el usuario actual (si la sesión sigue activa).
 * Útil para proteger rutas del panel admin.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("[Supabase] Error al obtener usuario actual:", error.message);
    return null;
  }
  return data.user || null;
}

/**
 * Verifica si hay un usuario autenticado.
 * (Se usa para decidir si abrir directamente el panel admin).
 */
export async function isCurrentUserAdmin() {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Cierra la sesión del usuario.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Supabase] Error al cerrar sesión:", error.message);
  }
}

// ===========================
// Helpers para usar en HTML sencillo (sin módulos)
// ===========================

// Si este archivo se incluye con <script src="config.js"> sin type="module",
// las exports no estarán disponibles. Por eso exponemos helpers en window.
if (typeof window !== "undefined") {
  window.CafeteriaConfig = {
    cloudinaryConfig,
    buildCloudinaryUrl,
    SUPABASE_CONFIG,
    supabase,
    signInAdmin,
    getCurrentUser,
    isCurrentUserAdmin,
    signOut,
  };
}

