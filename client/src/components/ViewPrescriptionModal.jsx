const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect } from 'react';
import { X, Loader2, FileText, Pill, User, Calendar, Stethoscope } from 'lucide-react';

const ViewPrescriptionModal = ({ isOpen, onClose, appointmentId }) => {
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchPrescription();
        }
    }, [isOpen, appointmentId]);

    const fetchPrescription = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/api/doctor/prescription/${appointmentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (data.success) {
                setPrescription(data.prescription);
            } else {
                setError(data.message || 'Failed to fetch prescription');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
                style={{
                    background: '#0c0c0e',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 0 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
                }}
            >
                <div className="relative px-6 py-5 border-b border-zinc-800/60">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-rose-600/15 flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-rose-500/80">
                            MedOrbit
                        </span>
                    </div>
                    <h2 className="text-lg font-bold text-white mt-2">Prescription</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Official medical document</p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-110px)] custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-16">
                            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto mb-3" />
                            <p className="text-zinc-500 text-sm">Loading prescription…</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <X className="w-6 h-6 text-red-400" />
                            </div>
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    ) : prescription ? (
                        <div className="space-y-5">

                            <div className="flex flex-wrap gap-4">
                                <div
                                    className="flex-1 min-w-[180px] flex items-center gap-3 px-4 py-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <div className="w-9 h-9 rounded-lg bg-rose-600/10 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-rose-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Prescribed by</p>
                                        <p className="text-sm font-semibold text-white">
                                            {prescription.doctorId?.name || 'Doctor'}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    className="flex-1 min-w-[180px] flex items-center gap-3 px-4 py-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Date issued</p>
                                        <p className="text-sm font-semibold text-white">
                                            {formatDate(prescription.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-zinc-800/50" />

                            <div>
                                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-rose-500/60" />
                                    Diagnosis
                                </h3>
                                <div
                                    className="rounded-xl px-4 py-3"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                >
                                    <p className="text-zinc-200 text-sm leading-relaxed">{prescription.diagnosis}</p>
                                </div>
                            </div>

                            {prescription.medicines && prescription.medicines.length > 0 && (
                                <div>
                                    <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2 flex items-center gap-1.5">
                                        <Pill className="w-3.5 h-3.5 text-purple-500/60" />
                                        Medicines
                                    </h3>
                                    <div
                                        className="rounded-xl overflow-hidden"
                                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                                    >
                                        <table className="w-full">
                                            <thead>
                                                <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                                                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Medicine</th>
                                                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Dosage</th>
                                                    <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Frequency</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {prescription.medicines.map((med, index) => (
                                                    <tr
                                                        key={index}
                                                        className="transition-colors hover:bg-white/[0.02]"
                                                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
                                                    >
                                                        <td className="px-4 py-3 text-sm text-white font-medium">{med.name}</td>
                                                        <td className="px-4 py-3 text-sm text-zinc-400">{med.dosage}</td>
                                                        <td className="px-4 py-3 text-sm text-zinc-400">{med.frequency}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {prescription.notes && (
                                <div>
                                    <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2">
                                        Additional Notes
                                    </h3>
                                    <div
                                        className="rounded-xl px-4 py-3"
                                        style={{
                                            background: 'rgba(251, 191, 36, 0.04)',
                                            border: '1px solid rgba(251, 191, 36, 0.08)',
                                        }}
                                    >
                                        <p className="text-zinc-300 text-sm leading-relaxed">{prescription.notes}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-3 border-t border-zinc-800/40 flex items-center justify-between">
                                <p className="text-[10px] text-zinc-600">
                                    This is a digitally issued document from MedOrbit
                                </p>
                                <span className="text-[10px] text-zinc-700 font-mono">
                                    #{appointmentId?.slice(-8)?.toUpperCase()}
                                </span>
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ViewPrescriptionModal;
