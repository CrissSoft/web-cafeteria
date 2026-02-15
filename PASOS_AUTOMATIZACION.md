# Paso a paso: ejecutar y probar la automatización

## Requisitos previos

1. **Python 3.8 o superior**  
   - Comprueba: abre PowerShell o CMD y escribe `python --version`.

2. **Google Chrome instalado**  
   - La automatización usa Chrome. No uses solo Edge o Firefox a menos que cambies el código.

3. **ChromeDriver**  
   - Con Selenium 4.6+ suele descargarse solo.  
   - Si da error, instala el driver que coincida con tu versión de Chrome:  
     https://chromedriver.chromium.org/downloads  
   - O instala `webdriver-manager`:  
     `pip install webdriver-manager`  
     y en el código usa `webdriver.Chrome(service=Service(ChromeDriverManager().install()))`.

---

## Paso 1: Abrir la carpeta del proyecto

En PowerShell o CMD:

```bash
cd "C:\Users\CRISTIAN ANDRES\Documents\Practica Python"
```

(O la ruta donde tengas la carpeta **Practica Python**.)

---

## Paso 2: Crear el entorno virtual (recomendado)

```bash
python -m venv venv
```

Activar el entorno:

- **PowerShell:**  
  `.\venv\Scripts\Activate.ps1`
- **CMD:**  
  `venv\Scripts\activate.bat`

Verás algo como `(venv)` al inicio de la línea.

---

## Paso 3: Instalar dependencias

Con el entorno activado:

```bash
pip install -r requirements.txt
```

Eso instala **Selenium**. Si más adelante quieres que descargue ChromeDriver solo:

```bash
pip install webdriver-manager
```

---

## Paso 4: Probar la página de la cafetería (opcional)

Antes de automatizar, puedes abrir la página a mano:

1. En el explorador de archivos ve a:  
   `Practica Python\cafeteria\`
2. Haz doble clic en **index.html** (se abre en el navegador).
3. Prueba: agregar productos al carrito, abrir el Dashboard, el carrito lateral y Soporte.

Así verificas que la página y el `app.js` funcionan bien.

---

## Paso 5: Ejecutar la automatización

Desde la raíz del proyecto (**Practica Python**), ejecuta:

```bash
python cafeteria/cafeteria_selenium.py
```

O, si estás dentro de la carpeta **cafeteria**:

```bash
python cafeteria_selenium.py
```

---

## Paso 6: Qué hace el script al ejecutarse

1. Se abre una ventana de **Chrome**.
2. Se carga la página **index.html** de la cafetería (ruta `file:///...`).
3. En la **consola** (PowerShell/CMD) verás:
   - La URL abierta.
   - El **menú** en JSON.
   - Después de agregar productos: el **badge del carrito** (número de ítems).
   - El **carrito** en JSON.
   - Un **mensaje formateado para WhatsApp** (menú + carrito).
4. En el **navegador** verás que se agregaron al carrito: Tinto (2) y Capuccino (1).
5. Al final el script escribe: **Presiona Enter para cerrar...**
6. Cuando presionas **Enter**, se cierra Chrome y termina el script.

---

## Paso 7: Si algo falla

### Error: `'chromedriver' not found` o similar

- Asegúrate de tener **Chrome** instalado.
- Instala el driver manualmente o usa `webdriver-manager` (ver Requisitos previos).

### Error: `No module named 'selenium'`

- Activa el entorno virtual y ejecuta de nuevo:  
  `pip install -r requirements.txt`

### Error: `File not found` o la página no carga

- Ejecuta siempre desde la carpeta **Practica Python** (raíz del proyecto), no desde otra ruta:  
  `python cafeteria/cafeteria_selenium.py`

### Chrome se abre pero la página queda en blanco

- Espera unos segundos (la primera carga puede tardar).
- Comprueba que en **cafeteria** existan **index.html**, **app.js** y **styles.css**.

---

## Resumen rápido

| Paso | Acción |
|------|--------|
| 1 | `cd "C:\Users\CRISTIAN ANDRES\Documents\Practica Python"` |
| 2 | `python -m venv venv` → `.\venv\Scripts\Activate.ps1` |
| 3 | `pip install -r requirements.txt` |
| 4 | (Opcional) Abrir `cafeteria/index.html` en el navegador |
| 5 | `python cafeteria/cafeteria_selenium.py` |
| 6 | Revisar consola y ventana de Chrome; al final pulsar Enter para cerrar |

Cuando esto funcione, puedes modificar `ejemplo_uso_local()` en **cafeteria_selenium.py** para agregar otros productos, abrir el Dashboard o el panel del carrito y seguir probando.
