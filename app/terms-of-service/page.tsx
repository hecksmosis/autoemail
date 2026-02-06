import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Volver al Inicio
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">Términos de Servicio</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Condiciones de Servicio
            </h2>
            <p>
              Al acceder y utilizar la plataforma GerpaTech ("Servicio"),
              aceptas estar sujeto a estos Términos de Servicio. Si no estás de
              acuerdo con estos términos, por favor no utilices nuestro
              Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Descripción del Servicio
            </h2>
            <p>
              GerpaTech proporciona una plataforma de software como servicio
              (SaaS) que automatiza el seguimiento de clientes, solicitudes de
              Reseñas de Google y campañas de correo electrónico de retención
              para negocios locales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Registro de Cuenta
            </h2>
            <p>
              Para utilizar el Servicio, los administradores de GerpaTech deben
              aprovisionarte una cuenta. Aceptas proporcionar información
              precisa, actual y completa durante el proceso de incorporación y
              mantener dicha información actualizada.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Responsabilidades del Usuario
            </h2>
            <p className="mb-2">Reconoces y aceptas que:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Tienes los derechos y el consentimiento necesarios para subir
                datos de clientes (direcciones de correo, nombres) a la
                plataforma.
              </li>
              <li>
                No utilizarás el Servicio para enviar spam, correos comerciales
                no solicitados o contenido que viole las leyes aplicables.
              </li>
              <li>
                Eres responsable de mantener la seguridad de las credenciales de
                tu cuenta.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Uso de Datos de Google
            </h2>
            <p>
              Nuestro Servicio se integra con las APIs de Google para enviar
              correos en tu nombre. Al utilizar esta integración, aceptas los
              Términos de Servicio de Google y nuestra Política de Privacidad
              con respecto al uso limitado de tus datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              6. Pagos y Suscripción
            </h2>
            <p>
              Los servicios se proporcionan mediante suscripción. Los términos
              de pago se acuerdan manualmente antes del aprovisionamiento de la
              cuenta. El incumplimiento del pago de las tarifas acordadas puede
              resultar en la suspensión o terminación de tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              7. Limitación de Responsabilidad
            </h2>
            <p>
              En la máxima medida permitida por la ley, GerpaTech no será
              responsable de ningún daño indirecto, incidental, especial,
              consecuente o punitivo, incluyendo sin limitación, pérdida de
              beneficios, datos, uso, buena voluntad, u otras pérdidas
              intangibles, resultantes de tu uso del Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              8. Cambios en los Términos
            </h2>
            <p>
              Nos reservamos el derecho de modificar estos términos en cualquier
              momento. Notificaremos cualquier cambio significativo publicando
              los nuevos Términos de Servicio en esta página.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              9. Contacto
            </h2>
            <p>
              Para cualquier pregunta relacionada con estos Términos,
              contáctanos en soporte@gerpatech.com.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 text-sm text-gray-500">
          Última Actualización: Febrero 2026
        </div>
      </main>
    </div>
  );
}
