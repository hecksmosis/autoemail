"use client";

import { useState, useRef } from "react";
import {
  Search,
  UploadCloud,
  Plus,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { CSVUploadWithMapping } from "./csv-upload";
import { EnhancedCustomerRow } from "./customer-row";
import CustomerModal from "./customer-modal";

type Customer = {
  id: string;
  name: string;
  email: string;
  last_visit_date: string;
  created_at: string;
  status: "pending" | "contacted" | "reviewed";
  last_contacted_at: string | null;
  service_tag?: string | null;
};

interface CustomersTabProps {
  initialCustomers: Customer[];
  tenantId: string;
  fetchCustomers: () => Promise<void>;
}

export default function CustomersTab({
  initialCustomers,
  tenantId,
  fetchCustomers,
}: CustomersTabProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado Local
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Estado Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Estado Confirmación
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const filteredCustomers = initialCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- HANDLERS ---

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]?.type === "text/csv") {
      fileInputRef.current!.files = e.dataTransfer.files;
      fileInputRef.current!.dispatchEvent(
        new Event("change", { bubbles: true }),
      );
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Eliminar Cliente",
      message: `¿Estás seguro de que quieres eliminar a "${name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", id);
        if (error) {
          toast.error("Error al eliminar");
        } else {
          toast.success("Cliente eliminado");
          fetchCustomers();
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tu lista de clientes y asigna campañas de correo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CSVUploadWithMapping onSuccess={fetchCustomers} />
          <button
            onClick={openAddModal}
            className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Añadir Cliente</span>
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Estadísticas y Zona de Arrastre */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
            <div className="text-gray-500 text-sm font-medium uppercase">
              Total Clientes
            </div>
            <div className="text-3xl font-bold mt-2 text-white">
              {initialCustomers.length}
            </div>
          </div>
          <div className="p-6 rounded-xl border border-gray-800 bg-[#0A0A0A]">
            <div className="text-gray-500 text-sm font-medium uppercase">
              Reseñas Activas
            </div>
            <div className="text-3xl font-bold mt-2 text-white">
              {initialCustomers.filter((c) => c.status === "reviewed").length}
            </div>
          </div>

          {/* Zona de Importación Rápida */}
          <div
            onClick={() => {
              document
                .querySelector<HTMLButtonElement>(
                  "button[aria-label='Import CSV']",
                )
                ?.click();
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-6 rounded-xl border border-dashed bg-[#0A0A0A] transition-all cursor-pointer flex flex-col items-center justify-center text-center group ${
              isDragging
                ? "border-white bg-gray-900"
                : "border-gray-700 hover:bg-[#111] hover:border-gray-500"
            }`}
          >
            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileSpreadsheet
                size={20}
                className={isDragging ? "text-white" : "text-gray-400"}
              />
            </div>
            <p className="text-sm font-medium text-gray-300">
              Importación Rápida
            </p>
            <p className="text-xs text-gray-500">Arrastra tu CSV aquí</p>
          </div>
        </div>

        {/* Tabla de Datos */}
        <div className="border border-gray-800 rounded-xl overflow-visible bg-[#0A0A0A] min-h-[400px]">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-md bg-black border border-gray-800 text-sm text-gray-300 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-white focus:border-white transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-visible">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900/50 text-gray-400 font-medium">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Última Visita</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredCustomers.map((customer) => (
                  <EnhancedCustomerRow
                    key={customer.id}
                    customer={customer}
                    onDelete={handleDeleteCustomer}
                    onUpdate={(id, updates) => {
                      fetchCustomers();
                    }}
                    onEdit={() => openEditModal(customer)}
                  />
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      No se encontraron clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Añadir/Editar */}
      {isModalOpen && (
        <CustomerModal
          tenantId={tenantId}
          initialData={editingCustomer}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchCustomers();
          }}
        />
      )}

      {/* Modal Confirmación */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {confirmModal.title}
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  {confirmModal.message}
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() =>
                  setConfirmModal((p) => ({ ...p, isOpen: false }))
                }
                className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 h-10 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
