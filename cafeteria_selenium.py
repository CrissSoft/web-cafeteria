"""
Automatización con Selenium para la página de Cafetería Y&V.
Abre la página local, interactúa con el carrito y obtiene datos para integrar
con WhatsApp u otras automatizaciones.

Requisito: pip install selenium (incluye By, WebDriverWait, EC, Options).
"""

import json
import time
from pathlib import Path

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options


# Ruta base de la carpeta cafeteria (donde está index.html)
BASE_DIR = Path(__file__).resolve().parent
INDEX_URL = (BASE_DIR / "index.html").as_uri()  # file:///.../cafeteria/index.html


class CafeteriaSelenium:
    """Automatización de la página de la cafetería con Selenium."""

    def __init__(self, headless=False):
        self.driver = None
        self.headless = headless

    def setup_driver(self):
        """Configura el driver de Chrome."""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.maximize_window()
        return self.driver

    def abrir_pagina(self, url=None):
        """Abre la página de la cafetería y espera a que app.js esté listo."""
        url = url or INDEX_URL
        self.driver.get(url)
        # Esperar a que el JS haya cargado y los botones tengan data-testid (app.js ya ejecutado)
        wait = WebDriverWait(self.driver, 15)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='cart-badge']")))
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-testid='add-to-cart-btn']")))
        time.sleep(0.8)  # Pausa para que se vea la página cargada
        return self

    def agregar_al_carrito_por_indice(self, indice, pausa_visible=1.0):
        """Hace clic en 'Agregar al carrito' del producto en la posición indice (0-based)."""
        wait = WebDriverWait(self.driver, 10)
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-testid='add-to-cart-btn']")))
        botones = self.driver.find_elements(By.CSS_SELECTOR, "[data-testid='add-to-cart-btn']")
        if indice < 0 or indice >= len(botones):
            raise IndexError(f"Índice {indice} fuera de rango. Hay {len(botones)} productos.")
        btn = botones[indice]
        self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
        time.sleep(0.3)
        wait.until(EC.element_to_be_clickable(btn))
        btn.click()
        time.sleep(pausa_visible)  # Pausa para ver el cambio en el navegador (badge, etc.)
        return self

    def agregar_al_carrito_por_nombre(self, nombre_producto, cantidad=1, pausa_visible=1.0):
        """Agrega al carrito el producto cuyo nombre coincida (parcial)."""
        wait = WebDriverWait(self.driver, 10)
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-testid='add-to-cart-btn']")))
        cards = self.driver.find_elements(By.CSS_SELECTOR, ".product-card")
        for card in cards:
            name_el = card.find_elements(By.CSS_SELECTOR, ".product-name")
            if not name_el:
                continue
            if nombre_producto.lower() in name_el[0].text.strip().lower():
                btn = card.find_element(By.CSS_SELECTOR, ".add-to-cart-btn")
                for _ in range(cantidad):
                    self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", btn)
                    time.sleep(0.2)
                    wait.until(EC.element_to_be_clickable(btn))
                    btn.click()
                    time.sleep(pausa_visible)
                return self
        raise ValueError(f"No se encontró producto con nombre '{nombre_producto}'")

    def obtener_carrito_json(self):
        """Obtiene el carrito actual en formato JSON (vía JS en la página)."""
        return self.driver.execute_script("return window.getCartDataForAutomation();")

    def obtener_carrito(self):
        """Devuelve el carrito como diccionario Python."""
        raw = self.obtener_carrito_json()
        return json.loads(raw) if raw else {"items": [], "total": 0, "count": 0}

    def obtener_menu_json(self):
        """Obtiene el menú completo de la página en JSON."""
        return self.driver.execute_script("return window.getMenuDataForAutomation();")

    def obtener_menu(self):
        """Devuelve el menú como lista de diccionarios."""
        raw = self.obtener_menu_json()
        return json.loads(raw) if raw else []

    def abrir_panel_carrito(self):
        """Abre el panel lateral del carrito."""
        self.driver.find_element(By.CSS_SELECTOR, "[data-testid='cart-btn']").click()
        time.sleep(0.3)
        return self

    def abrir_reporte(self):
        """Abre el modal de reporte."""
        self.driver.find_element(By.CSS_SELECTOR, "[data-testid='report-btn']").click()
        time.sleep(0.3)
        return self

    def obtener_badge_carrito(self):
        """Devuelve el número mostrado en el badge del carrito."""
        badge = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='cart-badge']")
        return int(badge.text.strip() or 0)

    def formatear_mensaje_whatsapp(self, incluir_carrito=False):
        """
        Genera un mensaje formateado para WhatsApp (menú y opcionalmente carrito).
        Compatible con el uso en pyton.py (WhatsAppCafeteriaAutomation).
        """
        menu = self.obtener_menu()
        lineas = ["☕ *MENÚ CAFETERÍA Y&V*\n"]
        for p in menu:
            lineas.append(f"*{p['name']}* - {p['price']}")
        if incluir_carrito:
            cart = self.obtener_carrito()
            if cart["items"]:
                lineas.append("\n🛒 *Tu carrito:*")
                for item in cart["items"]:
                    lineas.append(f"  • {item['name']} x{item['quantity']} - ${item['subtotal']:,}")
                lineas.append(f"  Total: ${cart['total']:,}")
        lineas.append("\n📞 Para pedidos, contáctanos.")
        return "\n".join(lineas)

    def cerrar(self):
        """Cierra el navegador."""
        if self.driver:
            self.driver.quit()
            self.driver = None


