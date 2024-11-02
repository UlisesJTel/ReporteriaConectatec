from app import create_app
import os



app = create_app()

"""
if __name__ == '__main__':
    app.run(debug=True)
"""



if __name__ == '__main__':
    # Crea el directorio de UPLOAD_FOLDER si no existe
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    # Ejecuta la aplicación con debug controlado por la variable de entorno
    app.run(
        debug=os.environ.get("DEBUG", "False").lower() in ["true", "1"],
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
