const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Send, Loader2, FileText, Sparkles } from 'lucide-react';

// Compose the SOAP draft into a readable notes field the doctor can edit
const composeSoapNotes = (draft) => {
    const lines = [];
    if (draft.subjective) lines.push(`S (Subjective): ${draft.subjective}`);
    if (draft.objective) lines.push(`O (Objective): ${draft.objective}`);
    if (draft.assessment) lines.push(`A (Assessment): ${draft.assessment}`);
    if (draft.plan) lines.push(`P (Plan): ${draft.plan}`);
    if (lines.length === 0 && draft.rawTranscript) lines.push(draft.rawTranscript);
    return lines.join('\n');
};

const PrescriptionModal = ({ isOpen, onClose, appointment, onPrescriptionSubmitted }) => {
    const [diagnosis, setDiagnosis] = useState('');
    const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '' }]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [draftLoading, setDraftLoading] = useState(false);
    const [draftSource, setDraftSource] = useState(null); // 'ai' | 'transcript' | null

    // On open, pull the AI scribe draft (if any) for this appointment and
    // pre-fill the form for the doctor to review. Resets cleanly when there's
    // no draft so a previous appointment's values never leak in.
    useEffect(() => {
        if (!isOpen || !appointment?._id) return;

        let cancelled = false;
        setDiagnosis('');
        setMedicines([{ name: '', dosage: '', frequency: '' }]);
        setNotes('');
        setError('');
        setDraftSource(null);
        setDraftLoading(true);

        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE}/api/ai/soap/${appointment._id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (cancelled) return;

                if (data.success && data.draft) {
                    const d = data.draft;
                    setDiagnosis(d.diagnosis || d.assessment || '');
                    setNotes(composeSoapNotes(d));
                    if (Array.isArray(d.medicines) && d.medicines.length > 0) {
                        setMedicines(d.medicines.map((m) => ({
                            name: m.name || '',
                            dosage: m.dosage || '',
                            frequency: m.frequency || '',
                        })));
                    }
                    setDraftSource(d.source || 'ai');
                }
            } catch {
                // No draft / offline — doctor fills the form manually
            } finally {
                if (!cancelled) setDraftLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [isOpen, appointment?._id]);

    if (!isOpen) return null;

    const addMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '' }]);
    };

    const removeMedicine = (index) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter((_, i) => i !== index));
        }
    };

    const updateMedicine = (index, field, value) => {
        const updated = [...medicines];
        updated[index][field] = value;
        setMedicines(updated);
    };

    const handleSubmit = async () => {
        if (!diagnosis.trim()) {
            setError('Please enter a diagnosis');
            return;
        }

        const validMedicines = medicines.filter(m => m.name.trim() && m.dosage.trim() && m.frequency.trim());
        if (validMedicines.length === 0) {
            setError('Please add at least one medicine with all details');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_BASE}/api/doctor/prescription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    appointmentId: appointment._id,
                    diagnosis,
                    medicines: validMedicines,
                    notes,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                if (onPrescriptionSubmitted) {
                    onPrescriptionSubmitted(appointment._id, data.prescription);
                }
                setTimeout(() => {
                    onClose();
                    setDiagnosis('');
                    setMedicines([{ name: '', dosage: '', frequency: '' }]);
                    setNotes('');
                    setSuccess(false);
                }, 1500);
            } else {
                setError(data.message || 'Failed to create prescription');
            }
        } catch {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const patientName = appointment?.patientName || 'Patient';

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Write Prescription</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-blue-100 text-sm mt-1">Prescription for {patientName}</p>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Prescription Created!</h3>
                            <p className="text-gray-500">The prescription has been saved successfully.</p>
                        </div>
                    ) : (
                        <>
                            {draftLoading && (
                                <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Checking for AI consultation notes…
                                </div>
                            )}

                            {!draftLoading && draftSource && (
                                <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
                                    <Sparkles className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700">
                                        {draftSource === 'ai'
                                            ? 'Pre-filled from your AI-drafted SOAP note. Please review and edit before saving.'
                                            : 'Pre-filled from your consultation transcript (AI structuring was unavailable). Please review before saving.'}
                                    </p>
                                </div>
                            )}

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Diagnosis *
                                </label>
                                <textarea
                                    value={diagnosis}
                                    onChange={(e) => setDiagnosis(e.target.value)}
                                    placeholder="Enter diagnosis..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all outline-none resize-none"
                                />
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Medicines *
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addMedicine}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Medicine
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {medicines.map((medicine, index) => (
                                        <div key={index} className="flex gap-2 items-start">
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                                <input
                                                    type="text"
                                                    value={medicine.name}
                                                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                                                    placeholder="Medicine name"
                                                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all outline-none text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    value={medicine.dosage}
                                                    onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                                                    placeholder="Dosage (e.g., 500mg)"
                                                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all outline-none text-sm"
                                                />
                                                <input
                                                    type="text"
                                                    value={medicine.frequency}
                                                    onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                                                    placeholder="Frequency (e.g., 2x daily)"
                                                    className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all outline-none text-sm"
                                                />
                                            </div>
                                            {medicines.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeMedicine(index)}
                                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional instructions..."
                                    rows={2}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500/60 focus:border-transparent transition-all outline-none resize-none"
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Save Prescription</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrescriptionModal;