def ejemplo_uso_local():
    """Ejemplo: abrir página, agregar productos en el navegador (visible) y mostrar resumen en terminal."""
    auto = CafeteriaSelenium(headless=False)
    try:
        auto.setup_driver()
        auto.abrir_pagina()
        print("Página abierta. La automatización se ejecuta en el navegador (Chrome).\n")

        # Menú (desde la página)
        menu = auto.obtener_menu()
        print("Menú:", json.dumps(menu, indent=2, ensure_ascii=False))

        # Agregar productos EN EL NAVEGADOR (con pausas para que se vea cada clic)
        print("\n--- Agregando productos en el navegador ---")
        auto.agregar_al_carrito_por_indice(0, pausa_visible=1.2)   # Tinto
        print("  + Tinto")
        auto.agregar_al_carrito_por_indice(1, pausa_visible=1.2)   # Capuccino
        print("  + Capuccino")
        auto.agregar_al_carrito_por_indice(0, pausa_visible=1.2)   # Otro Tinto
        print("  + Tinto (otro)")

        print("\nBadge carrito (en el navegador):", auto.obtener_badge_carrito())

        # Opcional: abrir panel del carrito para que se vea en el navegador
        auto.abrir_panel_carrito()
        time.sleep(1.5)

        # Carrito y mensaje (resumen en terminal)
        cart = auto.obtener_carrito()
        print("\nCarrito:", json.dumps(cart, indent=2, ensure_ascii=False))
        msg = auto.formatear_mensaje_whatsapp(incluir_carrito=True)
        print("\nMensaje WhatsApp:\n", msg)

        input("\nPresiona Enter para cerrar el navegador...")
    finally:
        auto.cerrar()


def integrar_con_whatsapp():
    """
    Ejemplo de integración con la automatización de WhatsApp (pyton.py).
    Descomenta y ajusta para enviar el menú o el pedido por WhatsApp.
    """
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from pyton import WhatsAppCafeteriaAutomation

    auto_cafe = CafeteriaSelenium(headless=False)
    try:
        auto_cafe.setup_driver()
        auto_cafe.abrir_pagina()
        mensaje = auto_cafe.formatear_mensaje_whatsapp(incluir_carrito=True)
        auto_cafe.cerrar()

        # Usar la clase de WhatsApp
        whatsapp = WhatsAppCafeteriaAutomation()
        whatsapp.setup_driver()
        whatsapp.abrir_whatsapp_web()
        # whatsapp.enviar_mensaje_a_contacto("Nombre Contacto", mensaje)
        # whatsapp.cerrar()
    except Exception as e:
        print("Error:", e)
        auto_cafe.cerrar()


if __name__ == "__main__":
    ejemplo_uso_local()
