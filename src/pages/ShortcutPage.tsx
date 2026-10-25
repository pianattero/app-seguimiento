import { Card, Page } from '../components/ui'

/** Instrucciones para crear el Atajo que envía el último entreno del Watch a la app. */
export function ShortcutPage() {
  const base = `${window.location.origin}${window.location.pathname}#/importar`
  const example = `${base}?tipo=running&inicio=2026-10-27T19:05:00&duracion=32 min&distancia=5,2 km&kcal=380&pulso=152&pulso_max=171`
  return (
    <Page title="Conectar el Apple Watch" actions={<a className="text-button" href="#/ajustes">Ajustes</a>}>
      <Card
        title="Cómo funciona"
        footer="Usa la app en Safari (guárdala en Favoritos). Si la añades a la pantalla de inicio, el Atajo abriría Safari y los datos no llegarían a esa copia."
      >
        <div className="row prose">
          Un Atajo del iPhone lee el último entreno guardado en Salud y abre esta web con los datos en la dirección. La app
          te enseña lo recibido y lo guarda al pulsar «Guardar».
        </div>
      </Card>

      <Card title="Crear el Atajo «Enviar entreno»">
        <ol className="steps">
          <li>Abre la app <b>Atajos</b>, pulsa <b>+</b> y llámalo «Enviar entreno».</li>
          <li>
            Añade <b>Buscar muestras de salud</b>: tipo <b>Entrenamientos</b>, ordenar por <b>Fecha de inicio</b>, de la más
            reciente a la más antigua, limitar a <b>1</b>.
          </li>
          <li>
            Añade <b>Formatear fecha</b> con la <b>Fecha de inicio</b> del entreno y formato <b>ISO 8601</b> (con hora).
          </li>
          <li>
            Añade <b>Texto</b> con esta dirección, cambiando cada palabra en mayúsculas por la variable del entreno:
            <code className="code">{`${base}?tipo=TIPO&inicio=FECHA&duracion=DURACIÓN&distancia=DISTANCIA&kcal=ENERGÍA`}</code>
          </li>
          <li>Añade <b>Abrir URL</b> con ese texto.</li>
          <li>
            Opcional: en <b>Automatización</b>, crea una con el disparador <b>Entreno del Apple Watch</b> «al terminar» que
            ejecute el Atajo.
          </li>
        </ol>
      </Card>

      <Card title="Formato que entiende la app" footer="Si un paso no aparece igual en tu iPhone, dímelo y lo adaptamos.">
        <div className="row prose">
          Tipo: «running» o «fuerza» (también vale el nombre que da Salud). Duración en minutos, segundos («1920 s») o
          «0:32:10». Distancia en km o metros. Ejemplo completo:
          <code className="code">{example}</code>
        </div>
      </Card>

      <Card title="Sin Atajo">
        <div className="row prose">
          También puedes abrir el entreno en la pestaña Entrenos y copiar a mano la distancia, el tiempo y el pulso desde la
          app Fitness.
        </div>
      </Card>
    </Page>
  )
}
