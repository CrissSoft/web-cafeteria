"""
Ejemplo de Automatización de WhatsApp para Página de Productos de Cafetería
Este script automatiza el envío de mensajes de WhatsApp con información de productos
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
import time
import json

class WhatsAppCafeteriaAutomation:
    def __init__(self):
        """Inicializa la automatización de WhatsApp"""
        self.driver = None
        self.productos = []
        
    def setup_driver(self):
        """Configura el driver de Chrome para WhatsApp Web"""
        chrome_options = Options()
        # Mantener el navegador abierto después de la ejecución
        chrome_options.add_experimental_option("detach", True)
        # Opcional: ejecutar en modo headless (sin ventana)
        # chrome_options.add_argument("--headless")
        
        # Inicializar el driver
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.maximize_window()
        
    def abrir_whatsapp_web(self):
        """Abre WhatsApp Web"""
        print("Abriendo WhatsApp Web...")
        self.driver.get("https://web.whatsapp.com")
        print("Por favor, escanea el código QR con tu teléfono...")
        input("Presiona Enter después de escanear el código QR y conectar WhatsApp...")
        
    def obtener_productos_cafeteria(self):
        """
        Simula la obtención de productos de una página web de cafetería
        En un caso real, aquí harías web scraping de la página de productos
        """
        # Ejemplo de productos de cafetería
        self.productos = [
            {
                "nombre": "Café Espresso",
                "precio": "$2.50",
                "descripcion": "Café concentrado y aromático",
                "disponible": True
            },
            {
                "nombre": "Cappuccino",
                "precio": "$3.00",
                "descripcion": "Café con leche espumada",
                "disponible": True
            },
            {
                "nombre": "Latte",
                "precio": "$3.50",
                "descripcion": "Café con leche vaporizada",
                "disponible": True
            },
            {
                "nombre": "Muffin de Chocolate",
                "precio": "$2.00",
                "descripcion": "Delicioso muffin casero",
                "disponible": False
            },
            {
                "nombre": "Croissant",
                "precio": "$2.50",
                "descripcion": "Croissant recién horneado",
                "disponible": True
            }
        ]
        return self.productos
    
    def formatear_mensaje_productos(self):
        """Formatea los productos en un mensaje para WhatsApp"""
        mensaje = "☕ *MENÚ DE CAFETERÍA*\n\n"
        mensaje += "Productos disponibles:\n\n"
        
        for producto in self.productos:
            if producto["disponible"]:
                estado = "✅ Disponible"
            else:
                estado = "❌ Agotado"
                
            mensaje += f"*{producto['nombre']}*\n"
            mensaje += f"💰 Precio: {producto['precio']}\n"
            mensaje += f"📝 {producto['descripcion']}\n"
            mensaje += f"{estado}\n"
            mensaje += "-" * 30 + "\n\n"
        
        mensaje += "\n📞 Para pedidos, contáctanos!\n"
        mensaje += "🕐 Horario: Lunes a Viernes 7:00 AM - 6:00 PM"
        
        return mensaje
    
    def enviar_mensaje_whatsapp(self, numero_telefono, mensaje):
        """
        Envía un mensaje de WhatsApp a un número específico
        
        Args:
            numero_telefono: Número de teléfono con código de país (ej: +521234567890)
            mensaje: Mensaje a enviar
        """
        try:
            # Construir la URL de WhatsApp con el número
            url = f"https://web.whatsapp.com/send?phone={numero_telefono}&text={mensaje}"
            self.driver.get(url)
            
            # Esperar a que se cargue el chat
            wait = WebDriverWait(self.driver, 20)
            input_box = wait.until(
                EC.presence_of_element_located((
                    By.XPATH, 
                    '//div[@contenteditable="true"][@data-tab="10"]'
                ))
            )
            
            # Enviar el mensaje
            input_box.send_keys(Keys.ENTER)
            time.sleep(2)
            
            print(f"✅ Mensaje enviado exitosamente a {numero_telefono}")
            return True
            
        except Exception as e:
            print(f"❌ Error al enviar mensaje: {str(e)}")
            return False
    
    def enviar_mensaje_a_contacto(self, nombre_contacto, mensaje):
        """
        Envía un mensaje a un contacto por su nombre
        
        Args:
            nombre_contacto: Nombre del contacto en WhatsApp
            mensaje: Mensaje a enviar
        """
        try:
            # Buscar el contacto
            search_box = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((
                    By.XPATH, 
                    '//div[@contenteditable="true"][@data-tab="3"]'
                ))
            )
            search_box.clear()
            search_box.send_keys(nombre_contacto)
            time.sleep(2)
            
            # Hacer clic en el primer resultado
            first_result = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((
                    By.XPATH, 
                    '//span[@title="' + nombre_contacto + '"]'
                ))
            )
            first_result.click()
            time.sleep(2)
            
            # Escribir y enviar el mensaje
            message_box = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((
                    By.XPATH, 
                    '//div[@contenteditable="true"][@data-tab="10"]'
                ))
            )
            message_box.send_keys(mensaje)
            time.sleep(1)
            message_box.send_keys(Keys.ENTER)
            time.sleep(2)
            
            print(f"✅ Mensaje enviado exitosamente a {nombre_contacto}")
            return True
            
        except Exception as e:
            print(f"❌ Error al enviar mensaje: {str(e)}")
            return False
    
    def enviar_mensajes_masivos(self, lista_contactos, mensaje):
        """
        Envía mensajes a múltiples contactos
        
        Args:
            lista_contactos: Lista de nombres de contactos o números de teléfono
            mensaje: Mensaje a enviar
        """
        resultados = []
        for contacto in lista_contactos:
            print(f"Enviando mensaje a {contacto}...")
            if contacto.startswith("+"):
                # Es un número de teléfono
                resultado = self.enviar_mensaje_whatsapp(contacto, mensaje)
            else:
                # Es un nombre de contacto
                resultado = self.enviar_mensaje_a_contacto(contacto, mensaje)
            
            resultados.append({"contacto": contacto, "enviado": resultado})
            time.sleep(3)  # Esperar entre mensajes para evitar spam
        
        return resultados
    
    def cerrar(self):
        """Cierra el navegador"""
        if self.driver:
            print("Cerrando navegador...")
            self.driver.quit()


def ejemplo_uso():
    """Ejemplo de cómo usar la automatización"""
    
    # Crear instancia de la automatización
    automation = WhatsAppCafeteriaAutomation()
    
    try:
        # Configurar el driver
        automation.setup_driver()
        
        # Abrir WhatsApp Web
        automation.abrir_whatsapp_web()
        
        # Obtener productos de la cafetería
        productos = automation.obtener_productos_cafeteria()
        print(f"\n✅ Se obtuvieron {len(productos)} productos\n")
        
        # Formatear mensaje con los productos
        mensaje = automation.formatear_mensaje_productos()
        print("Mensaje formateado:")
        print(mensaje)
        print("\n" + "="*50 + "\n")
        
        # Ejemplo 1: Enviar mensaje a un contacto por nombre
        # automation.enviar_mensaje_a_contacto("Juan Pérez", mensaje)
        
        # Ejemplo 2: Enviar mensaje a un número de teléfono
        # automation.enviar_mensaje_whatsapp("+521234567890", mensaje)
        
        # Ejemplo 3: Enviar mensajes masivos
        # contactos = ["Cliente 1", "Cliente 2", "+521234567890"]
        # automation.enviar_mensajes_masivos(contactos, mensaje)
        
        print("Automatización lista. Puedes usar los métodos para enviar mensajes.")
        print("Descomenta las líneas de ejemplo para enviar mensajes reales.")
        
        # Mantener el navegador abierto
        input("\nPresiona Enter para cerrar el navegador...")
        
    except KeyboardInterrupt:
        print("\n\nOperación cancelada por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
    finally:
        automation.cerrar()


if __name__ == "__main__":
    ejemplo_uso()

