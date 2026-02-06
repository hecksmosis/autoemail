import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              1. Introducción
            </h2>
            <p>
              GerpaTech ("nosotros", "nuestro") se compromete a proteger tu
              privacidad. Esta Política de Privacidad explica cómo recopilamos,
              usamos y compartimos tu información personal cuando utilizas
              nuestra plataforma de automatización de reseñas y retención.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              2. Información que Recopilamos
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Información de la Cuenta:</strong> Recopilamos el nombre
                de tu negocio y dirección de correo electrónico cuando se te
                aprovisiona una cuenta.
              </li>
              <li>
                <strong>Datos de Clientes:</strong> Para proporcionar nuestros
                servicios, procesamos datos que subes sobre tus clientes
                (Nombre, Correo, Fecha de Visita, Tipo de Servicio). Estos datos
                se utilizan únicamente con el propósito de enviar correos
                automatizados en tu nombre.
              </li>
              <li>
                <strong>Datos de Usuario de Google:</strong> Si eliges conectar
                tu cuenta de Google, accedemos a tu dirección de correo
                electrónico para identificarte y usamos la API de Gmail para
                enviar correos en tu nombre.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              3. Uso de Datos de Google
            </h2>
            <p className="mb-2">
              Nuestra aplicación accede a los datos de usuario de Google con el
              propósito específico de automatizar la comunicación con tus
              clientes. Nos adherimos estrictamente a la{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-blue-400 hover:underline"
                target="_blank"
              >
                Política de Datos de Usuario de los Servicios de API de Google
              </a>
              , incluyendo los requisitos de Uso Limitado.
            </p>
            <p className="mb-2">Específicamente:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Usamos el alcance{" "}
                <code>https://www.googleapis.com/auth/gmail.send</code> para
                enviar correos a tus clientes según tu configuración en el
                panel.
              </li>
              <li>
                Usamos el alcance{" "}
                <code>https://www.googleapis.com/auth/userinfo.email</code> para
                mostrar qué cuenta está conectada actualmente.
              </li>
              <li>
                <strong>No</strong> leemos, borramos ni organizamos tus correos
                existentes.
              </li>
              <li>
                <strong>No</strong> compartimos tus datos de usuario de Google
                con herramientas de IA de terceros ni plataformas de publicidad
                externas.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              4. Seguridad de los Datos
            </h2>
            <p>
              Implementamos encriptación estándar de la industria para proteger
              tus datos. Tus tokens de Acceso y Actualización de Google se
              almacenan encriptados en nuestra base de datos utilizando
              encriptación AES-256.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">
              5. Contáctanos
            </h2>
            <p>
              Si tienes alguna pregunta sobre esta Política de Privacidad,
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
