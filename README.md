# Prueba de concepto de descargas
Esta app nació como prueba de concepto para la integración de las descargas en el frontal de Classroom.
Esta herramienta emula dos formas de descarga independientes: Especificando ids de recurso o especificando
un activity (libro/unidad/lección). De ambas formas empieza un proceso de descarga, que realiza
una petición al servicio de contents y procesa esa información para crear una lista de recursos
lanzables desde local.

Se utiliza un gestor de descargas que funciona de la siguiente manera: Cuando se obtiene la información
de un recurso se encola la descarga para hacerlas paulatinas y secuenciales. Una vez descarga el
archivo, si es un zip lo descomprime y luego borra el zip.

Esta aplicación utiliza localStorage para emular una base de datos. Lo que se guarda en él es
la relación entre el id de un recurso y la url local para acceder a él. De esta manera se sabe
en todo momento cómo se lanza cada recurso.

## Requerimientos
Esta app se ha desarrollado en las siguientes tecnologías:

- Node 10.16.0
- Npm 6.9.0

## Despliegue
Para desplegar este proyecto, se deberán ejecutar los siguientes comandos:

- Instalar las dependencias
```bash
npm install
```

-  Ejecutar la aplicación
```bash
npm start
```
