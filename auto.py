import smtplib
from email.message import EmailMessage
import ssl # Para una conexión segura

# --- Configuración ---
remitente_email = "andresespanacarpio@gmail.com"  # Reemplaza con tu correo
contrasena = "1998" # Reemplaza con tu contraseña de aplicación
receptor_email = "manualcapriocarpio@gmail.com" # Reemplaza con el correo del destinatario

asunto = "Correo Automatizado de Prueba"
cuerpo = """
Hola, este es un correo de prueba enviado automáticamente usando Python.
¡Es genial la automatización!
"""

# --- Crear el mensaje ---
em = EmailMessage()
em['From'] = remitente_email
em['To'] = receptor_email
em['Subject'] = asunto
em.set_content(cuerpo)

# Añadir seguridad SSL
contexto = ssl.create_default_context()

# --- Enviar el correo ---
try:
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=contexto) as smtp:
        smtp.login(remitente_email, contrasena)
        smtp.sendmail(remitente_email, receptor_email, em.as_string())
    print("Correo enviado exitosamente.")
except Exception as e:
    print(f"Error al enviar el correo: {e}")
