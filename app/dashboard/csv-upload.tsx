"use client";

import { useState, useRef } from "react";
import { X, Upload, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";

type CSVRow = Record<string, string>;

type ColumnMapping = {
  name: string | null;
  email: string | null;
  date: string | null;
  service: string | null;
};

type ServiceTagMapping = Record<string, string>; // original → normalized

export function CSVUploadWithMapping({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "map" | "confirm">("upload");
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: null,
    email: null,
    date: null,
    service: null,
  });
  const [serviceTagMapping, setServiceTagMapping] = useState<ServiceTagMapping>(
    {},
  );
  const [uniqueServices, setUniqueServices] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        if (data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        const detectedHeaders = Object.keys(data[0]);
        setCsvData(data);
        setHeaders(detectedHeaders);

        // Auto-detect columns
        const autoMapping: ColumnMapping = {
          name: detectColumn(detectedHeaders, ["name", "nombre", "cliente"]),
          email: detectColumn(detectedHeaders, ["email", "correo", "e-mail"]),
          date: detectColumn(detectedHeaders, [
            "date",
            "fecha",
            "last_visit",
            "visit_date",
          ]),
          service: detectColumn(detectedHeaders, [
            "service",
            "servicio",
            "treatment",
            "tratamiento",
          ]),
        };
        setColumnMapping(autoMapping);

        // Extract unique services if service column detected
        if (autoMapping.service) {
          const services = [
            ...new Set(
              data
                .map((row) => row[autoMapping.service!])
                .filter(Boolean)
                .map((s) => s.trim()),
            ),
          ];
          setUniqueServices(services);

          // Initialize service mapping with normalized versions
          const initialMapping: ServiceTagMapping = {};
          services.forEach((service) => {
            initialMapping[service] = normalizeServiceTag(service);
          });
          setServiceTagMapping(initialMapping);
        }

        setStep("map");
        setIsOpen(true);
      },
      error: () => {
        toast.error("Failed to parse CSV file");
      },
    });
  };

  const detectColumn = (
    headers: string[],
    keywords: string[],
  ): string | null => {
    const normalized = headers.map((h) => h.toLowerCase().trim());
    for (const keyword of keywords) {
      const index = normalized.findIndex((h) => h.includes(keyword));
      if (index !== -1) return headers[index];
    }
    return null;
  };

  const normalizeServiceTag = (service: string): string => {
    return service
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
  };

  const handleUpload = async () => {
    if (!columnMapping.email || !columnMapping.date) {
      toast.error("Email and Date columns are required");
      return;
    }

    setUploading(true);

    try {
      // Transform CSV data using mappings
      const transformedRows = csvData.map((row) => ({
        Name: columnMapping.name ? row[columnMapping.name] : "",
        Email: row[columnMapping.email!],
        Date: row[columnMapping.date!],
        Service: columnMapping.service
          ? serviceTagMapping[row[columnMapping.service]] || ""
          : "",
      }));

      const response = await fetch("/api/customers/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: transformedRows }),
      });

      if (response.ok) {
        toast.success(
          `Successfully uploaded ${transformedRows.length} customers`,
        );
        onSuccess();
        handleClose();
      } else {
        toast.error("Failed to upload CSV");
      }
    } catch (error) {
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setStep("upload");
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({ name: null, email: null, date: null, service: null });
    setServiceTagMapping({});
    setUniqueServices([]);
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
        }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="h-9 px-4 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors flex items-center gap-2"
      >
        <Upload size={16} />
        <span>Import CSV</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-3xl bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {step === "map" ? "Map Columns" : "Confirm Upload"}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {step === "map" && (
              <div className="p-6 space-y-6">
                <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="text-blue-400 flex-shrink-0 mt-0.5"
                      size={16}
                    />
                    <div className="text-sm text-blue-400">
                      <strong>Map your CSV columns</strong>
                      <p className="text-xs text-blue-400/70 mt-1">
                        Tell us which columns contain customer data. Service is
                        optional but recommended for automated retention.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column Mappings */}
                <div className="space-y-4">
                  <MappingSelect
                    label="Customer Name"
                    required={false}
                    headers={headers}
                    value={columnMapping.name}
                    onChange={(val) =>
                      setColumnMapping({ ...columnMapping, name: val })
                    }
                  />

                  <MappingSelect
                    label="Email Address"
                    required={true}
                    headers={headers}
                    value={columnMapping.email}
                    onChange={(val) =>
                      setColumnMapping({ ...columnMapping, email: val })
                    }
                  />

                  <MappingSelect
                    label="Visit Date"
                    required={true}
                    headers={headers}
                    value={columnMapping.date}
                    onChange={(val) =>
                      setColumnMapping({ ...columnMapping, date: val })
                    }
                  />

                  <MappingSelect
                    label="Service / Treatment"
                    required={false}
                    headers={headers}
                    value={columnMapping.service}
                    onChange={(val) =>
                      setColumnMapping({ ...columnMapping, service: val })
                    }
                    helperText="For retention programs - must match program service tags"
                  />
                </div>

                {/* Service Tag Normalization */}
                {columnMapping.service && uniqueServices.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle size={16} className="text-green-500" />
                      <strong>Service Tag Normalization</strong>
                    </div>
                    <p className="text-xs text-gray-500">
                      We've detected {uniqueServices.length} unique services.
                      You can edit the normalized tags below:
                    </p>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {uniqueServices.map((service) => (
                        <div
                          key={service}
                          className="flex items-center gap-3 bg-[#111] p-3 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                              {service}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <ArrowRight size={12} />
                              Normalized tag
                            </div>
                          </div>
                          <input
                            type="text"
                            value={serviceTagMapping[service]}
                            onChange={(e) =>
                              setServiceTagMapping({
                                ...serviceTagMapping,
                                [service]: e.target.value,
                              })
                            }
                            className="w-48 h-8 px-2 rounded-md bg-black border border-gray-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    disabled={!columnMapping.email || !columnMapping.date}
                    className="flex-1 h-10 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Review & Upload
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="p-6 space-y-6">
                <div className="bg-green-900/10 border border-green-900/30 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      className="text-green-400 flex-shrink-0 mt-0.5"
                      size={16}
                    />
                    <div className="text-sm text-green-400">
                      <strong>
                        Ready to upload {csvData.length} customers
                      </strong>
                      <p className="text-xs text-green-400/70 mt-1">
                        Review your mappings below before uploading.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-500">Name Column:</span>
                    <span className="text-white font-medium">
                      {columnMapping.name || "Not mapped"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-500">Email Column:</span>
                    <span className="text-white font-medium">
                      {columnMapping.email}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-500">Date Column:</span>
                    <span className="text-white font-medium">
                      {columnMapping.date}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-500">Service Column:</span>
                    <span className="text-white font-medium">
                      {columnMapping.service || "Not mapped"}
                    </span>
                  </div>
                  {columnMapping.service && (
                    <div className="pt-2">
                      <div className="text-xs text-gray-500 mb-2">
                        Service tags to be used:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.values(serviceTagMapping)
                          .filter((v, i, arr) => arr.indexOf(v) === i)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep("map")}
                    className="flex-1 h-10 rounded-md border border-gray-800 text-sm font-medium hover:bg-gray-900 transition-colors"
                  >
                    Back to Mapping
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 h-10 rounded-md bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Confirm & Upload"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function MappingSelect({
  label,
  required,
  headers,
  value,
  onChange,
  helperText,
}: {
  label: string;
  required: boolean;
  headers: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  helperText?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-400 uppercase">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full h-10 px-3 rounded-md bg-[#111] border border-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
      >
        <option value="">-- Not mapped --</option>
        {headers.map((header) => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
      {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}
